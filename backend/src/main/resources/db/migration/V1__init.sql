CREATE TABLE IF NOT EXISTS books (
    olid VARCHAR(255) PRIMARY KEY,
    title VARCHAR(1000),
    authors VARCHAR(1000),
    in_progress BOOLEAN DEFAULT FALSE
);


CREATE TABLE IF NOT EXISTS chapters (
    id BIGSERIAL PRIMARY KEY,
    book_olid VARCHAR(255),
    chapter_index INT,
    name VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS chapter_reads (
    id BIGSERIAL PRIMARY KEY,
    book_olid VARCHAR(255),
    chapter_index INT,
    read_at TIMESTAMP DEFAULT now(),
    credit INT
);
