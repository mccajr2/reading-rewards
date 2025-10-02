package com.example.reading.dto;

import java.util.List;

public class OLBookDto {
    public String olid;
    public String title;
    public List<String> authors;

    public OLBookDto() {}

    public OLBookDto(String olid, String title, List<String> authors) {
        this.olid = olid;
        this.title = title;
        this.authors = authors;
    }
}
