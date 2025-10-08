package com.example.reading.repo;

import com.example.reading.model.BookRead;
import com.example.reading.model.Book;
import com.example.reading.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface BookReadRepository extends JpaRepository<BookRead, UUID> {
    List<BookRead> findByBook(Book book);

    BookRead findTopByBookOrderByIdDesc(Book book);

    List<BookRead> findByUser(User user);

    List<BookRead> findByUserId(UUID userId);

    BookRead findTopByBookAndUserOrderByIdDesc(Book book, User user);
}
