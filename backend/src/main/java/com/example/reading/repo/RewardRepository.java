package com.example.reading.repo;

import com.example.reading.model.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RewardRepository extends JpaRepository<Reward, UUID> {
    List<Reward> findByUserId(UUID userId);

    List<Reward> findByUserIdAndType(UUID userId, Reward.RewardType type);
}
