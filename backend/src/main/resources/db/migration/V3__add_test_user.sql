-- V3__add_test_user.sql
-- Add a test user with username 'test' and password 'test' (bcrypt hash)
INSERT INTO users (id, role, parent_id, email, username, password, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'CHILD',
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'test',
    '$2a$10$Q9QwQwQwQwQwQwQwQwQwQOeQwQwQwQwQwQwQwQwQwQwQwQwQwQwQw',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
