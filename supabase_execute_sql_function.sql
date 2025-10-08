-- Create RPC function to execute dynamic SQL queries
-- This allows the AI SQL Assistant to run complex queries with JOINs, aggregations, etc.

CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Only allow SELECT queries for security
  IF query !~* '^\s*SELECT' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Execute the query and return results as JSON array
  EXECUTE 'SELECT COALESCE(json_agg(t), ''[]''::json) FROM (' || query || ') t' INTO result;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error details as JSON
    RETURN json_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated, anon;

-- Add a comment for documentation
COMMENT ON FUNCTION execute_sql(text) IS 
'Executes a SELECT query and returns results as JSON. Only SELECT queries are allowed for security.';
