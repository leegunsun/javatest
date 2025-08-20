package com.example.open.domain.post.repository;

import com.example.open.domain.post.entity.Post;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class PostRepositoryImpl implements PostRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Page<Post> findPostsWithVirtualNumber(Integer boardId, Pageable pageable) {
        // 전체 카운트 쿼리
        String countQuery = "SELECT COUNT(p) FROM Post p WHERE p.boardId = :boardId AND p.isDeleted = false";
        Long totalCount = entityManager.createQuery(countQuery, Long.class)
                .setParameter("boardId", boardId)
                .getSingleResult();

        // 데이터 조회 쿼리
        String dataQuery = "SELECT p FROM Post p WHERE p.boardId = :boardId AND p.isDeleted = false " +
                          "ORDER BY p.isPinned DESC, p.createdAt DESC";
        
        TypedQuery<Post> query = entityManager.createQuery(dataQuery, Post.class)
                .setParameter("boardId", boardId)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize());
        
        List<Post> posts = query.getResultList();
        
        // 가상 번호 계산 및 설정
        long startNumber = totalCount - pageable.getOffset();
        for (int i = 0; i < posts.size(); i++) {
            posts.get(i).setVirtualNumber(startNumber - i);
        }
        
        return new PageImpl<>(posts, pageable, totalCount);
    }

    @Override
    public Post findPostWithVirtualNumber(Long postId) {
        String query = "SELECT p FROM Post p WHERE p.id = :postId AND p.isDeleted = false";
        
        Post post = entityManager.createQuery(query, Post.class)
                .setParameter("postId", postId)
                .getSingleResult();
        
        if (post != null) {
            // 해당 게시물보다 최신 게시물 수를 계산하여 가상 번호 설정
            String countQuery = "SELECT COUNT(p) FROM Post p WHERE p.boardId = :boardId " +
                               "AND p.isDeleted = false AND p.createdAt >= :createdAt";
            
            Long newerPostsCount = entityManager.createQuery(countQuery, Long.class)
                    .setParameter("boardId", post.getBoardId())
                    .setParameter("createdAt", post.getCreatedAt())
                    .getSingleResult();
            
            post.setVirtualNumber(newerPostsCount);
        }
        
        return post;
    }
}