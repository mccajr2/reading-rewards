package com.example.reading.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.UUID;
import com.example.reading.service.GoogleBooksService;
import com.example.reading.repo.*;
import com.example.reading.model.*;
import com.example.reading.dto.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api")
public class ApiController {

    @Autowired
    GoogleBooksService googleBooksService;
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


    private User getCurrentUser(UserDetails userDetails) {
        return userRepo.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/search")
    public List<BookSummaryDto> search(@RequestParam(required = false) String title, @RequestParam(required = false) String author, @RequestParam(required = false) String isbn) {
        return googleBooksService.search(title, author, isbn);
    }

    @GetMapping("/books")
    public List<Map<String, Object>> getBooks(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        List<BookRead> bookReads = bookReadRepo.findByUserId(user.getId());
        Map<String, Map<String, Object>> bookMap = new HashMap<>();
        for (BookRead br : bookReads) {
            Book book = br.getBook();
            if (book == null)
                continue;
            String googleBookId = book.getGoogleBookId();
            Map<String, Object> m = bookMap.computeIfAbsent(googleBookId, k -> {
                Map<String, Object> map = new HashMap<>();
                map.put("googleBookId", book.getGoogleBookId());
                map.put("title", book.getTitle());
                map.put("description", book.getDescription());
                map.put("thumbnailUrl", book.getThumbnailUrl());
                map.put("authors", book.getAuthors());
                map.put("inProgress", Boolean.TRUE.equals(br.getInProgress()));
                map.put("readCount", 0);
                map.put("endDate", LocalDateTime.MIN);
                return map;
            });
            m.put("readCount", (int) m.get("readCount") + 1);
            LocalDateTime currentEndDate = (LocalDateTime) m.get("endDate");
            LocalDateTime brEndDate = br.getEndDate();
            if (brEndDate != null) {
                m.put("endDate", currentEndDate.isAfter(brEndDate) ? currentEndDate : brEndDate);
            }
        }
        return new ArrayList<>(bookMap.values());
    }

    @PostMapping("/books")
    public Book saveBook(@RequestBody BookSummaryDto dto, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        Book b = new Book();
        b.setGoogleBookId(dto.getGoogleBookId());
        b.setTitle(dto.getTitle());
        b.setDescription(dto.getDescription());
        b.setThumbnailUrl(dto.getThumbnailUrl());
        b.setAuthors(dto.getAuthors() != null ? dto.getAuthors() : new ArrayList<>());
        Book saved = bookRepo.save(b);
        BookRead br = new BookRead();
        br.setGoogleBookId(saved.getGoogleBookId());
        br.setUserId(user.getId());
        br.setStartDate(java.time.LocalDateTime.now());
        bookReadRepo.save(br);
        return saved;
    }

    @PostMapping("/books/{googleBookId}/finish")
    @Transactional
    public ResponseEntity<?> finishBook(@PathVariable String googleBookId, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        List<BookRead> bookReads = bookReadRepo.findByUserId(user.getId());
        boolean found = false;
        for (BookRead br : bookReads) {
            if (googleBookId.equals(br.getGoogleBookId()) && Boolean.TRUE.equals(br.getInProgress())) {
                br.setEndDate(java.time.LocalDateTime.now());
                bookReadRepo.save(br);
                found = true;
            }
        }
        return found ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/books/{googleBookId}/chapters")
    public List<Chapter> saveChapters(@PathVariable String googleBookId, @RequestBody List<Chapter> chapters) {
        chapterRepo.deleteByGoogleBookId(googleBookId);
        for (Chapter c : chapters)
            c.setGoogleBookId(googleBookId);
        return chapterRepo.saveAll(chapters);
    }

    @GetMapping("/books/{googleBookId}/chapters")
    public List<Chapter> getChapters(@PathVariable String googleBookId) {
        return chapterRepo.findByGoogleBookIdOrderByChapterIndex(googleBookId);
    }

    // New: Mark a chapter as read for a specific BookRead instance
    @PostMapping("/bookreads/{bookReadId}/chapters/{chapterId}/read")
    public ChapterRead markReadForBookRead(@PathVariable UUID bookReadId, @PathVariable UUID chapterId, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
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
    public ResponseEntity<?> deleteRead(@PathVariable String olid, @PathVariable UUID chapterId, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
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
    public Map<String, Object> credits(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
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
    public List<ChapterRead> history(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
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
    public List<BookReadProgressDto> getInProgressBookReads(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        List<BookRead> bookReads = bookReadRepo.findByUserId(user.getId());
        List<BookReadProgressDto> result = new ArrayList<>();
        for (BookRead br : bookReads) {
            if (!Boolean.TRUE.equals(br.getInProgress()))
                continue;
            Book book = br.getBook();
            if (book == null)
                continue;
            // Count all BookRead instances for this user/book
            int readCount = (int) bookReads.stream().filter(b -> b.getGoogleBookId().equals(book.getGoogleBookId())).count();
            // Get all read chapter IDs for this BookRead
            List<UUID> readChapterIds = readRepo.findByBookReadId(br.getId())
                    .stream().map(cr -> cr.getChapterId()).toList();
            result.add(new BookReadProgressDto(br, book, readCount, readChapterIds));
        }
        return result;
    }

    // Returns paginated rewards for the current user, with nested info for EARN rewards
    @GetMapping("/rewards")
    public Map<String, Object> getRewards(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "pageSize", required = false, defaultValue = "10") int pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        List<Reward> allRewards = rewardRepo.findByUserId(user.getId());
        // Sort rewards by createdAt descending (most recent first)
        allRewards.sort((a, b) -> {
            if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
            if (a.getCreatedAt() == null) return 1;
            if (b.getCreatedAt() == null) return -1;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });
        int totalCount = allRewards.size();
        int fromIndex = Math.max(0, Math.min((page - 1) * pageSize, totalCount));
        int toIndex = Math.max(0, Math.min(fromIndex + pageSize, totalCount));
        List<Reward> rewards = allRewards.subList(fromIndex, toIndex);
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
                    chapterMap.put("bookGoogleBookId", chapter.getGoogleBookId());
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
                        bookMap.put("googleBookId", book.getGoogleBookId());
                        bookMap.put("title", book.getTitle());
                        bookMap.put("authors", book.getAuthors());
                        bookReadMap.put("book", bookMap);
                    }
                    m.put("bookRead", bookReadMap);
                }
            }
            result.add(m);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("rewards", result);
        response.put("totalCount", totalCount);
        return response;
    }

    // Returns a summary of rewards for the current user
    @GetMapping("/rewards/summary")
    public Map<String, Object> getRewardsSummary(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
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
    public ResponseEntity<?> spendReward(@RequestParam double amount, @RequestParam String note, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
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
    @PostMapping("/books/{googleBookId}/reread")
    public ResponseEntity<BookRead> rereadBook(@PathVariable String googleBookId, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        Optional<Book> bookOpt = bookRepo.findById(googleBookId);
        if (bookOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        BookRead br = new BookRead();
        br.setGoogleBookId(googleBookId);
        br.setUserId(user.getId());
        br.setStartDate(java.time.LocalDateTime.now());
        BookRead saved = bookReadRepo.save(br);
        return ResponseEntity.ok(saved);
    }
    // Delete a BookRead and all associated ChapterReads and Rewards for the current user
    @DeleteMapping("/bookreads/{bookReadId}")
    @Transactional
    public ResponseEntity<?> deleteBookRead(@PathVariable UUID bookReadId, @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        Optional<BookRead> bookReadOpt = bookReadRepo.findById(bookReadId);
        if (bookReadOpt.isEmpty() || !user.getId().equals(bookReadOpt.get().getUserId())) {
            return ResponseEntity.notFound().build();
        }
        // Delete all ChapterReads for this BookRead
        List<ChapterRead> chapterReads = readRepo.findByBookReadId(bookReadId);
        for (ChapterRead cr : chapterReads) {
            // Delete all rewards referencing this ChapterRead
            List<Reward> rewards = rewardRepo.findByUserIdAndChapterRead(user.getId(), cr);
            rewardRepo.deleteAll(rewards);
        }
        readRepo.deleteAll(chapterReads);
        // Optionally, delete rewards not tied to chapterReads (if any)
        // Finally, delete the BookRead
        bookReadRepo.deleteById(bookReadId);
        return ResponseEntity.ok().build();
    }
}
