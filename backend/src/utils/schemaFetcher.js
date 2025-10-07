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

    // Fetch tables from public schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');

    if (tablesError) {
      throw new Error(`Failed to fetch tables: ${tablesError.message}`);
    }

    // Fetch columns for all tables
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_columns');

    if (columnsError) {
      throw new Error(`Failed to fetch columns: ${columnsError.message}`);
    }

    // Fetch foreign key relationships
    const { data: foreignKeys, error: fkError } = await supabase
      .rpc('get_foreign_keys');

    if (fkError) {
      console.warn('Failed to fetch foreign keys:', fkError.message);
    }

    // Fetch constraints (primary keys, unique, etc.)
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_constraints');

    if (constraintsError) {
      console.warn('Failed to fetch constraints:', constraintsError.message);
    }

    return {
      tables: tables || [],
      columns: columns || [],
      foreignKeys: foreignKeys || [],
      constraints: constraints || []
    };
  } catch (error) {
    console.error('Error fetching database schema:', error);
    throw error;
  }
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
    // This is a workaround if custom RPC functions don't exist
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (error) {
      throw error;
    }

    let schemaString = '-- Available Tables:\n';
    data.forEach(table => {
      schemaString += `-- ${table.table_name}\n`;
    });

    return schemaString;
  } catch (error) {
    console.error('Error building simple schema:', error);
    return '-- Unable to fetch schema information. Please ensure proper permissions are set.';
  }
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

    // Execute SQL using RPC function (requires setup in Supabase)
    const { data, error } = await supabase.rpc('execute_sql', { 
      query: sql 
    });

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
