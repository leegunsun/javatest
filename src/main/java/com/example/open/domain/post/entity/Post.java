package com.example.open.domain.post.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts", indexes = {
        @Index(name = "IX_posts_board_deleted_created",
                columnList = "board_id, is_deleted, created_at DESC"),
        @Index(name = "IX_posts_virtual_number",
                columnList = "board_id, is_deleted, id DESC")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Where(clause = "is_deleted = 0")  // 기본적으로 삭제되지 않은 것만 조회
@SQLDelete(sql = "UPDATE posts SET is_deleted = 1, deleted_at = GETDATE() WHERE id = ?")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "board_id", nullable = false)
    private Integer boardId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(name = "view_count")
    private Integer viewCount = 0;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "is_pinned")
    private Boolean isPinned = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by")
    private Long deletedBy;

    @Transient
    private Long virtualNumber;  // 가상 번호 (DB에 저장되지 않음)

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}