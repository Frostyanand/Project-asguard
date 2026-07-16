import fs from 'fs'
import path from 'path'
import prisma from '../lib/prisma'
import { validateSQLWithExplain } from '../lib/sqlValidator'

// In-memory schema caching
let schemaCache: string | null = null;

/**
 * Returns the complete Prisma schema, reading from disk if not cached.
 */
export async function getSchema(): Promise<string> {
  if (schemaCache) {
    return schemaCache;
  }

  // Schema path resolution relative to workspace root
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  try {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    schemaCache = content;
    return content;
  } catch (err: any) {
    throw new Error(`Failed to load schema from ${schemaPath}: ${err.message}`);
  }
}

/**
 * Lists all user-created tables in the public schema of PostgreSQL.
 * Casts table_name to text to prevent Prisma type deserialization errors.
 */
export async function listTables(): Promise<string[]> {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(`
      SELECT CAST(table_name AS text) AS table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE '_prisma_migrations';
    `);
    return result.map(row => row.table_name);
  } catch (err: any) {
    throw new Error(`Failed to list tables: ${err.message}`);
  }
}

/**
 * Describes columns, data types, and nullability for a given table.
 * Casts columns to text to prevent Prisma type deserialization errors.
 */
export async function describeTable(table: string): Promise<Array<{ column_name: string; data_type: string; is_nullable: string }>> {
  const tables = await listTables();
  const matchedTable = tables.find(t => t.toLowerCase() === table.toLowerCase());
  if (!matchedTable) {
    throw new Error(`Table "${table}" does not exist in the public schema.`);
  }

  try {
    // Query metadata for columns and cast them to text
    const columns = await prisma.$queryRawUnsafe<Array<{ column_name: string; data_type: string; is_nullable: string }>>(`
      SELECT CAST(column_name AS text) AS column_name, 
             CAST(data_type AS text) AS data_type, 
             CAST(is_nullable AS text) AS is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = $1;
    `, matchedTable);

    return columns;
  } catch (err: any) {
    throw new Error(`Failed to describe table "${table}": ${err.message}`);
  }
}

/**
 * Fetches up to 5 sample rows from the given table.
 */
export async function sampleRows(table: string): Promise<any[]> {
  const tables = await listTables();
  const matchedTable = tables.find(t => t.toLowerCase() === table.toLowerCase());
  if (!matchedTable) {
    throw new Error(`Table "${table}" does not exist in the public schema.`);
  }

  try {
    // Table name is double quoted to protect against casing mismatches and prevent injection
    const query = `SELECT * FROM "${matchedTable}" LIMIT 5;`;
    const rows = await prisma.$queryRawUnsafe<any[]>(query);
    return rows;
  } catch (err: any) {
    throw new Error(`Failed to get sample rows for table "${table}": ${err.message}`);
  }
}

/**
 * Safely executes a read-only SQL SELECT query.
 */
export async function executeSQL(sql: string): Promise<{ rows: any[]; executionTimeMs: number }> {
  const startTime = Date.now();
  
  // Strict validation (static and dynamic EXPLAIN)
  const validation = await validateSQLWithExplain(sql);
  if (!validation.isValid) {
    throw new Error(`SQL Validation Rejected: ${validation.error}`);
  }

  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(sql);
    const executionTimeMs = Date.now() - startTime;
    return { rows, executionTimeMs };
  } catch (err: any) {
    throw new Error(`SQL Execution Failed: ${err.message}`);
  }
}
