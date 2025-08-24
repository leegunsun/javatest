package com.example.open.domain.post.service;

import com.example.open.common.service.RedisService;
import com.example.open.domain.post.dto.PostDto;
import com.example.open.domain.post.dto.PostListResponse;
import com.example.open.domain.post.entity.Post;
import com.example.open.domain.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final RedisService redisService;
    private final JdbcTemplate jdbcTemplate;

    /**
     * 게시물 목록 조회 (가상 번호 포함)
     */
    @Cacheable(value = "postList", key = "#boardId + ':' + #page + ':' + #size")
    public PostListResponse getPosts(Integer boardId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage = postRepository.findPostsWithVirtualNumber(boardId, pageable);

        // DTO 변환 및 가상 번호 보정
        long totalCount = postPage.getTotalElements();
        List<PostDto> postDtos = postPage.getContent().stream()
                .map(post -> {
                    PostDto dto = PostDto.from(post);
                    // 페이지 기반 가상 번호 재계산 (더 정확한 방법)
                    if (post.getVirtualNumber() == null) {
                        long virtualNum = totalCount - (page * size) -
                                postPage.getContent().indexOf(post);
                        dto.setVirtualNumber(virtualNum);
                    }
                    return dto;
                })
                .toList();

        return PostListResponse.builder()
                .posts(postDtos)
                .currentPage(page)
                .totalPages(postPage.getTotalPages())
                .totalElements(totalCount)
                .build();
    }

    /**
     * 게시물 상세 조회
     */
//    public PostDto getPost(Long postId) {
//        Post post = postRepository.findPostWithVirtualNumber(postId);
//
//        // 조회수 증가 (비동기 처리)
//        incrementViewCountAsync(postId);
//
//        return PostDto.from(post);
//    }

    /**
     * 게시물 생성
     */
    @Transactional
    @CacheEvict(value = "postList", allEntries = true)
    public PostDto createPost(PostDto dto, Long authorId) {
        Post post = Post.builder()
                .boardId(dto.getBoardId())
                .title(dto.getTitle())
                .content(dto.getContent())
                .authorId(authorId)
                .build();

        Post savedPost = postRepository.save(post);

        // 가상 번호 계산
        long totalCount = postRepository.countActivePostsByBoardId(dto.getBoardId());
        savedPost.setVirtualNumber(totalCount);

        return PostDto.from(savedPost);
    }

    /**
     * Soft Delete 수행
     */
    @Transactional
    @CacheEvict(value = {"postList", "post"}, allEntries = true)
    public void deletePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));

        // Soft Delete 수행
        post.setIsDeleted(true);
        post.setDeletedAt(LocalDateTime.now());
        post.setDeletedBy(userId);

        postRepository.save(post);

        log.info("Post soft deleted: id={}, deletedBy={}", postId, userId);
    }

    /**
     * 게시물 복구 (관리자 기능)
     */
    @Transactional
    @CacheEvict(value = {"postList", "post"}, allEntries = true)
    public void restorePost(Long postId) {
        String query = """
            UPDATE posts 
            SET is_deleted = 0, 
                deleted_at = NULL, 
                deleted_by = NULL 
            WHERE id = ?
            """;

        jdbcTemplate.update(query, postId);

        log.info("Post restored: id={}", postId);
    }

    /**
     * 비동기 조회수 증가 (JDBC 사용)
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void incrementViewCountAsync(Long postId) {
        String query = "UPDATE posts SET view_count = view_count + 1 WHERE id = ?";
        int updatedRows = jdbcTemplate.update(query, postId);
        
        if (updatedRows > 0) {
            log.debug("View count incremented for post id: {}", postId);
        } else {
            log.warn("Failed to increment view count for post id: {} (post not found)", postId);
        }
    }

    /**
     * JDBC를 사용한 직접 쿼리 실행 예제들
     */

    /**
     * JDBC를 사용한 게시물 통계 조회
     */
    public Map<String, Object> getPostStatistics(Integer boardId) {
        String query = """
            SELECT 
                COUNT(*) as total_posts,
                COUNT(CASE WHEN is_deleted = 0 THEN 1 END) as active_posts,
                COUNT(CASE WHEN is_deleted = 1 THEN 1 END) as deleted_posts,
                AVG(view_count) as avg_view_count,
                MAX(view_count) as max_view_count
            FROM posts 
            WHERE board_id = ?
            """;

        return jdbcTemplate.queryForMap(query, boardId);
    }

    /**
     * JDBC를 사용한 배치 조회수 업데이트
     */
    @Transactional
    public int batchUpdateViewCounts(List<Long> postIds, int incrementValue) {
        String query = "UPDATE posts SET view_count = view_count + ? WHERE id = ?";
        
        List<Object[]> batchArgs = postIds.stream()
                .map(postId -> new Object[]{incrementValue, postId})
                .toList();
        
        int[] updateCounts = jdbcTemplate.batchUpdate(query, batchArgs);
        
        log.info("Batch updated view counts for {} posts", updateCounts.length);
        return updateCounts.length;
    }

    /**
     * JDBC를 사용한 커스텀 검색
     */
    public List<Map<String, Object>> searchPostsWithJdbc(String keyword, Integer boardId, int limit) {
        String query = """
            SELECT id, title, content, author_id, view_count, created_at
            FROM posts 
            WHERE board_id = ? 
            AND is_deleted = 0
            AND (title LIKE ? OR content LIKE ?)
            ORDER BY created_at DESC
            LIMIT ?
            """;

        String searchPattern = "%" + keyword + "%";
        
        return jdbcTemplate.queryForList(query, boardId, searchPattern, searchPattern, limit);
    }

    /**
     * JDBC를 사용한 데이터베이스 연결 상태 확인
     */
    public boolean checkDatabaseConnection() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return true;
        } catch (Exception e) {
            log.error("Database connection check failed", e);
            return false;
        }
    }

    /**
     * JDBC를 사용한 게시물 아카이브 (물리적 이동)
     */
    @Transactional
    public void archiveOldPosts(Integer boardId, LocalDateTime beforeDate) {
        // 아카이브 테이블로 데이터 복사
        String insertArchiveQuery = """
            INSERT INTO posts_archive (id, board_id, title, content, author_id, view_count, created_at, updated_at)
            SELECT id, board_id, title, content, author_id, view_count, created_at, updated_at
            FROM posts 
            WHERE board_id = ? AND created_at < ? AND is_deleted = 1
            """;

        int archivedCount = jdbcTemplate.update(insertArchiveQuery, boardId, beforeDate);

        // 원본 테이블에서 삭제
        if (archivedCount > 0) {
            String deleteQuery = """
                DELETE FROM posts 
                WHERE board_id = ? AND created_at < ? AND is_deleted = 1
                """;
            
            int deletedCount = jdbcTemplate.update(deleteQuery, boardId, beforeDate);
            
            log.info("Archived {} posts and deleted {} from main table for board {}", 
                    archivedCount, deletedCount, boardId);
        }
    }
}