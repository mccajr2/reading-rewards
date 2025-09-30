package com.example.reading.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service
public class OpenLibraryService {
    private final RestTemplate rt = new RestTemplate();

    @SuppressWarnings("unchecked")
    public Map<String,Object> search(String q){
        String url = "https://openlibrary.org/search.json?q="+q.replace(" ","+")+"&type=work&fields=title,key,author_name,first_publish_year,cover_i";
        return (Map<String, Object>) rt.getForObject(url, Map.class);
    }

    public Object searchByIsbn(String isbn){
        String url = "https://openlibrary.org/api/books?bibkeys=ISBN:"+isbn.replace("-","")+"&format=json&jscmd=data";
        return rt.getForObject(url, Object.class);
    }

    @SuppressWarnings("unchecked")
    public Map<String,Object> getWork(String olid){
        // try work endpoint: /works/OLxxxxxW.json or editions
        try{
            String url = "https://openlibrary.org/works/"+olid+".json";
            return (Map<String, Object>) rt.getForObject(url, Map.class);
        }catch(Exception ex){
            return Collections.emptyMap();
        }
    }
}
