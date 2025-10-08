import { createClient } from '@supabase/supabase-js';

/**
 * Fetch comprehensive database schema including tables, columns, constraints, and relationships
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} supabaseKey - Supabase service role key (for schema access)
 * @returns {Promise<Object>} Schema information
 */
export const fetchDatabaseSchema = async (supabaseUrl, supabaseKey) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch tables directly from Supabase's public schema
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      // Fallback: Try to get tables by listing from a known table
      return await buildSimpleSchemaFallback(supabase);
    }

    // Fetch columns for all tables
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .order('table_name')
      .order('ordinal_position');

    if (columnsError) {
      console.error('Error fetching columns:', columnsError);
      return await buildSimpleSchemaFallback(supabase);
    }

    // Try to fetch foreign keys (may not have permission)
    const { data: foreignKeys } = await supabase
      .from('information_schema.key_column_usage')
      .select('*')
      .eq('table_schema', 'public')
      .not('referenced_table_name', 'is', null);

    return {
      tables: tables || [],
      columns: columns || [],
      foreignKeys: foreignKeys || [],
      constraints: []
    };
  } catch (error) {
    console.error('Error fetching database schema:', error);
    throw error;
  }
};

/**
 * Fallback method to build schema when information_schema is not accessible
 * This introspects actual tables in the database
 */
const buildSimpleSchemaFallback = async (supabase) => {
  // List of common table names to check
  const commonTables = ['students', 'courses', 'enrollments', 'teachers', 
                        'departments', 'grades', 'assignments', 'users'];
  
  const tables = [];
  const columns = [];
  
  for (const tableName of commonTables) {
    try {
      // Try to fetch a single row to get column structure
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error && data !== null) {
        tables.push({ table_name: tableName });
        
        // If we got data, extract column names
        if (data.length > 0) {
          const row = data[0];
          Object.keys(row).forEach(columnName => {
            columns.push({
              table_name: tableName,
              column_name: columnName,
              data_type: typeof row[columnName],
              is_nullable: 'YES'
            });
          });
        }
      }
    } catch (err) {
      // Table doesn't exist, skip it
      continue;
    }
  }
  
  return {
    tables,
    columns,
    foreignKeys: [],
    constraints: []
  };
};

/**
 * Build a prioritized schema string for AI context
 * This creates a simplified schema focused on the most important information
 * @param {Object} schemaData - Full schema data from fetchDatabaseSchema
 * @param {Array<string>} priorityTables - Optional list of tables to prioritize
 * @returns {string} Formatted schema string for AI
 */
export const buildPrioritizedSchema = (schemaData, priorityTables = []) => {
  const { tables, columns, foreignKeys, constraints } = schemaData;
  
  let schemaString = '-- PostgreSQL Database Schema\n\n';

  // Group columns by table
  const columnsByTable = columns.reduce((acc, col) => {
    if (!acc[col.table_name]) {
      acc[col.table_name] = [];
    }
    acc[col.table_name].push(col);
    return acc;
  }, {});

  // Group foreign keys by table
  const fksByTable = foreignKeys.reduce((acc, fk) => {
    if (!acc[fk.table_name]) {
      acc[fk.table_name] = [];
    }
    acc[fk.table_name].push(fk);
    return acc;
  }, {});

  // Sort tables: priority tables first, then alphabetically
  const sortedTables = [...tables].sort((a, b) => {
    const aPriority = priorityTables.includes(a.table_name);
    const bPriority = priorityTables.includes(b.table_name);
    
    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;
    return a.table_name.localeCompare(b.table_name);
  });

  // Build schema for each table
  sortedTables.forEach(table => {
    const tableName = table.table_name;
    const tableColumns = columnsByTable[tableName] || [];
    const tableFKs = fksByTable[tableName] || [];

    schemaString += `-- Table: ${tableName}\n`;
    schemaString += `CREATE TABLE ${tableName} (\n`;

    // Add columns
    tableColumns.forEach((col, index) => {
      const isLast = index === tableColumns.length - 1;
      let columnDef = `  ${col.column_name} ${col.data_type.toUpperCase()}`;
      
      // Add constraints
      if (col.is_nullable === 'NO') {
        columnDef += ' NOT NULL';
      }
      if (col.column_default) {
        columnDef += ` DEFAULT ${col.column_default}`;
      }
      
      schemaString += columnDef + (isLast ? '' : ',') + '\n';
    });

    schemaString += ');\n';

    // Add foreign key relationships
    if (tableFKs.length > 0) {
      schemaString += `-- Foreign Keys for ${tableName}:\n`;
      tableFKs.forEach(fk => {
        schemaString += `--   ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}\n`;
      });
    }

    schemaString += '\n';
  });

  // Add summary of relationships
  if (foreignKeys.length > 0) {
    schemaString += '-- Relationships Summary:\n';
    foreignKeys.forEach(fk => {
      schemaString += `-- ${fk.table_name}.${fk.column_name} references ${fk.foreign_table_name}.${fk.foreign_column_name}\n`;
    });
  }

  return schemaString;
};

/**
 * Build a simple schema string (fallback if RPC functions don't exist)
 * This uses basic Supabase queries without custom RPC functions
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} supabaseKey - Supabase key
 * @returns {Promise<string>} Simple schema string
 */
