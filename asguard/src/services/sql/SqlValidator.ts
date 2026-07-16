export class SqlValidator {
  private blockedKeywords = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 
    'TRUNCATE', 'GRANT', 'REVOKE', 'VACUUM', 'ANALYZE', 
    'COPY', 'EXECUTE', 'PREPARE'
  ]

  private blockedCatalogs = [
    'information_schema', 'pg_catalog', 'pg_tables', 'pg_class', 
    'pg_namespace', 'pg_attribute', 'pg_type'
  ]

  /**
   * Validates a SQL query, ensuring it is a safe read-only SELECT query.
   */
  public validate(sql: string): { isValid: boolean; error?: string } {
    const cleaned = sql.trim().toUpperCase()

    // Enforce read-only SELECT statements
    if (!cleaned.startsWith('SELECT')) {
      return { isValid: false, error: 'Only read-only SELECT statements are permitted.' }
    }

    // Reject dangerous SQL modification keywords
    for (const keyword of this.blockedKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i')
      if (regex.test(sql)) {
        return { isValid: false, error: `Blocked keyword detected: ${keyword}` }
      }
    }

    // Prevent system catalog inspection
    for (const catalog of this.blockedCatalogs) {
      if (sql.toLowerCase().includes(catalog.toLowerCase())) {
        return { isValid: false, error: `Access to PostgreSQL system catalog metadata is strictly prohibited: ${catalog}` }
      }
    }

    return { isValid: true }
  }
}
