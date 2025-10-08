package com.example.reading.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import java.util.*;
import java.util.stream.Collectors;
import java.util.UUID;
import com.example.reading.service.OpenLibraryService;
import com.example.reading.repo.*;
import com.example.reading.model.*;
import com.example.reading.dto.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiController {

    @Autowired
    OpenLibraryService ol;
    @Autowired
    BookRepository bookRepo;
    @Autowired
    ChapterRepository chapterRepo;
    @Autowired
    ChapterReadRepository readRepo;
    @Autowired
    BookReadRepository bookReadRepo;
    @Autowired
    UserRepository userRepo;
    @Autowired
    RewardRepository rewardRepo;

    // Hardcoded user for all API calls until JWT is implemented
    private static final String HARDCODED_USERNAME = "kidreader";

    private User getCurrentUser() {
        return userRepo.findByUsername(HARDCODED_USERNAME)
                .orElseThrow(() -> new RuntimeException("Hardcoded user not found"));
    }

    @GetMapping("/search")
    public List<OpenLibraryBookDto> search(@RequestParam String q) {
        return ol.search(q);
    }

    @GetMapping("/lookup")
    public OpenLibraryBookDetailsDto searchByIsbn(@RequestParam String isbn) {
        return ol.searchByIsbn(isbn);
    }

    @GetMapping("/work/{olid}")
    public OpenLibraryBookDetailsDto work(@PathVariable String olid) {
        return ol.getWork(olid);
    }

    @GetMapping("/books")
    public List<Map<String, Object>> getBooks() {
        User user = getCurrentUser();
        List<BookRead> bookReads = bookReadRepo.findByUserId(user.getId());
        Map<String, Map<String, Object>> bookMap = new HashMap<>();
        for (BookRead br : bookReads) {
            Book book = br.getBook();
            if (book == null)
                continue;
            String olid = book.getOlid();
            Map<String, Object> m = bookMap.computeIfAbsent(olid, k -> {
                Map<String, Object> map = new HashMap<>();
                map.put("olid", book.getOlid());
                map.put("title", book.getTitle());
                // Use getAuthors() which returns List<String>
                map.put("authors", book.getAuthors());
                map.put("inProgress", Boolean.TRUE.equals(br.getInProgress()));
                map.put("readCount", 0);
                return map;
            });
            m.put("readCount", (int) m.get("readCount") + 1);
        }
        return new ArrayList<>(bookMap.values());
    }

    @PostMapping("/books")
    public Book saveBook(@RequestBody OpenLibraryBookDto dto) {
        User user = getCurrentUser();
        Book b = new Book();
        b.setOlid(dto.olid);
        b.setTitle(dto.title);
        b.setAuthors(dto.authors != null ? dto.authors : new ArrayList<>());
        Book saved = bookRepo.save(b);
        BookRead br = new BookRead();
        br.setBookOlid(saved.getOlid());
        br.setUserId(user.getId());
        br.setStartDate(java.time.LocalDateTime.now());
        bookReadRepo.save(br);
        return saved;
    }

    @PostMapping("/books/{olid}/finish")
    @Transactional
    public ResponseEntity<?> finishBook(@PathVariable String olid) {
        User user = getCurrentUser();
        List<BookRead> bookReads = bookReadRepo.findByUserId(user.getId());
        boolean found = false;
        for (BookRead br : bookReads) {
            if (olid.equals(br.getBookOlid()) && Boolean.TRUE.equals(br.getInProgress())) {
                br.setEndDate(java.time.LocalDateTime.now());
                bookReadRepo.save(br);
                found = true;
            }
        }
        return found ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/books/{olid}/chapters")
    public List<Chapter> saveChapters(@PathVariable String olid, @RequestBody List<Chapter> chapters) {
        chapterRepo.deleteByBookOlid(olid);
        for (Chapter c : chapters)
            c.setBookOlid(olid);
        return chapterRepo.saveAll(chapters);
    }

    @GetMapping("/books/{olid}/chapters")
    public List<Chapter> getChapters(@PathVariable String olid) {
        return chapterRepo.findByBookOlidOrderByChapterIndex(olid);
    }

    // New: Mark a chapter as read for a specific BookRead instance
    @PostMapping("/bookreads/{bookReadId}/chapters/{chapterId}/read")
    public ChapterRead markReadForBookRead(@PathVariable UUID bookReadId, @PathVariable UUID chapterId) {
        User user = getCurrentUser();
        ChapterRead cr = new ChapterRead();
        cr.setBookReadId(bookReadId);
        cr.setChapterId(chapterId);
        cr.setUserId(user.getId());
        cr.setCompletionDate(java.time.LocalDateTime.now());
        return readRepo.save(cr);
    }

    @DeleteMapping("/books/{olid}/chapters/{chapterId}/read")
    public ResponseEntity<?> deleteRead(@PathVariable String olid, @PathVariable UUID chapterId) {
        User user = getCurrentUser();
        List<ChapterRead> reads = readRepo.findByUserId(user.getId()).stream()
                .filter(r -> chapterId.equals(r.getChapterId()))
                .collect(Collectors.toList());
        if (reads.isEmpty())
            return ResponseEntity.notFound().build();
        ChapterRead mostRecent = reads.get(0);
        readRepo.delete(mostRecent);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/credits")
    public Map<String, Object> credits() {
        User user = getCurrentUser();
        List<Reward> rewards = rewardRepo.findByUserId(user.getId());
        int totalCents = rewards.stream()
                .filter(r -> r.getType() == RewardType.EARN)
                .mapToInt(r -> 100) // Placeholder: replace with actual amount if available
                .sum();
        double dollars = totalCents / 100.0;
        Map<String, Object> m = new HashMap<>();
        m.put("cents", totalCents);
        m.put("dollars", dollars);
        return m;
    }

    @GetMapping("/history")
    public List<ChapterRead> history() {
        User user = getCurrentUser();
        return readRepo.findByUserId(user.getId());
    }

    // New endpoint: get all ChapterRead for a given BookRead (per-instance
    // progress)
    @GetMapping("/bookreads/{bookReadId}/chapterreads")
    public List<ChapterRead> getChapterReadsForBookRead(@PathVariable UUID bookReadId) {
        return readRepo.findByBookReadId(bookReadId);
    }

    // Returns all in-progress BookRead objects for the current user, with book info
    // and read chapter IDs
    @GetMapping("/bookreads/in-progress")
    public List<BookReadProgressDto> getInProgressBookReads() {
        User user = getCurrentUser();
        List<BookRead> bookReads = bookReadRepo.findByUserId(user.getId());
        List<BookReadProgressDto> result = new ArrayList<>();
        for (BookRead br : bookReads) {
            if (!Boolean.TRUE.equals(br.getInProgress()))
                continue;
            Book book = br.getBook();
            if (book == null)
                continue;
            // Count all BookRead instances for this user/book
            int readCount = (int) bookReads.stream().filter(b -> b.getBookOlid().equals(book.getOlid())).count();
            // Get all read chapter IDs for this BookRead
            List<UUID> readChapterIds = readRepo.findByBookReadId(br.getId())
                    .stream().map(cr -> cr.getChapterId()).toList();
            result.add(new BookReadProgressDto(br, book, readCount, readChapterIds));
        }
        return result;
    }
}