export const buildSimpleSchema = async (supabaseUrl, supabaseKey) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to get list of tables by querying information_schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (error) {
      console.error('Error accessing information_schema:', error);
      // Use fallback method
      return await buildDetailedSchemaFromIntrospection(supabase);
    }

    if (!data || data.length === 0) {
      return await buildDetailedSchemaFromIntrospection(supabase);
    }

    // Build schema string with table and column information
    let schemaString = '-- PostgreSQL Database Schema\n\n';
    
    for (const table of data) {
      const tableName = table.table_name;
      
      // Get columns for this table
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      
      if (columns && columns.length > 0) {
        schemaString += `Table: ${tableName}\n`;
        columns.forEach(col => {
          schemaString += `  - ${col.column_name} (${col.data_type})${col.is_nullable === 'NO' ? ' NOT NULL' : ''}\n`;
        });
        schemaString += '\n';
      }
    }

    return schemaString;
  } catch (error) {
    console.error('Error building schema:', error);
    // Final fallback
    const supabase = createClient(supabaseUrl, supabaseKey);
    return await buildDetailedSchemaFromIntrospection(supabase);
  }
};

/**
 * Build schema by introspecting actual tables (fallback method)
 */
const buildDetailedSchemaFromIntrospection = async (supabase) => {
  const commonTables = ['students', 'courses', 'enrollments', 'teachers', 
                        'departments', 'grades', 'assignments', 'users',
                        'student_course_performance', 'teacher_course_load'];
  
  let schemaString = '-- PostgreSQL Database Schema (Introspected)\n\n';
  let foundTables = 0;
  
  for (const tableName of commonTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error && data !== null) {
        foundTables++;
        schemaString += `Table: ${tableName}\n`;
        
        if (data.length > 0) {
          const row = data[0];
          Object.keys(row).forEach(columnName => {
            const value = row[columnName];
            let dataType = 'text';
            
            if (typeof value === 'number') {
              dataType = Number.isInteger(value) ? 'integer' : 'numeric';
            } else if (typeof value === 'boolean') {
              dataType = 'boolean';
            } else if (value instanceof Date) {
              dataType = 'timestamp';
            }
            
            schemaString += `  - ${columnName} (${dataType})\n`;
          });
        }
        schemaString += '\n';
      }
    } catch (err) {
      // Table doesn't exist, continue
    }
  }
  
  if (foundTables === 0) {
    return '-- No tables found. Please check your database connection and permissions.';
  }
  
  return schemaString;
};

/**
 * Execute a SELECT query and return results
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} supabaseKey - Supabase key
 * @param {string} sql - SQL SELECT query
 * @returns {Promise<Object>} Query results
 */
export const executeSQLQuery = async (supabaseUrl, supabaseKey, sql) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if query has JOINs or complex features using regex (handles any whitespace/case)
    const hasJoin = /\bjoin\b/i.test(sql);
    const hasSubquery = /\(\s*select\b/i.test(sql);
    const hasGroupBy = /\bgroup\s+by\b/i.test(sql);
    const hasAggregates = /\b(count|sum|avg|min|max)\s*\(/i.test(sql);
    const hasComparison = /(>|<|>=|<=|<>|!=|\blike\b|\bin\s*\()/i.test(sql);
    
    const isComplexQuery = hasJoin || hasSubquery || hasGroupBy || hasAggregates || hasComparison;
    
    if (isComplexQuery) {
      
      // Remove trailing semicolon if present (RPC function wraps query in subquery)
      const cleanedSQL = sql.trim().replace(/;+\s*$/, '');
      
      // Try to use RPC function for complex queries
      const { data, error } = await supabase.rpc('execute_sql', { 
        query: cleanedSQL 
      });

      if (error) {
        // If RPC function doesn't exist, provide helpful error
        if (error.code === 'PGRST202' || error.message.includes('Could not find')) {
          throw new Error(
            'Complex queries require the execute_sql() function in Supabase. ' +
            'Please run the SQL function found in supabase_execute_sql_function.sql in your Supabase SQL Editor.'
          );
        }
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data || [],
        rowCount: data?.length || 0
      };
    }
    
    // For simple queries, use Supabase query builder
    const sqlOriginal = sql.trim();
    const sqlLower = sqlOriginal.toLowerCase();
    
    // Extract table name from "FROM tablename"
    const fromMatch = sqlLower.match(/from\s+(?:public\.)?(\w+)/);
    if (!fromMatch) {
      throw new Error('Could not parse table name from SQL query');
    }
    
    const tableName = fromMatch[1];
    
    // Extract columns from SELECT clause
    const selectMatch = sqlOriginal.match(/SELECT\s+(.*?)\s+FROM/i);
    let columns = '*';
    
    if (selectMatch && selectMatch[1].trim() !== '*') {
      // Parse column list (remove aliases, handle functions)
      const columnList = selectMatch[1]
        .split(',')
        .map(col => {
          // Remove table prefix (e.g., "students.first_name" -> "first_name")
          const cleaned = col.trim().replace(/^\w+\./, '');
          // Remove AS aliases
          return cleaned.split(/\s+as\s+/i)[0].trim();
        })
        .join(',');
      columns = columnList;
    }
    
    let query = supabase.from(tableName).select(columns);
    
    // Handle WHERE clauses (basic support)
    const whereMatch = sqlLower.match(/where\s+(.+?)(?:\s+order\s+by|\s+limit|$)/);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      
      // Handle simple equality: column = 'value' or column = value
      const eqMatch = whereClause.match(/(\w+)\s*=\s*'?([^']+)'?/);
      if (eqMatch) {
        const [, column, value] = eqMatch;
        query = query.eq(column, value.replace(/'/g, ''));
      }
    }
    
    // Handle ORDER BY
    const orderMatch = sqlLower.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/);
    if (orderMatch) {
      const column = orderMatch[1];
      const ascending = !orderMatch[2] || orderMatch[2] === 'asc';
      query = query.order(column, { ascending });
    }
    
    // Handle LIMIT
    const limitMatch = sqlLower.match(/limit\s+(\d+)/);
    if (limitMatch) {
      query = query.limit(parseInt(limitMatch[1]));
    }
    
    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data,
      rowCount: data?.length || 0
    };
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
};
