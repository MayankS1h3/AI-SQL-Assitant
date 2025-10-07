-- ============================================================================
-- AI SQL Assistant - Required Supabase PostgreSQL Functions
-- ============================================================================
-- 
-- These functions must be created in each user's Supabase database to enable:
-- 1. Schema introspection (tables, columns, relationships, constraints)
-- 2. SQL query execution via the AI SQL Assistant
--
-- SECURITY NOTE: execute_sql uses SECURITY DEFINER which runs with elevated
-- privileges. Only allow SELECT queries in production for safety.
--
-- HOW TO USE:
-- 1. Open your Supabase project
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Function: execute_sql
-- Purpose: Execute SELECT queries and return results as JSON
-- Security: SECURITY DEFINER (runs as function owner)
-- Usage: Used by AI SQL Assistant to execute generated SQL queries
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Execute the query and convert results to JSON array
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error as JSON
    RETURN json_build_object(
      'error', SQLERRM,
      'hint', SQLSTATE
    );
END;
$$;

COMMENT ON FUNCTION execute_sql(text) IS 
  'Executes a SQL query and returns results as JSON. Used by AI SQL Assistant. Only SELECT queries recommended.';

-- ----------------------------------------------------------------------------
-- 2. Function: get_tables
-- Purpose: Get list of all tables in the public schema
-- Security: SECURITY DEFINER (safe, read-only)
-- Usage: Used to build schema context for AI
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (table_name text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tablename::text
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
$$;

COMMENT ON FUNCTION get_tables() IS 
  'Returns list of all tables in the public schema for schema introspection.';

-- ----------------------------------------------------------------------------
-- 3. Function: get_columns
-- Purpose: Get detailed information about all columns
-- Security: SECURITY DEFINER (safe, read-only)
-- Usage: Used to build schema context for AI
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_columns()
RETURNS TABLE (
  table_name text,
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    table_name::text,
    column_name::text,
    data_type::text,
    is_nullable::text,
    column_default::text
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position;
$$;

COMMENT ON FUNCTION get_columns() IS 
  'Returns detailed column information for all tables in the public schema.';

-- ----------------------------------------------------------------------------
-- 4. Function: get_foreign_keys
-- Purpose: Get all foreign key relationships
-- Security: SECURITY DEFINER (safe, read-only)
-- Usage: Used to understand table relationships for AI context
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_foreign_keys()
RETURNS TABLE (
  table_name text,
  column_name text,
  foreign_table_name text,
  foreign_column_name text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    tc.table_name::text,
    kcu.column_name::text,
    ccu.table_name::text AS foreign_table_name,
    ccu.column_name::text AS foreign_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
  ORDER BY tc.table_name;
$$;

COMMENT ON FUNCTION get_foreign_keys() IS 
  'Returns all foreign key relationships in the public schema.';

-- ----------------------------------------------------------------------------
-- 5. Function: get_constraints
-- Purpose: Get all table constraints (PRIMARY KEY, UNIQUE, CHECK, etc.)
-- Security: SECURITY DEFINER (safe, read-only)
-- Usage: Used to understand table constraints for AI context
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_constraints()
RETURNS TABLE (
  table_name text,
  constraint_name text,
  constraint_type text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    table_name::text,
    constraint_name::text,
    constraint_type::text
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
  ORDER BY table_name, constraint_type;
$$;

COMMENT ON FUNCTION get_constraints() IS 
  'Returns all constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK) for tables in the public schema.';

-- ----------------------------------------------------------------------------
-- 6. Optional Function: get_indexes
-- Purpose: Get information about indexes
-- Security: SECURITY DEFINER (safe, read-only)
-- Usage: Additional context for query optimization
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_indexes()
RETURNS TABLE (
  table_name text,
  index_name text,
  column_name text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    t.relname::text AS table_name,
    i.relname::text AS index_name,
    a.attname::text AS column_name
  FROM pg_class t
  JOIN pg_index ix ON t.oid = ix.indrelid
  JOIN pg_class i ON i.oid = ix.indexrelid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND t.relkind = 'r'
  ORDER BY t.relname, i.relname;
$$;

COMMENT ON FUNCTION get_indexes() IS 
  'Returns index information for tables in the public schema.';

-- ----------------------------------------------------------------------------
-- VERIFICATION
-- Run these queries to verify functions were created successfully:
-- ----------------------------------------------------------------------------

-- Test: List all functions
-- SELECT proname, pg_get_functiondef(oid) FROM pg_proc WHERE proname LIKE 'get_%' OR proname = 'execute_sql';

-- Test: Execute get_tables
-- SELECT * FROM get_tables();

-- Test: Execute get_columns (limit to 10 rows)
-- SELECT * FROM get_columns() LIMIT 10;

-- Test: Execute get_foreign_keys
-- SELECT * FROM get_foreign_keys();

-- Test: Execute get_constraints (limit to 10 rows)
-- SELECT * FROM get_constraints() LIMIT 10;

-- Test: Execute a simple query via execute_sql
-- SELECT execute_sql('SELECT 1 as test');

-- ----------------------------------------------------------------------------
-- SECURITY BEST PRACTICES
-- ----------------------------------------------------------------------------
--
-- 1. Grant Execute Permissions (Optional - restrict to specific roles):
--    GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;
--    GRANT EXECUTE ON FUNCTION get_tables() TO authenticated;
--    -- etc.
--
-- 2. For Production: Consider modifying execute_sql to only allow SELECT:
--    Add validation logic to check if query starts with SELECT
--
-- 3. Audit Logging: Consider adding logging to execute_sql to track usage
--
-- 4. Rate Limiting: Implement rate limiting at the application level
--
-- 5. Review Permissions: Ensure SECURITY DEFINER functions have minimal
--    permissions and only access what's necessary
--
-- ----------------------------------------------------------------------------

-- ============================================================================
-- Installation Complete!
-- ============================================================================
-- 
-- Your Supabase database is now ready to work with AI SQL Assistant.
-- 
-- Next Steps:
-- 1. In the AI SQL Assistant app, click "Add Connection"
-- 2. Enter your Supabase URL: https://[your-project-ref].supabase.co
-- 3. Enter your Supabase Anon Key (from Settings > API)
-- 4. Optionally add Service Role Key for more permissions
-- 5. Start querying with natural language!
--
-- ============================================================================
