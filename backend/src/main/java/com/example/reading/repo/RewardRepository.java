package com.example.reading.repo;

import com.example.reading.model.ChapterRead;
import com.example.reading.model.Reward;
import com.example.reading.model.RewardType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface RewardRepository extends JpaRepository<Reward, UUID> {
    List<Reward> findByUserId(UUID userId);

    List<Reward> findByUserIdAndChapterRead(UUID userId, ChapterRead chapterRead);

    @Query("SELECT SUM(r.amount) FROM Reward r WHERE r.userId = :userId AND r.type = :type")
    Double sumByUserIdAndType(UUID userId, RewardType type);

    @Query("SELECT SUM(r.amount) FROM Reward r WHERE r.userId = :userId AND r.type = 'EARN'")
    Double getTotalEarnedByUserId(UUID userId);

    @Query("SELECT SUM(r.amount) FROM Reward r WHERE r.userId = :userId AND r.type = 'PAYOUT'")
    Double getTotalPaidOutByUserId(UUID userId);

    @Query("SELECT SUM(r.amount) FROM Reward r WHERE r.userId = :userId AND r.type = 'SPEND'")
    Double getTotalSpentByUserId(UUID userId);

}
