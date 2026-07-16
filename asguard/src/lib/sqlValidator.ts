import prisma from './prisma'

/**
 * Checks if the provided SQL query is staticly safe (SELECT only, no modifications, no command chaining).
 */
export function validateSQLStatic(sql: string): { isValid: boolean; error?: string } {
  const normalized = sql.trim().replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '').trim();

  if (!normalized) {
    return { isValid: false, error: 'Query is empty.' };
  }

  // Ensure query starts with SELECT (case-insensitive)
  if (!/^select\b/i.test(normalized)) {
    return { isValid: false, error: 'Only SELECT queries are allowed.' };
  }

  // Prohibited SQL mutation keywords
  const blockedKeywords = [
    'insert', 'update', 'delete', 'drop', 'alter', 'truncate', 
    'create', 'grant', 'revoke', 'replace', 'merge', 'copy'
  ];

  // Build a regex to check for prohibited keywords as separate words
  for (const keyword of blockedKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(normalized)) {
      return { isValid: false, error: `Dangerous keyword detected: "${keyword.toUpperCase()}". Only read-only SELECT queries are allowed.` };
    }
  }

  // Check for semicolon/command chaining to prevent SQL injection
  // Allow a single semicolon at the very end, but reject if there are semicolons in the middle of the statement
  const statements = normalized.split(';');
  const nonQueryStatements = statements.slice(1).map(s => s.trim()).filter(Boolean);
  if (nonQueryStatements.length > 0) {
    return { isValid: false, error: 'Multiple SQL statements are not allowed. Command chaining is blocked.' };
  }

  return { isValid: true };
}

/**
 * Validates the SQL syntax dynamically using PostgreSQL's EXPLAIN.
 * EXPLAIN analyzes the query, checks tables/columns/syntax without running the query,
 * and will throw an error if the query has syntax issues or invalid identifiers.
 */
export async function validateSQLWithExplain(sql: string): Promise<{ isValid: boolean; error?: string }> {
  const staticCheck = validateSQLStatic(sql);
  if (!staticCheck.isValid) {
    return staticCheck;
  }

  try {
    // Run EXPLAIN to let PostgreSQL validate the query syntax and schema alignment
    await prisma.$queryRawUnsafe(`EXPLAIN ${sql}`);
    return { isValid: true };
  } catch (err: any) {
    return { 
      isValid: false, 
      error: `SQL syntax or database schema error: ${err.message}` 
    };
  }
}
