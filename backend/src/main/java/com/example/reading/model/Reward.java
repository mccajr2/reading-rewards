package com.example.reading.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.math.BigDecimal;

@Entity
@Table(name = "rewards")
public class Reward {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime eventTime = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RewardType type;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    private String note;

    // Reference to ChapterRead for EARN rewards
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_read_id")
    @JsonIgnore
    private ChapterRead chapterRead;

    public Reward() {}
    public Reward(RewardType type, BigDecimal amount, String note) {
        this.type = type;
        this.amount = amount;
        this.note = note;
        this.eventTime = LocalDateTime.now();
    }

    public Reward(ChapterRead chapterRead, BigDecimal amount) {
        this.type = RewardType.EARN;
        this.amount = amount;
        this.chapterRead = chapterRead;
        this.eventTime = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public LocalDateTime getEventTime() { return eventTime; }
    public void setEventTime(LocalDateTime eventTime) { this.eventTime = eventTime; }
    public RewardType getType() { return type; }
    public void setType(RewardType type) { this.type = type; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public ChapterRead getChapterRead() { return chapterRead; }
    public void setChapterRead(ChapterRead chapterRead) { this.chapterRead = chapterRead; }
}
