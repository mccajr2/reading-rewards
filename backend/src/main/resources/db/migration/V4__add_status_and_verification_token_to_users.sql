-- Add status column to users table for email verification
ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'UNVERIFIED';

-- If you also added verificationToken, add it as well:
ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
