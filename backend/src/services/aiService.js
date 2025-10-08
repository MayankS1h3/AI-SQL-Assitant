import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Get the appropriate AI client based on configuration
 * @returns {Object} AI client instance
 */
const getAIClient = () => {
  const provider = process.env.AI_PROVIDER || 'openai';
  
  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }
    return {
      provider: 'gemini',
      client: new GoogleGenerativeAI(apiKey)
    };
  }
  
  // Default to OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured in environment variables');
  }
  return {
    provider: 'openai',
    client: new OpenAI({ apiKey })
  };
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getAIClient instead
 */
const getOpenAIClient = () => {
  const aiClient = getAIClient();
  if (aiClient.provider !== 'openai') {
    throw new Error('OpenAI client requested but different provider configured');
  }
  return aiClient.client;
};

/**
 * Generate SQL query from natural language using OpenAI GPT-4
 * @param {string} naturalLanguageQuery - User's question in plain English
 * @param {string} schemaContext - Database schema as context
 * @returns {Promise<string>} Generated SQL query
 */
export const generateSQLFromNaturalLanguage = async (naturalLanguageQuery, schemaContext) => {
  try {
    const aiClient = getAIClient();
    
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

    let generatedSQL;

    if (aiClient.provider === 'gemini') {
      // Use Gemini 2.5 Flash - latest free tier model
      const model = aiClient.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `${systemPrompt}\n\nUser Question: ${naturalLanguageQuery}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      generatedSQL = response.text().trim();
    } else {
      // Use OpenAI
      const response = await aiClient.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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
        temperature: 0.2,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      generatedSQL = response.choices[0].message.content.trim();
    }

    // Remove markdown code blocks if present
    let cleanedSQL = generatedSQL
      .replace(/```sql\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Remove any leading/trailing whitespace and newlines more aggressively
    cleanedSQL = cleanedSQL.replace(/^\s+|\s+$/g, '');
    
    // Extract just the SQL query if there's explanatory text
    // Look for SELECT and take everything after it
    const selectMatch = cleanedSQL.match(/SELECT[\s\S]*/i);
    if (selectMatch) {
      cleanedSQL = selectMatch[0].trim();
    }

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
    const aiClient = getAIClient();
    
    let explanation;

    if (aiClient.provider === 'gemini') {
      // Use Gemini 2.5 Flash - latest free tier model
      const model = aiClient.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `You are a database expert. Explain SQL queries in simple, clear language that non-technical users can understand.\n\nExplain this SQL query in simple terms:\n\n${sql}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      explanation = response.text().trim();
    } else {
      // Use OpenAI
      const response = await aiClient.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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

      explanation = response.choices[0].message.content.trim();
    }

    return explanation;
  } catch (error) {
    console.error('Error explaining SQL:', error);
    return 'Unable to generate explanation';
  }
};
