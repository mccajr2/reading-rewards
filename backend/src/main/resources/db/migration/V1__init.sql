-- V1__initial_schema.sql
-- Initial schema for reading tracking application

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(10) NOT NULL CHECK (role IN ('PARENT', 'CHILD')),
    parent_id UUID,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT email_required_for_parent CHECK (
        (role = 'PARENT' AND email IS NOT NULL) OR role = 'CHILD'
    ),
    CONSTRAINT username_required_for_child CHECK (
        (role = 'CHILD' AND username IS NOT NULL) OR role = 'PARENT'
    ),
    CONSTRAINT parent_required_for_child CHECK (
        (role = 'CHILD' AND parent_id IS NOT NULL) OR role = 'PARENT'
    ),
    CONSTRAINT parent_cannot_have_parent CHECK (
        (role = 'PARENT' AND parent_id IS NULL) OR role = 'CHILD'
    )
);

CREATE INDEX idx_users_parent_id ON users(parent_id);

-- Books table
CREATE TABLE books (
    olid VARCHAR(50) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    authors TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Chapters table
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_olid VARCHAR(50) NOT NULL,
    name VARCHAR(500) NOT NULL,
    chapter_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_book FOREIGN KEY (book_olid) REFERENCES books(olid) ON DELETE CASCADE,
    CONSTRAINT unique_book_chapter_index UNIQUE (book_olid, chapter_index)
);

CREATE INDEX idx_chapters_book_olid ON chapters(book_olid);

-- Book reads table
CREATE TABLE book_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_olid VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    in_progress BOOLEAN GENERATED ALWAYS AS (end_date IS NULL) STORED,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_book_read_book FOREIGN KEY (book_olid) REFERENCES books(olid) ON DELETE CASCADE,
    CONSTRAINT fk_book_read_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_book_reads_user_id ON book_reads(user_id);
CREATE INDEX idx_book_reads_book_olid ON book_reads(book_olid);
CREATE INDEX idx_book_reads_in_progress ON book_reads(in_progress) WHERE in_progress = true;

-- Chapter reads table
CREATE TABLE chapter_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_read_id UUID NOT NULL,
    chapter_id UUID NOT NULL,
    user_id UUID NOT NULL,
    completion_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chapter_read_book_read FOREIGN KEY (book_read_id) REFERENCES book_reads(id) ON DELETE CASCADE,
    CONSTRAINT fk_chapter_read_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    CONSTRAINT fk_chapter_read_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_chapter_reads_book_read_id ON chapter_reads(book_read_id);
CREATE INDEX idx_chapter_reads_user_id ON chapter_reads(user_id);
CREATE INDEX idx_chapter_reads_chapter_id ON chapter_reads(chapter_id);

-- Rewards table
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('EARN', 'PAYOUT', 'SPEND')),
    user_id UUID NOT NULL,
    chapter_read_id UUID,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reward_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reward_chapter_read FOREIGN KEY (chapter_read_id) REFERENCES chapter_reads(id) ON DELETE SET NULL,
    CONSTRAINT chapter_read_for_earn CHECK (
        (type = 'EARN' AND chapter_read_id IS NOT NULL) OR type != 'EARN'
    )
);

CREATE INDEX idx_rewards_user_id ON rewards(user_id);
CREATE INDEX idx_rewards_type ON rewards(type);
CREATE INDEX idx_rewards_chapter_read_id ON rewards(chapter_read_id);

-- Insert test users
-- Note: Password is 'password123' hashed with bcrypt (you should use proper password encoding in production)
INSERT INTO users (id, role, parent_id, email, username, password, created_at, updated_at) VALUES
    ('00000000-0000-0000-0000-000000000001', 'PARENT', NULL, 'parent@example.com', NULL, '$2a$10$rBV2JDeWW2eQhXa6ZF1kD.t7bCZvF/6.vNvZq1fVLvJZlJqBKOZSa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000002', 'CHILD', '00000000-0000-0000-0000-000000000001', NULL, 'kidreader', '$2a$10$rBV2JDeWW2eQhXa6ZF1kD.t7bCZvF/6.vNvZq1fVLvJZlJqBKOZSa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);