package com.example.reading.model;

import jakarta.persistence.*;

@Entity
@Table(name = "books")
public class Book {
    @Id
    private String olid; // Open Library ID or custom id

    private String title;
    // Store authors as comma-separated string
    private String authors;

    // Removed inProgress; now tracked in BookRead

    public Book() {}
    public Book(String olid, String title, String authors) {
        this.olid = olid;
        this.title = title;
        this.authors = authors;
    }
    public Book(String olid, String title, java.util.List<String> authorsList) {
        this.olid = olid;
        this.title = title;
        setAuthorsList(authorsList);
    }
    public String getOlid(){return olid;}
    public void setOlid(String o){this.olid=o;}
    public String getTitle(){return title;}
    public void setTitle(String t){this.title=t;}
    public String getAuthors(){return authors;}
    public void setAuthors(String a){this.authors=a;}
    // Utility: get authors as list
    public java.util.List<String> getAuthorsList() {
        if (authors == null || authors.isEmpty()) return java.util.Collections.emptyList();
        return java.util.Arrays.asList(authors.split(", "));
    }
    public void setAuthorsList(java.util.List<String> authorsList) {
        if (authorsList == null || authorsList.isEmpty()) {
            this.authors = "";
        } else {
            this.authors = String.join(", ", authorsList);
        }
    }
    // inProgress now tracked in BookRead
}
