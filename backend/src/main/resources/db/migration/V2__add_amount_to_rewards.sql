-- V5__add_amount_to_rewards.sql
ALTER TABLE rewards ADD COLUMN amount DOUBLE PRECISION NOT NULL DEFAULT 0.0;