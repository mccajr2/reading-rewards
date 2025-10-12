package com.example.reading.dto;

import com.example.reading.model.Book;
import com.example.reading.model.BookRead;
import java.util.List;
import java.util.UUID;

public class BookReadProgressDto {
    public UUID id;
    public String googleBookId;
    public String title;
    public List<String> authors;
    public boolean inProgress;
    public int readCount;
    public List<UUID> readChapterIds;
    public String description;
    public String thumbnailUrl;

    public BookReadProgressDto(BookRead br, Book book, int readCount, List<UUID> readChapterIds) {
        this.id = br.getId();
        this.googleBookId = book.getGoogleBookId();
        this.title = book.getTitle();
        this.authors = book.getAuthors();
        this.inProgress = Boolean.TRUE.equals(br.getInProgress());
        this.readCount = readCount;
        this.readChapterIds = readChapterIds;
        this.description = book.getDescription();
        this.thumbnailUrl = book.getThumbnailUrl();
    }
}
