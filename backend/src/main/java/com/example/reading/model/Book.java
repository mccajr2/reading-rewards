package com.example.reading.model;

import jakarta.persistence.*;

@Entity
@Table(name = "books")
public class Book {
    @Id
    private String olid; // Open Library ID or custom id

    private String title;
    private String authors;

    // Removed inProgress; now tracked in BookRead

    // constructors, getters, setters
    public Book() {}
    public Book(String olid, String title, String authors) {
        this.olid = olid;
        this.title = title;
        this.authors = authors;
    }
    public String getOlid(){return olid;}
    public void setOlid(String o){this.olid=o;}
    public String getTitle(){return title;}
    public void setTitle(String t){this.title=t;}
    public String getAuthors(){return authors;}
    public void setAuthors(String a){this.authors=a;}
    // inProgress now tracked in BookRead
}
