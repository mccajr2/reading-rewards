package com.example.reading.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import java.util.List;

@Data
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class BookSummaryDto {

    private String googleBookId;
    private String title;
    private List<String> authors;
    private String description;
    private String thumbnailUrl;

}
