package com.example.reading.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import com.example.reading.dto.OpenLibraryBookDto;
import com.example.reading.dto.OpenLibraryBookDetailsDto;

@Service
public class OpenLibraryService {
    private final RestTemplate rt = new RestTemplate();

    @SuppressWarnings("unchecked")
    public List<OpenLibraryBookDto> search(String q) {
        String url = "https://openlibrary.org/search.json?q=" + q.replace(" ", "+") + "&type=work&fields=title,key,author_name,first_publish_year,cover_i";
        Map<String, Object> result = (Map<String, Object>) rt.getForObject(url, Map.class);
        if (result == null) return Collections.emptyList();
        List<Map<String, Object>> docs = (List<Map<String, Object>>) result.getOrDefault("docs", Collections.emptyList());
        List<OpenLibraryBookDto> books = new ArrayList<>();
        for (Map<String, Object> doc : docs) {
            String key = (String) doc.getOrDefault("key", "");
            String olid = key.substring(key.lastIndexOf('/') + 1);
            String title = (String) doc.getOrDefault("title", "");
            List<String> authors = new ArrayList<>();
            Object authorObj = doc.get("author_name");
            if (authorObj instanceof List<?>) {
                for (Object a : (List<?>) authorObj) {
                    if (a != null) authors.add(a.toString());
                }
            }
            books.add(new OpenLibraryBookDto(olid, title, authors));
        }
        return books;
    }

    @SuppressWarnings("unchecked")
    public OpenLibraryBookDetailsDto searchByIsbn(String isbn) {
        String url = "https://openlibrary.org/api/books?bibkeys=ISBN:" + isbn.replace("-","") + "&format=json&jscmd=data";
        Map<String, Object> result = (Map<String, Object>) rt.getForObject(url, Map.class);
        if (result == null || result.isEmpty()) return null;
        Map.Entry<String, Object> entry = result.entrySet().iterator().next();
        Map<String, Object> book = (Map<String, Object>) entry.getValue();

        // Log table_of_contents if present
        if (book.containsKey("table_of_contents")) {
            System.out.println("[OpenLibraryService] table_of_contents found: " + book.get("table_of_contents"));
        }

        // Try to extract OLID from 'key' or 'identifiers.openlibrary'
        String olid = "";
        if (book.containsKey("key")) {
            String key = book.get("key").toString();
            if (key.startsWith("/books/")) {
                olid = key.substring("/books/".length());
            } else {
                olid = key;
            }
        }
        if (olid.isEmpty() && book.containsKey("identifiers")) {
            Map<String, Object> ids = (Map<String, Object>) book.get("identifiers");
            List<String> olids = ids.containsKey("openlibrary") ? (List<String>) ids.get("openlibrary") : Collections.emptyList();
            if (!olids.isEmpty()) {
                olid = olids.get(0);
            }
        }
        if (olid.isEmpty()) return null;

        // Use OLID to fetch work details
        return getWork(olid);
    }

    @SuppressWarnings("unchecked")
    public OpenLibraryBookDetailsDto getWork(String olid) {
        try {
            String url = "https://openlibrary.org/works/" + olid + ".json";
            Map<String, Object> work = (Map<String, Object>) rt.getForObject(url, Map.class);
            if (work == null) return null;
            String title = (String) work.getOrDefault("title", "");
            String description = "";
            if (work.containsKey("description")) {
                Object descObj = work.get("description");
                if (descObj instanceof String) {
                    description = (String) descObj;
                } else if (descObj instanceof Map) {
                    Object val = ((Map<?, ?>) descObj).get("value");
                    if (val != null) description = val.toString();
                }
            }
            List<Integer> coverIds = new ArrayList<>();
            if (work.containsKey("covers")) {
                List<Object> covers = (List<Object>) work.get("covers");
                for (Object c : covers) {
                    if (c instanceof Integer) coverIds.add((Integer) c);
                    else if (c instanceof Number) coverIds.add(((Number) c).intValue());
                }
            }
            // Authors: fetch author names from /works/OLxxxW.json -> authors[*].author.key
            List<String> authors = new ArrayList<>();
            if (work.containsKey("authors")) {
                List<Object> authorRefs = (List<Object>) work.get("authors");
                for (Object refObj : authorRefs) {
                    if (refObj instanceof Map) {
                        Map<String, Object> ref = (Map<String, Object>) refObj;
                        if (ref.containsKey("key")) {
                            String authorKey = (String) ref.get("key");
                            // Fetch author name from OpenLibrary API
                            if (authorKey != null && !authorKey.isEmpty()) {
                                try {
                                    String authorUrl = "https://openlibrary.org" + authorKey + ".json";
                                    Map<String, Object> authorData = (Map<String, Object>) rt.getForObject(authorUrl, Map.class);
                                    if (authorData != null && authorData.containsKey("name")) {
                                        authors.add(authorData.get("name").toString());
                                    }
                                } catch (Exception ignored) {}
                            }
                        }
                    }
                }
            }
            return new OpenLibraryBookDetailsDto(olid, title, authors, description, coverIds);
        } catch (Exception ex) {
            return null;
        }
    }
}
