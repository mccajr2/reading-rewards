package com.example.reading.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import com.example.reading.dto.BookSummaryDto;

@Service
public class GoogleBooksService {

    private static final String API_URL = "https://www.googleapis.com/books/v1/volumes";

    private final RestTemplate rt = new RestTemplate();

    @SuppressWarnings("unchecked")
    public List<BookSummaryDto> search(final String title, final String author, final String isbn) {

        if(title == null && author == null && isbn == null) {
            return Collections.emptyList();
        }

        StringBuilder urlBuilder = new StringBuilder(API_URL + "?q=");
        String queryString = "";
        if (title != null && !title.isEmpty()) {
            queryString += "intitle:" + title.replace(" ", "+");
        }
        if (author != null && !author.isEmpty()) {
            if(!queryString.isEmpty()) queryString += "+";
            queryString += "inauthor:" + author.replace(" ", "+");
        }
        if (isbn != null && !isbn.isEmpty()) {
            if(!queryString.isEmpty()) queryString += "+";
            queryString += "isbn:" + isbn.replace("-", "");
        }
        urlBuilder.append(queryString);
        urlBuilder.append("&maxResults=20");

        Map<String, Object> result = (Map<String, Object>) rt.getForObject(urlBuilder.toString(), Map.class);
        if (result == null || !result.containsKey("items")) return Collections.emptyList();
        List<BookSummaryDto> books = new ArrayList<>();
        Object itemsObj = result.get("items");
        if (!(itemsObj instanceof List<?>)) return Collections.emptyList();
        for (Object itemObj : (List<?>) itemsObj) {
            if (!(itemObj instanceof Map)) continue;
            Map<?, ?> item = (Map<?, ?>) itemObj;
            String volumeId = item.get("id") != null ? item.get("id").toString() : null;
            Object volumeInfoObj = item.get("volumeInfo");
            if (!(volumeInfoObj instanceof Map)) continue;
            Map<?, ?> volumeInfo = (Map<?, ?>) volumeInfoObj;
            String titleVal = volumeInfo.get("title") != null ? volumeInfo.get("title").toString() : null;
            List<String> authors = new ArrayList<>();
            Object authorsObj = volumeInfo.get("authors");
            if (authorsObj instanceof List<?>) {
                for (Object a : (List<?>) authorsObj) {
                    if (a != null) authors.add(a.toString());
                }
            }
            String description = volumeInfo.get("description") != null ? volumeInfo.get("description").toString() : null;
            String thumbnailUrl = null;
            Object imageLinksObj = volumeInfo.get("imageLinks");
            if (imageLinksObj instanceof Map) {
                Map<?, ?> imageLinks = (Map<?, ?>) imageLinksObj;
                Object thumb = imageLinks.get("thumbnail");
                if (thumb != null) thumbnailUrl = thumb.toString();
            }
            books.add(new BookSummaryDto(volumeId, titleVal, authors, description, thumbnailUrl));
        }
        return books;
    }
}
