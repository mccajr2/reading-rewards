
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
        ChapterRead savedCr = readRepo.save(cr);

        // Create a Reward of type EARN for this chapter read
        Reward reward = new Reward();
        reward.setType(RewardType.EARN);
        reward.setUserId(user.getId());
        reward.setChapterReadId(savedCr.getId());
        reward.setAmount(1.0); // Set to 1.0 or your earning logic
        rewardRepo.save(reward);

        return savedCr;
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
        // Delete all rewards referencing this ChapterRead (to avoid constraint
        // violation)
        List<Reward> rewards = rewardRepo.findByUserId(user.getId()).stream()
                .filter(r -> mostRecent.getId().equals(r.getChapterReadId()))
                .collect(Collectors.toList());
        rewardRepo.deleteAll(rewards);
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

    // Returns all rewards for the current user, with nested info for EARN rewards
    @GetMapping("/rewards")
    public List<Map<String, Object>> getRewards() {
        User user = getCurrentUser();
        List<Reward> rewards = rewardRepo.findByUserId(user.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (Reward reward : rewards) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", reward.getId());
            m.put("type", reward.getType());
            m.put("amount", reward.getAmount());
            m.put("note", reward.getNote());
            m.put("createdAt", reward.getCreatedAt());
            // For EARN rewards, include chapter, book, and bookRead info
            if (reward.getType() == RewardType.EARN && reward.getChapterRead() != null) {
                ChapterRead cr = reward.getChapterRead();
                m.put("chapterReadId", cr.getId());
                m.put("completionDate", cr.getCompletionDate());
                // Chapter info
                Chapter chapter = cr.getChapter();
                if (chapter != null) {
                    Map<String, Object> chapterMap = new HashMap<>();
                    chapterMap.put("id", chapter.getId());
                    chapterMap.put("name", chapter.getName());
                    chapterMap.put("chapterIndex", chapter.getChapterIndex());
                    chapterMap.put("bookOlid", chapter.getBookOlid());
                    chapterMap.put("createdAt", chapter.getCreatedAt());
                    chapterMap.put("updatedAt", chapter.getUpdatedAt());
                    m.put("chapter", chapterMap);
                }
                // BookRead info
                BookRead bookRead = cr.getBookRead();
                if (bookRead != null) {
                    Map<String, Object> bookReadMap = new HashMap<>();
                    bookReadMap.put("id", bookRead.getId());
                    bookReadMap.put("startDate", bookRead.getStartDate());
                    bookReadMap.put("endDate", bookRead.getEndDate());
                    bookReadMap.put("inProgress", bookRead.getInProgress());
                    // Book info
                    Book book = bookRead.getBook();
                    if (book != null) {
                        Map<String, Object> bookMap = new HashMap<>();
                        bookMap.put("olid", book.getOlid());
                        bookMap.put("title", book.getTitle());
                        bookMap.put("authors", book.getAuthors());
                        bookReadMap.put("book", bookMap);
                    }
                    m.put("bookRead", bookReadMap);
                }
            }
            result.add(m);
        }
        return result;
    }

    // Returns a summary of rewards for the current user
    @GetMapping("/rewards/summary")
    public Map<String, Object> getRewardsSummary() {
        User user = getCurrentUser();
        Double earned = rewardRepo.getTotalEarnedByUserId(user.getId());
        Double paidOut = rewardRepo.getTotalPaidOutByUserId(user.getId());
        Double spent = rewardRepo.getTotalSpentByUserId(user.getId());
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

    // Endpoint to spend rewards (creates a SPEND reward)
    @PostMapping("/rewards/spend")
    public ResponseEntity<?> spendReward(@RequestParam double amount, @RequestParam String note) {
        User user = getCurrentUser();
        if (amount <= 0) {
            return ResponseEntity.badRequest().body("Amount must be positive");
        }
        Reward reward = new Reward();
        reward.setType(RewardType.SPEND);
        reward.setUserId(user.getId());
        reward.setAmount(amount);
        reward.setNote(note);
        rewardRepo.save(reward);
        return ResponseEntity.ok().build();
    }

    // Update chapter name by id
    @PutMapping("/chapters/{id}")
    public ResponseEntity<Chapter> renameChapter(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        Optional<Chapter> opt = chapterRepo.findById(id);
        if (opt.isEmpty())
            return ResponseEntity.notFound().build();
        Chapter chapter = opt.get();
        String newName = body.get("name");
        if (newName == null || newName.trim().isEmpty())
            return ResponseEntity.badRequest().build();
        chapter.setName(newName.trim());
        chapterRepo.save(chapter);
        return ResponseEntity.ok(chapter);
    }

    // Create a new BookRead for an existing Book (for reread)
    @PostMapping("/books/{olid}/reread")
    public ResponseEntity<BookRead> rereadBook(@PathVariable String olid) {
        User user = getCurrentUser();
        Optional<Book> bookOpt = bookRepo.findById(olid);
        if (bookOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        BookRead br = new BookRead();
        br.setBookOlid(olid);
        br.setUserId(user.getId());
        br.setStartDate(java.time.LocalDateTime.now());
        BookRead saved = bookReadRepo.save(br);
        return ResponseEntity.ok(saved);
    }
}
