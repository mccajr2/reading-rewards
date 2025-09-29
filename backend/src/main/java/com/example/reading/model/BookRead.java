package com.example.reading.model;

import jakarta.persistence.*;

@Entity
@Table(name = "book_reads")
public class BookRead {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "book_olid", referencedColumnName = "olid")
    private Book book;

    private boolean inProgress;
    private int readCount;

    // constructors
    public BookRead() {}
    public BookRead(Book book) {
        this.book = book;
        this.inProgress = true;
        this.readCount = 0;
    }

    // getters and setters
    public Long getId() { return id; }
    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }
    public boolean isInProgress() { return inProgress; }
    public void setInProgress(boolean inProgress) { this.inProgress = inProgress; }
    public int getReadCount() { return readCount; }
    public void setReadCount(int readCount) { this.readCount = readCount; }
    public void incrementReadCount() { this.readCount++; }
}
