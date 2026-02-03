-- Mpikarakara Database Initialization Script
-- This script runs automatically when PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'Europe/Paris';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mpikarakara TO mpikarakara;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Mpikarakara database initialized successfully!';
END $$;
