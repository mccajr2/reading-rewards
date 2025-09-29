package com.example.reading.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import java.util.*;
import com.example.reading.service.OpenLibraryService;
import com.example.reading.repo.*;
import com.example.reading.model.*;
import org.springframework.beans.factory.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins="*")
public class ApiController {

    @Autowired OpenLibraryService ol;
    @Autowired BookRepository bookRepo;
    @Autowired ChapterRepository chapterRepo;
    @Autowired ChapterReadRepository readRepo;

    @GetMapping("/search")
    public Object search(@RequestParam String q){
        return ol.search(q);
    }

    @GetMapping("/work/{olid}")
    public Object work(@PathVariable String olid){
    Map<String, Object> m = ol.getWork(olid);
    return m;
    }

    @GetMapping("/books")
    public List<Book> getBooks() {
        return bookRepo.findAll();
    }

    @PostMapping("/books")
    public Book saveBook(@RequestBody Book b){
        b.setInProgress(true);
        return bookRepo.save(b);
    }

    @PostMapping("/books/{olid}/chapters")
    public List<Chapter> saveChapters(@PathVariable String olid, @RequestBody List<Chapter> chapters){
        chapterRepo.deleteByBookOlid(olid);
        for(Chapter c: chapters) c.setBookOlid(olid);
        return chapterRepo.saveAll(chapters);
    }

    @GetMapping("/books/{olid}/chapters")
    public List<Chapter> getChapters(@PathVariable String olid){
        return chapterRepo.findByBookOlidOrderByChapterIndex(olid);
    }

    @PostMapping("/books/{olid}/chapters/{index}/read")
    public ChapterRead markRead(@PathVariable String olid,@PathVariable int index){
        ChapterRead cr=new ChapterRead(olid,index,100); // $1 => 100 cents
        return readRepo.save(cr);
    }

    @DeleteMapping("/books/{olid}/chapters/{index}/read")
    public ResponseEntity<?> deleteRead(@PathVariable String olid, @PathVariable int index) {
        List<ChapterRead> reads = readRepo.findAllByBookOlidAndChapterIndexOrderByReadAtDesc(olid, index);
        if (reads.isEmpty()) return ResponseEntity.notFound().build();
        ChapterRead mostRecent = reads.get(0);
        readRepo.delete(mostRecent);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/credits")
    public Map<String,Object> credits(){
    List<ChapterRead> all = readRepo.findAll();
    int totalCents = all.stream().mapToInt(ChapterRead::getCredit).sum();
    double dollars = totalCents / 100.0;
    System.out.println("[CREDITS] Total cents: " + totalCents + ", dollars: " + dollars);
    Map<String,Object> m=new HashMap<>();
    m.put("cents", totalCents);
    m.put("dollars", dollars);
    return m;
    }

    @GetMapping("/history")
    public List<ChapterRead> history(){ return readRepo.findAllByOrderByReadAtDesc(); }
}
