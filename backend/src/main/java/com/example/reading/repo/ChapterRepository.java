package com.example.reading.repo;
import com.example.reading.model.Chapter;
import org.springframework.data.jpa.repository.*;
import java.util.*;
public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    List<Chapter> findByBookOlidOrderByChapterIndex(String bookOlid);
    void deleteByBookOlid(String bookOlid);
}
