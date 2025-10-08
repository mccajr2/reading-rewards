package com.example.reading.repo;

import com.example.reading.model.Book;
import org.springframework.data.jpa.repository.*;

public interface BookRepository extends JpaRepository<Book, String> {
}
