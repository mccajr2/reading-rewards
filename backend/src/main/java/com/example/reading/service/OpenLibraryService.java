package com.example.reading.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;
import com.fasterxml.jackson.databind.*;

@Service
public class OpenLibraryService {
    private final RestTemplate rt = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public Map<String,Object> search(String q){
        String url = "https://openlibrary.org/search.json?q="+q.replace(" ","+")+"&type=work&fields=title,key,author_name,first_publish_year,cover_i";
        return rt.getForObject(url, Map.class);
    }

    public Map<String,Object> getWork(String olid){
        // try work endpoint: /works/OLxxxxxW.json or editions
        try{
            String url = "https://openlibrary.org/works/"+olid+".json";
            return rt.getForObject(url, Map.class);
        }catch(Exception ex){
            return Collections.emptyMap();
        }
    }
}
