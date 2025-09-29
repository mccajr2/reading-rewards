package com.example.reading.repo;
import com.example.reading.model.ChapterRead;
import org.springframework.data.jpa.repository.*;
import java.util.*;
public interface ChapterReadRepository extends JpaRepository<ChapterRead, Long> {
    List<ChapterRead> findByBookOlidOrderByReadAtDesc(String bookOlid);
    List<ChapterRead> findAllByOrderByReadAtDesc();
    List<ChapterRead> findAllByBookOlidAndChapterIndexOrderByReadAtDesc(String bookOlid, int chapterIndex);
    void deleteAllByBookOlid(String bookOlid);
}
