import { buildSimpleSchema, executeSQLQuery } from '../utils/schemaFetcher.js';
import { generateSQLFromNaturalLanguage, validateSQLSafety } from './aiService.js';

/**
 * Service to prepare schema and generate/execute SQL queries
 */

/**
 * Fetch and cache database schema
 * @param {Object} connection - Decrypted connection credentials
 * @param {Object} cache - Cache instance
 * @param {string} cacheKey - Cache key
 * @returns {Promise<string>} Schema string
 */
export const prepareSchema = async (connection, cache, cacheKey) => {
  try {
    // Check cache first
    const cachedSchema = cache.get(cacheKey);
    if (cachedSchema) {
      return cachedSchema;
    }

    // Fetch schema from database
    // Use service role key if available, otherwise use anon key
    const key = connection.supabaseServiceRoleKey || connection.supabaseAnonKey;
    
    const schemaString = await buildSimpleSchema(connection.supabaseUrl, key);

    // Cache the schema
    const ttl = parseInt(process.env.SCHEMA_CACHE_TTL) || 600;
    cache.set(cacheKey, schemaString, ttl);

    return schemaContext;
  } catch (error) {
    throw new Error(`Schema preparation failed: ${error.message}`);
  }
};

/**
 * Generate and execute SQL query
 * @param {string} naturalLanguageQuery - User's question
 * @param {string} schemaContext - Database schema
 * @param {Object} connection - Decrypted connection credentials
 * @returns {Promise<Object>} Query results
 */
export const generateAndExecuteQuery = async (naturalLanguageQuery, schemaContext, connection) => {
  const startTime = Date.now();

  try {
    // Generate SQL using AI
    const generatedSQL = await generateSQLFromNaturalLanguage(
      naturalLanguageQuery,
      schemaContext
    );

    // Validate SQL for safety
    if (!validateSQLSafety(generatedSQL)) {
      throw new Error('Generated query contains unsafe operations. Only SELECT queries are allowed.');
    }

    // Execute SQL query
    // Use service role key if available for better permissions
    const key = connection.supabaseServiceRoleKey || connection.supabaseAnonKey;
    
    const result = await executeSQLQuery(
      connection.supabaseUrl,
      key,
      generatedSQL
    );

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      generatedSQL,
      results: result.data,
      rowCount: result.rowCount,
      executionTime
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('Error in query generation/execution:', error);
    
    return {
      success: false,
      generatedSQL: null,
      error: error.message,
      executionTime
    };
  }
};
