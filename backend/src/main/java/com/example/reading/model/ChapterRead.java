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

    private boolean inProgress;
    private int readCount;
    private LocalDateTime readAt;
    
    public ChapterRead(){}
    public ChapterRead(String bookOlid,int chapterIndex){
        this.bookOlid=bookOlid;
        this.chapterIndex=chapterIndex;
        this.readAt=LocalDateTime.now();
    }
    public Long getId(){return id;}
    public String getBookOlid(){return bookOlid;}
    public int getChapterIndex(){return chapterIndex;}
    public LocalDateTime getReadAt(){return readAt;}
}
