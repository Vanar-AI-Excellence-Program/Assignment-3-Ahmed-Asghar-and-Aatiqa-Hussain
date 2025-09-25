-- Align foreign-key column types with users.id (varchar(255))

-- Accounts.user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'user_id' AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE accounts
      ALTER COLUMN user_id TYPE varchar(255) USING user_id::text;
  END IF;
END$$;

-- Password reset tokens.user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'password_reset_tokens' AND column_name = 'user_id' AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE password_reset_tokens
      ALTER COLUMN user_id TYPE varchar(255) USING user_id::text;
  END IF;
END$$;

-- Sessions.user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'user_id' AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE sessions
      ALTER COLUMN user_id TYPE varchar(255) USING user_id::text;
  END IF;
END$$;

-- Ensure FKs are present now that types match
DO $$ BEGIN
  ALTER TABLE accounts
    ADD CONSTRAINT IF NOT EXISTS accounts_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE password_reset_tokens
    ADD CONSTRAINT IF NOT EXISTS password_reset_tokens_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE sessions
    ADD CONSTRAINT IF NOT EXISTS sessions_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


