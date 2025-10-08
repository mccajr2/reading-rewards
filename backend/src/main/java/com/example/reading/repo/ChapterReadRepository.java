package com.example.reading.repo;

import com.example.reading.model.ChapterRead;
import com.example.reading.model.User;
import org.springframework.data.jpa.repository.*;
import java.util.List;
import java.util.UUID;

public interface ChapterReadRepository extends JpaRepository<ChapterRead, UUID> {
    List<ChapterRead> findByUser(User user);

    List<ChapterRead> findByUserId(UUID userId);

    List<ChapterRead> findByBookReadId(UUID bookReadId);
}
