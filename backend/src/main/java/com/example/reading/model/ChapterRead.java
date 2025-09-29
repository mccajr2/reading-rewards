package com.example.reading.model;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "chapter_reads")
public class ChapterRead {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String bookOlid;
    private int chapterIndex;
    private LocalDateTime readAt;
    private int credit; // cents

    public ChapterRead(){}
    public ChapterRead(String bookOlid,int chapterIndex,int credit){
        this.bookOlid=bookOlid;this.chapterIndex=chapterIndex;this.readAt=LocalDateTime.now();this.credit=credit;
    }
    public Long getId(){return id;}
    public String getBookOlid(){return bookOlid;}
    public int getChapterIndex(){return chapterIndex;}
    public LocalDateTime getReadAt(){return readAt;}
    public int getCredit(){return credit;}
}
