package com.example.reading.service;

import com.example.reading.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OpenLibraryService {
    private final RestTemplate rt = new RestTemplate();

    @SuppressWarnings("unchecked")
    public List<OLBookDto> search(String q) {
        String url = "https://openlibrary.org/search.json?q=" + q.replace(" ", "+") + "&type=work&fields=title,key,author_name,first_publish_year,cover_i";
        Map<String, Object> result = (Map<String, Object>) rt.getForObject(url, Map.class);
        if (result == null) return Collections.emptyList();
        List<Map<String, Object>> docs = (List<Map<String, Object>>) result.getOrDefault("docs", Collections.emptyList());
        List<OLBookDto> books = new ArrayList<>();
        for (Map<String, Object> doc : docs) {
            OLBookDto dto = new OLBookDto();
            final String key = (String) doc.getOrDefault("key", "");
            dto.olid = key.contains("/") ? key.substring(key.lastIndexOf('/') + 1) : key;
            dto.title = (String) doc.getOrDefault("title", "");
            Object authorObj = doc.get("author_name");
            if (authorObj instanceof List) {
                dto.authors = (List<String>) authorObj;
            } else if (authorObj instanceof String) {
                dto.authors = List.of((String) authorObj);
            } else {
                dto.authors = new ArrayList<>();
            }
            // No publishDate, publishers, subjects, identifiers in search docs
            books.add(dto);
        }
        return books;
    }

    @SuppressWarnings("unchecked")
    public OLBookDto searchByIsbn(String isbn) {
        String url = "https://openlibrary.org/api/books?bibkeys=ISBN:" + isbn.replace("-","") + "&format=json&jscmd=data";
        Map<String, Object> result = (Map<String, Object>) rt.getForObject(url, Map.class);
        if (result == null || result.isEmpty()) return null;
        Map.Entry<String, Object> entry = result.entrySet().iterator().next();
        Map<String, Object> book = (Map<String, Object>) entry.getValue();
        OLBookDto dto = new OLBookDto();
        dto.olid = (String) book.getOrDefault("key", "");
        dto.title = (String) book.getOrDefault("title", "");
        dto.authors = extractAuthorsFromObject(book.get("authors"));
        return dto;
    }

    private List<String> extractAuthorsFromObject(Object authorsObj) {
        // Authors
        List<Map<String, Object>> authorsList = Collections.emptyList();
        if (authorsObj instanceof List) {
            List<?> rawList = (List<?>) authorsObj;
            List<Map<String, Object>> safeList = new ArrayList<>();
            for (Object item : rawList) {
                if (item instanceof Map<?, ?>) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> authorMap = (Map<String, Object>) item;
                    safeList.add(authorMap);
                }
            }
            authorsList = safeList;
        }
        List<String> authors = authorsList.stream()
            .map(a -> a != null && a.get("name") != null ? a.get("name").toString() : "")
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toList());
        if (authors == null) authors = new ArrayList<>();
        return authors;
    }

    @SuppressWarnings("unchecked")
    public OLBookDetailsDto getWork(String olid){
        OLBookDetailsDto dto = new OLBookDetailsDto();
        dto.olid = olid;
        try{
            String url = "https://openlibrary.org/works/"+olid+".json";
            Map<String, Object> result = (Map<String, Object>) rt.getForObject(url, Map.class);
            if (result != null) {
                dto.title = (String) result.getOrDefault("title", "");
                dto.authors = extractAuthorsFromObject(result.get("authors"));
                dto.description = (String) result.getOrDefault("description", "");
                dto.imageIds = (List<Integer>) result.getOrDefault("covers", Collections.emptyList());
            } else {
                dto.title = "";
                dto.authors = new ArrayList<>();
                dto.description = "";
                dto.imageIds = new ArrayList<>();
            }
        }catch(Exception ex){
        }
        return dto;
    }
}
