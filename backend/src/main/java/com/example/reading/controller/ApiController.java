package com.example.reading.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import java.util.*;
import com.example.reading.service.OpenLibraryService;
import com.example.reading.repo.*;
import com.example.reading.model.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/api")
@CrossOrigin(origins="*")
public class ApiController {

    @Autowired OpenLibraryService ol;
    @Autowired BookRepository bookRepo;
    @Autowired ChapterRepository chapterRepo;
    @Autowired ChapterReadRepository readRepo;
    @Autowired BookReadRepository bookReadRepo;

    @GetMapping("/search")
    public Object search(@RequestParam String q){
        return ol.search(q);
    }

    @GetMapping("/search_by_isbn")
    public Object searchByIsbn(@RequestParam String isbn) {
        return ol.searchByIsbn(isbn);
    }

    @GetMapping("/work/{olid}")
    public Object work(@PathVariable String olid){
    Map<String, Object> m = ol.getWork(olid);
    return m;
    }

    @GetMapping("/books")
    public List<Map<String, Object>> getBooks() {
        List<Book> books = bookRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Book book : books) {
            BookRead br = bookReadRepo.findTopByBookOrderByIdDesc(book);
            boolean inProgress = br != null && br.isInProgress();
            int readCount = br != null ? br.getReadCount() : 0;
            Map<String, Object> m = new HashMap<>();
            m.put("olid", book.getOlid());
            m.put("title", book.getTitle());
            m.put("authors", book.getAuthors());
            m.put("inProgress", inProgress);
            m.put("readCount", readCount);
            result.add(m);
        }
        return result;
    }

    @PostMapping("/books")
    public Book saveBook(@RequestBody Book b){
        Book saved = bookRepo.save(b);
        BookRead br = new BookRead(saved);
        bookReadRepo.save(br);
        return saved;
    }

    // Called when the final chapter is checked off
    @PostMapping("/books/{olid}/finish")
    @Transactional
    public ResponseEntity<?> finishBook(@PathVariable String olid) {
        Book book = bookRepo.findById(olid).orElse(null);
        if (book == null) return ResponseEntity.notFound().build();
        BookRead br = bookReadRepo.findTopByBookOrderByIdDesc(book);
        if (br == null) return ResponseEntity.notFound().build();
        // Purge ChapterRead for this book
        readRepo.deleteAllByBookOlid(olid);
        // Flip inProgress to false and increment readCount
        br.setInProgress(false);
        br.setReadCount(br.getReadCount() + 1);
        bookReadRepo.save(br);
        return ResponseEntity.ok().build();
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
