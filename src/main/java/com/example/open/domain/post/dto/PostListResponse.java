package com.example.open.domain.post.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class PostListResponse {
    private List<PostDto> posts;
    private int currentPage;
    private int totalPages;
    private long totalElements;
}