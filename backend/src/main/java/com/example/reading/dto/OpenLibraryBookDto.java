package com.example.reading.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OpenLibraryBookDto {
    
    public String olid;
    public String title;
    public List<String> authors;

}
