package com.example.reading.repo;

import com.example.reading.model.ChapterRead;
import com.example.reading.model.Reward;
import com.example.reading.model.RewardType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface RewardRepository extends JpaRepository<Reward, Long> {
    List<Reward> findByType(RewardType type);

    List<Reward> findByTypeAndChapterRead(RewardType type, ChapterRead chapterRead);

    @Query("SELECT SUM(r.amount) FROM Reward r WHERE r.type = :type")
    Double sumByType(RewardType type);

    @Query("SELECT SUM(r.amount) FROM Reward r WHERE r.type = 'EARN'")
    Double getTotalEarned();

    @Query("SELECT SUM(r.amount) FROM Reward r WHERE r.type = 'PAYOUT'")
    Double getTotalPaidOut();

    @Query("SELECT SUM(r.amount) FROM Reward r WHERE r.type = 'SPEND'")
    Double getTotalSpent();
}
