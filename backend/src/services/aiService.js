import OpenAI from 'openai';

// Lazy initialization of OpenAI client
let openaiClient = null;

const getOpenAIClient = () => {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
};

/**
 * Generate SQL query from natural language using OpenAI GPT-4
 * @param {string} naturalLanguageQuery - User's question in plain English
 * @param {string} schemaContext - Database schema as context
 * @returns {Promise<string>} Generated SQL query
 */
export const generateSQLFromNaturalLanguage = async (naturalLanguageQuery, schemaContext) => {
  try {
    const openai = getOpenAIClient();
    const systemPrompt = `You are an expert PostgreSQL database assistant. Your task is to convert natural language questions into valid PostgreSQL SQL queries.

IMPORTANT RULES:
1. Generate ONLY SELECT queries - no INSERT, UPDATE, DELETE, DROP, ALTER, or other modification statements
2. Return ONLY the SQL query without any explanation, markdown formatting, or code blocks
3. Use proper PostgreSQL syntax and functions
4. Include appropriate JOINs when multiple tables are involved
5. Use meaningful column aliases for calculated fields
6. Add LIMIT clauses for queries that might return large datasets (default to LIMIT 100 unless user specifies otherwise)
7. Handle NULL values appropriately
8. Use proper date/time functions for temporal queries
9. If the query is ambiguous or cannot be answered with the given schema, return: "ERROR: Unable to generate query - [brief reason]"

Database Schema:
${schemaContext}

Generate a SQL query that answers the user's question.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: naturalLanguageQuery
        }
      ],
      temperature: 0.2, // Low temperature for more deterministic output
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    const generatedSQL = response.choices[0].message.content.trim();

    // Remove markdown code blocks if present
    let cleanedSQL = generatedSQL
      .replace(/```sql\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Check for error responses
    if (cleanedSQL.startsWith('ERROR:')) {
      throw new Error(cleanedSQL);
    }

    // Validate that it's a SELECT query
    if (!cleanedSQL.toUpperCase().startsWith('SELECT')) {
      throw new Error('Generated query is not a SELECT statement');
    }

    return cleanedSQL;
  } catch (error) {
    console.error('Error generating SQL with OpenAI:', error);
    
    if (error.message.startsWith('ERROR:')) {
      throw error;
    }
    
    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please check your API key and billing.');
    }
    
    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key');
    }
    
    throw new Error(`Failed to generate SQL query: ${error.message}`);
  }
};

/**
 * Validate SQL query for safety (only SELECT queries allowed)
 * @param {string} sql - SQL query to validate
 * @returns {boolean} True if query is safe
 */
export const validateSQLSafety = (sql) => {
  const upperSQL = sql.toUpperCase().trim();
  
  // Must start with SELECT
  if (!upperSQL.startsWith('SELECT')) {
    return false;
  }
  
  // Check for dangerous keywords
  const dangerousKeywords = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 
    'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE'
  ];
  
  for (const keyword of dangerousKeywords) {
    // Use word boundaries to avoid false positives
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(sql)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Explain a SQL query in natural language
 * @param {string} sql - SQL query to explain
 * @returns {Promise<string>} Natural language explanation
 */
export const explainSQL = async (sql) => {
  try {
    const openai = getOpenAIClient();
    
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a database expert. Explain SQL queries in simple, clear language that non-technical users can understand.'
        },
        {
          role: 'user',
          content: `Explain this SQL query in simple terms:\n\n${sql}`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error explaining SQL:', error);
    return 'Unable to generate explanation';
  }
};
