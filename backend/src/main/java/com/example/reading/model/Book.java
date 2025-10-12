package com.example.reading.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "books")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Book {

    @Id
    @Column(name = "google_book_id", length = 50)
    private String googleBookId;


    @Column(nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    // Store authors as a comma-separated string in the DB, but expose as
    // List<String> in Java

    @Column(name = "authors", nullable = false, columnDefinition = "TEXT")
    private String authorsString;


    @Transient
    private List<String> authors;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;


    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({ "book" })
    private List<Chapter> chapters;

    // Expose authors as List<String> in Java, store as comma-separated string in DB
    public List<String> getAuthors() {
        if (authors == null && authorsString != null && !authorsString.isEmpty()) {
            authors = Arrays.stream(authorsString.split(","))
                    .map(String::trim)
                    .collect(Collectors.toList());
        }
        return authors;
    }

    public void setAuthors(List<String> authors) {
        this.authors = authors;
        if (authors != null) {
            this.authorsString = String.join(", ", authors);
        } else {
            this.authorsString = null;
        }
    }

    @PrePersist
    @PreUpdate
    private void syncAuthorsToString() {
        if (authors != null) {
            this.authorsString = String.join(", ", authors);
        }
    }

    @PostLoad
    private void syncAuthorsFromString() {
        if (authorsString != null && !authorsString.isEmpty()) {
            authors = Arrays.stream(authorsString.split(","))
                    .map(String::trim)
                    .collect(Collectors.toList());
        }
    }
}