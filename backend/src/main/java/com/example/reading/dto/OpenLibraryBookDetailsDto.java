package com.example.reading.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class OpenLibraryBookDetailsDto extends OpenLibraryBookDto {
    
    private String description;
    private List<Integer> coverIds;

}
