package com.example.reading.repo;

import com.example.reading.model.BookRead;
import com.example.reading.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookReadRepository extends JpaRepository<BookRead, Long> {
    List<BookRead> findByBook(Book book);
    BookRead findTopByBookOrderByIdDesc(Book book);
}
