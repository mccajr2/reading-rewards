package com.example.reading.dto;

import java.util.List;

public class OLBookDetailsDto extends OLBookDto {
    public String description;
    public List<Integer> imageIds;

    public OLBookDetailsDto() {}

    public OLBookDetailsDto(String key, String title, List<String> authors, String description, List<Integer> imageIds) {
        super(key, title, authors);
        this.description = description;
        this.imageIds = imageIds;
    }
}
