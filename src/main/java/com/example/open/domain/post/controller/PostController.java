package com.example.open.domain.post.controller;

import com.example.open.domain.post.dto.PostDto;
import com.example.open.domain.post.dto.PostListResponse;
import com.example.open.domain.post.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class PostController {

    private final PostService postService;

    @GetMapping("/board/{boardId}")
    public ResponseEntity<PostListResponse> getPosts(
            @PathVariable Integer boardId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PostListResponse response = postService.getPosts(boardId, page, size);
        return ResponseEntity.ok(response);
    }

//    @GetMapping("/{postId}")
//    public ResponseEntity<PostDto> getPost(@PathVariable Long postId) {
//        PostDto post = postService.getPost(postId);
//        return ResponseEntity.ok(post);
//    }

    @PostMapping
    public ResponseEntity<PostDto> createPost(
            @RequestBody PostDto dto,
            @AuthenticationPrincipal Long userId) {

        PostDto created = postService.createPost(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long userId) {

        postService.deletePost(postId, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{postId}/restore")
    public ResponseEntity<Void> restorePost(@PathVariable Long postId) {
        postService.restorePost(postId);
        return ResponseEntity.ok().build();
    }
}