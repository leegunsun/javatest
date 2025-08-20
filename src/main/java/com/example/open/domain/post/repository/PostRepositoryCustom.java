package com.example.open.domain.post.repository;

import com.example.open.domain.post.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

// 커스텀 Repository 인터페이스
public interface PostRepositoryCustom {
    Page<Post> findPostsWithVirtualNumber(Integer boardId, Pageable pageable);
    Post findPostWithVirtualNumber(Long postId);
}