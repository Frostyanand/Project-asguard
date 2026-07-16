import prisma from '../../lib/prisma'
import { SqlValidator } from './SqlValidator'
import { SqlRewriter } from './SqlRewriter'

export interface SqlExecutionResult {
  success: boolean
  sql: string
  executionTime: string
  rowsReturned: number
  data: any[]
  answer?: string
  error?: {
    type: string
    reason: string
    suggestedFix: string
  }
}

export class SqlExecutor {
  private validator: SqlValidator
  private rewriter: SqlRewriter

  constructor(validator: SqlValidator, rewriter: SqlRewriter) {
    this.validator = validator
    this.rewriter = rewriter
  }

  /**
   * Safe SQL execution wrapper. Validates, rewrites, monitors, and handles errors.
   */
  public async execute(sql: string): Promise<SqlExecutionResult> {
    const startTime = Date.now()

    // 1. Safety Check
    const validation = this.validator.validate(sql)
    if (!validation.isValid) {
      return {
        success: false,
        sql,
        executionTime: '0ms',
        rowsReturned: 0,
        data: [],
        error: {
          type: 'SecurityValidationException',
          reason: validation.error || 'Query rejected by safety filters.',
          suggestedFix: 'Ensure you are only running SELECT queries against authorized user tables.'
        }
      }
    }

    // 2. Rewrite system types automatically
    const rewrittenSql = this.rewriter.rewrite(sql)

    // 3. Execution
    try {
      const rows = await prisma.$queryRawUnsafe<any[]>(rewrittenSql)
      const executionTime = `${Date.now() - startTime}ms`
      return {
        success: true,
        sql: rewrittenSql,
        executionTime,
        rowsReturned: rows?.length || 0,
        data: this.serializeRows(rows || [])
      }
    } catch (err: any) {
      const executionTime = `${Date.now() - startTime}ms`
      const friendlyError = this.parseError(err, rewrittenSql)
      
      return {
        success: false,
        sql: rewrittenSql,
        executionTime,
        rowsReturned: 0,
        data: [],
        error: friendlyError
      }
    }
  }

  /**
   * Converts BigInt values in query rows to numbers so JSON.stringify works correctly.
   * PostgreSQL returns COUNT(*) and similar aggregates as BigInt by default.
   */
  private serializeRows(rows: any[]): any[] {
    return rows.map(row => {
      const cleaned: Record<string, any> = {}
      for (const key of Object.keys(row)) {
        const val = row[key]
        cleaned[key] = typeof val === 'bigint' ? Number(val) : val
      }
      return cleaned
    })
  }

  /**
   * Translates postgres/prisma errors into structured, user-safe error categories.
   */
  private parseError(err: any, sql: string) {
    const msg = err.message || String(err)
    
    if (msg.includes('relation') && msg.includes('does not exist')) {
      return {
        type: 'TableNotFoundException',
        reason: 'The SQL query references a table name that is not present in the database schema.',
        suggestedFix: 'Re-generate the query matching the model names exactly as defined in schema.prisma.'
      }
    }
    
    if (msg.includes('column') && msg.includes('does not exist')) {
      return {
        type: 'ColumnNotFoundException',
        reason: 'The SQL query references a column name that is missing or misspelled.',
        suggestedFix: 'Check the model field names in schema.prisma and fix the columns used in SELECT/WHERE clauses.'
      }
    }

    if (msg.includes('syntax error')) {
      return {
        type: 'SqlSyntaxException',
        reason: 'The database server reported a grammar or syntax error in the SQL structure.',
        suggestedFix: 'Verify the PostgreSQL syntax, check for unbalanced quotes, commas, or parentheses.'
      }
    }

    if (msg.includes('permission denied') || msg.includes('read-only')) {
      return {
        type: 'DatabasePermissionException',
        reason: 'The query attempted an operation that is restricted by database privileges.',
        suggestedFix: 'Ensure only read-only SELECT permissions are requested.'
      }
    }

    return {
      type: 'DatabaseExecutionException',
      reason: 'A raw database execution error occurred while processing the query.',
      suggestedFix: 'Review the database schema and query constraints.'
    }
  }
}
