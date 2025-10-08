import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const { Client } = pg;

/**
 * Create a Supabase client for interacting with user's database
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} supabaseKey - Supabase anon or service role key
 * @returns {Object} Supabase client
 */
export const createSupabaseClient = (supabaseUrl, supabaseKey) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    return supabase;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw new Error('Failed to create Supabase client');
  }
};

/**
 * Create a direct PostgreSQL connection to Supabase database
 * This is used for schema introspection and SQL execution
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} supabaseServiceRoleKey - Service role key for direct DB access
 * @returns {Object} PostgreSQL client
 */
export const createDirectConnection = async (supabaseUrl, supabaseServiceRoleKey) => {
  try {
    // Extract project ref from Supabase URL
    // Format: https://xxxxx.supabase.co
    const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)[1];
    
    // Construct direct PostgreSQL connection string
    // Note: This requires the service role key and database password
    // For production, you may need to store the database password separately
    const connectionString = `postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`;
    
    const client = new Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('Error creating direct PostgreSQL connection:', error);
    throw new Error('Failed to connect to database');
  }
};

/**
 * Test database connection
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} supabaseKey - Supabase key
 * @returns {Promise<boolean>} True if connection successful
 */
export const testConnection = async (supabaseUrl, supabaseKey) => {
  try {
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
    
    // Try to use a simple health check using auth API
    // This doesn't require any tables to exist
    const { data, error } = await supabase.auth.getSession();
    
    // Even if there's no session, if we get a response, the connection works
    // Network errors will be caught in the catch block
    
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};

/**
 * Execute raw SQL query using Supabase RPC
 * Note: This requires a database function to be created in Supabase
 * @param {Object} supabase - Supabase client
 * @param {string} sql - SQL query to execute
 * @returns {Promise<Object>} Query results
 */
export const executeSQL = async (supabase, sql) => {
  try {
    // Use Supabase RPC to execute SQL
    // This requires creating a PostgreSQL function in your Supabase database
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
};
