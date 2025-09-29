package com.example.reading.model;

import jakarta.persistence.*;

@Entity
@Table(name = "chapters")
public class Chapter {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String bookOlid;
    private int chapterIndex;
    private String name;

    public Chapter(){}

    public Chapter(String bookOlid,int chapterIndex,String name){
        this.bookOlid=bookOlid;
        this.chapterIndex=chapterIndex;
        this.name=name;
    }
    public Long getId(){return id;}
    public String getBookOlid(){return bookOlid;}
    public int getChapterIndex(){return chapterIndex;}
    public String getName(){return name;}
    public void setId(Long i){this.id=i;}
    public void setBookOlid(String b){this.bookOlid=b;}
    public void setChapterIndex(int c){this.chapterIndex=c;}
    public void setName(String n){this.name=n;}
}
