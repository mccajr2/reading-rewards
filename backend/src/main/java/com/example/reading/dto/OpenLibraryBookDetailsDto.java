package com.example.reading.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class OpenLibraryBookDetailsDto extends OpenLibraryBookDto {
    
    private String description;
    private List<Integer> coverIds;

    public OpenLibraryBookDetailsDto(String olid, String title, List<String> authors, String description, List<Integer> coverIds) {
        super(olid, title, authors);
        this.description = description;
        this.coverIds = coverIds;
    }

}
