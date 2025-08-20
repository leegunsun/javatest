package com.example.open.domain.post.repository;

import com.example.open.domain.post.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface PostRepository extends JpaRepository<Post, Long>, PostRepositoryCustom {

    // 특정 게시판의 활성 게시물 수 (가상 번호 계산용)
    @Query(value = """
        SELECT COUNT(*) 
        FROM posts 
        WHERE board_id = :boardId 
        AND is_deleted = 0
        """, nativeQuery = true)
    long countActivePostsByBoardId(@Param("boardId") Integer boardId);

    // 특정 게시물보다 최신 게시물 수 (가상 번호 계산용)
    @Query(value = """
        SELECT COUNT(*) 
        FROM posts 
        WHERE board_id = :boardId 
        AND is_deleted = 0 
        AND created_at > :createdAt
        """, nativeQuery = true)
    long countNewerPosts(@Param("boardId") Integer boardId,
                         @Param("createdAt") LocalDateTime createdAt);
}

