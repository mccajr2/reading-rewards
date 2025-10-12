package com.example.reading.repo;

import com.example.reading.model.Chapter;
import org.springframework.data.jpa.repository.*;
import java.util.List;
import java.util.UUID;

public interface ChapterRepository extends JpaRepository<Chapter, UUID> {
    List<Chapter> findByGoogleBookIdOrderByChapterIndex(String googleBookId);

    void deleteByGoogleBookId(String googleBookId);
}
