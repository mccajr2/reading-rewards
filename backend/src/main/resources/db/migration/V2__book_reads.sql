
CREATE TABLE IF NOT EXISTS book_reads (
    id BIGSERIAL PRIMARY KEY,
    book_olid VARCHAR(255) REFERENCES books(olid),
    in_progress BOOLEAN DEFAULT TRUE,
    read_count INT DEFAULT 0
);

-- Migrate in_progress from books to book_reads
INSERT INTO book_reads (book_olid, in_progress, read_count)
SELECT olid, in_progress, 0 FROM books;

ALTER TABLE books DROP COLUMN IF EXISTS in_progress;
