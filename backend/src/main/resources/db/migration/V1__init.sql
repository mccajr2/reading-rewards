CREATE TABLE IF NOT EXISTS books (
    olid VARCHAR(255) PRIMARY KEY,
    title VARCHAR(1000),
    authors VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS book_reads (
    id BIGSERIAL PRIMARY KEY,
    book_olid VARCHAR(255) REFERENCES books(olid),
    in_progress BOOLEAN DEFAULT TRUE,
    read_count INT DEFAULT 0
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

-- Rewards and payouts/spending tracking
CREATE TABLE rewards (
    id BIGSERIAL PRIMARY KEY,
    event_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(16) NOT NULL, -- 'EARN', 'PAYOUT', 'SPEND'
    amount DECIMAL(10,2) NOT NULL,
    note VARCHAR(255),
    chapter_read_id BIGINT REFERENCES chapter_reads(id) ON DELETE CASCADE
);
-- type = 'EARN' for reading earnings, 'PAYOUT' for parent payout, 'SPEND' for spending
-- note: for SPEND, describe what was purchased; for PAYOUT, optional note