package com.example.reading.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import java.util.*;
import com.example.reading.service.OpenLibraryService;
import com.example.reading.repo.*;
import com.example.reading.model.*;
import com.example.reading.dto.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.math.BigDecimal;

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
    RewardRepository rewardRepo;

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
    public Book saveBook(@RequestBody OpenLibraryBookDto dto) {
        // Convert authors list to comma-separated string for Book entity
        Book b = new Book(dto.olid, dto.title, dto.authors != null ? String.join(", ", dto.authors) : "");
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
        if (book == null)
            return ResponseEntity.notFound().build();
        BookRead br = bookReadRepo.findTopByBookOrderByIdDesc(book);
        if (br == null)
            return ResponseEntity.notFound().build();
        // Purge ChapterRead for this book
        readRepo.deleteAllByBookOlid(olid);
        // Flip inProgress to false and increment readCount
        br.setInProgress(false);
        br.setReadCount(br.getReadCount() + 1);
        bookReadRepo.save(br);
        return ResponseEntity.ok().build();
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

    @PostMapping("/books/{olid}/chapters/{index}/read")
    public ChapterRead markRead(@PathVariable String olid, @PathVariable int index) {
        ChapterRead cr = new ChapterRead(olid, index);
        ChapterRead saved = readRepo.save(cr);
        Reward reward = new Reward(saved, BigDecimal.valueOf(1.00));
        rewardRepo.save(reward);
        return saved;
    }

    @DeleteMapping("/books/{olid}/chapters/{index}/read")
    public ResponseEntity<?> deleteRead(@PathVariable String olid, @PathVariable int index) {
        List<ChapterRead> reads = readRepo.findAllByBookOlidAndChapterIndexOrderByReadAtDesc(olid, index);
        if (reads.isEmpty())
            return ResponseEntity.notFound().build();
        ChapterRead mostRecent = reads.get(0);
        // Delete associated reward if it exists
        List<Reward> rewards = rewardRepo.findByTypeAndChapterRead(RewardType.EARN, mostRecent);
        for (Reward r : rewards) {
            rewardRepo.delete(r);
        }
        readRepo.delete(mostRecent);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/history")
    public List<ChapterRead> history() {
        return readRepo.findAllByOrderByReadAtDesc();
    }

        // --- Rewards API ---

    @GetMapping("/rewards/summary")
    public Map<String, Object> getRewardsSummary() {
        Double earned = rewardRepo.getTotalEarned();
        Double paidOut = rewardRepo.getTotalPaidOut();
        Double spent = rewardRepo.getTotalSpent();
        double totalEarned = earned != null ? earned : 0.0;
        double totalPaidOut = paidOut != null ? paidOut : 0.0;
        double totalSpent = spent != null ? spent : 0.0;
        double currentBalance = totalEarned - totalPaidOut - totalSpent;
        Map<String, Object> m = new HashMap<>();
        m.put("totalEarned", totalEarned);
        m.put("totalPaidOut", totalPaidOut);
        m.put("totalSpent", totalSpent);
        m.put("currentBalance", currentBalance);
        return m;
    }

    @GetMapping("/rewards")
    public List<Reward> getAllRewards() {
        return rewardRepo.findAll();
    }

    @PostMapping("/rewards/payout")
    public Reward addPayout(@RequestParam double amount, @RequestParam(required = false) String note) {
        Reward r = new Reward(RewardType.PAYOUT, BigDecimal.valueOf(amount), note);
        return rewardRepo.save(r);
    }

    @PostMapping("/rewards/spend")
    public Reward addSpend(@RequestParam double amount, @RequestParam String note) {
        Reward r = new Reward(RewardType.SPEND, BigDecimal.valueOf(amount), note);
        return rewardRepo.save(r);
    }

    // For admin/testing: add an earning event
    @PostMapping("/rewards/earn")
    public Reward addEarn(@RequestParam double amount, @RequestParam(required = false) String note,
                         @RequestParam(required = false) Long chapterReadId) {
        ChapterRead chapterRead = null;
        if (chapterReadId != null) {
            chapterRead = readRepo.findById(chapterReadId).orElse(null);
        }
        Reward r = new Reward(chapterRead, BigDecimal.valueOf(amount));
        return rewardRepo.save(r);
    }
}
