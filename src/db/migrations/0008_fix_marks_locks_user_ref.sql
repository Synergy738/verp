-- Fix marks_locks: locked_by and unlocked_by should be text referencing user.id
-- (Better Auth uses text IDs, not UUIDs)

-- Drop existing FK constraints
ALTER TABLE marks_locks DROP CONSTRAINT marks_locks_locked_by_fkey;
ALTER TABLE marks_locks DROP CONSTRAINT marks_locks_unlocked_by_fkey;

-- Change column types from uuid to text
ALTER TABLE marks_locks ALTER COLUMN locked_by TYPE text USING locked_by::text;
ALTER TABLE marks_locks ALTER COLUMN unlocked_by TYPE text USING unlocked_by::text;

-- Add new FK constraints referencing user table
ALTER TABLE marks_locks ADD CONSTRAINT marks_locks_locked_by_user_fk
  FOREIGN KEY (locked_by) REFERENCES "user"(id) ON DELETE SET NULL;
ALTER TABLE marks_locks ADD CONSTRAINT marks_locks_unlocked_by_user_fk
  FOREIGN KEY (unlocked_by) REFERENCES "user"(id) ON DELETE SET NULL;
