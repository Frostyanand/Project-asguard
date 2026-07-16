export class SqlRewriter {
  /**
   * Automatically rewrites PostgreSQL queries to cast potential system or unsupported types to text.
   * Ensures that columns like tablename, schemaname, relname, or nspname are casted as text.
   */
  public rewrite(sql: string): string {
    let rewritten = sql.trim()

    // List of catalog-like columns that can trigger Prisma deserialization crashes if uncasted
    const fieldsToCast = ['tablename', 'schemaname', 'relname', 'nspname']
    
    for (const field of fieldsToCast) {
      // Matches the field name, avoiding replacing it if it is already casted (e.g. field::text)
      const regex = new RegExp(`\\b${field}\\b(?![:\\s]*text)`, 'gi')
      rewritten = rewritten.replace(regex, `CAST(${field} AS text)`)
    }

    return rewritten
  }
}
