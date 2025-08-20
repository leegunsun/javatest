package com.example.open.domain.post.dto;


import com.example.open.domain.post.entity.Post;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostDto {

    private Long id;
    private Integer boardId;
    private String title;
    private String content;
    private Long authorId;
    private String authorName;
    private Integer viewCount;
    private Boolean isPinned;
    private Long virtualNumber;  // 가상 번호

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    public static PostDto from(Post post) {
        return PostDto.builder()
                .id(post.getId())
                .boardId(post.getBoardId())
                .title(post.getTitle())
                .content(post.getContent())
                .authorId(post.getAuthorId())
                .viewCount(post.getViewCount())
                .isPinned(post.getIsPinned())
                .virtualNumber(post.getVirtualNumber())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
