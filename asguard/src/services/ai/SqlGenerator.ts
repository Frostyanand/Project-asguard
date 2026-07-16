import { Message } from '../../lib/grok'
import { GrokClient } from './GrokClient'

export class SqlGenerator {
  private grokClient: GrokClient

  constructor(grokClient: GrokClient) {
    this.grokClient = grokClient
  }

  /**
   * Prompts the AI model to generate safe read-only SQL SELECT queries.
   */
  public async generate(
    schema: string,
    question: string,
    history: Message[],
    memoryContext: string,
    userContext?: { houseId?: string; ownerId?: string }
  ): Promise<string> {
    
    // System prompt enforcing constraints
    const systemPrompt = `You are an expert PostgreSQL database assistant working with a Prisma ORM schema.

CRITICAL RULES:
- Return ONLY the raw SQL query. No markdown, no code blocks, no explanations.
- Start directly with SELECT.
- Never query pg_catalog, information_schema, pg_tables, pg_class, or pg_namespace.
- Never hallucinate tables or columns. Only use what exists in the Prisma schema.
- All table names MUST be double-quoted: "User", "House", "Room", "Appliance", "EnergyLog"
- All camelCase column names MUST be double-quoted: "houseId", "roomId", "applianceId", "powerConsumptionWh", "energyKwh", "electricityCost", "ambientTemperature", "ratedPower", "aiFlag", "isWeekend", "dayOfWeek", "thresholdExceeded", "dailyLimitKwh", "runtimeMinutes", "tariffType", "createdAt", "updatedAt", "photoURL"
- String columns like name, email, id, location, climate, type, status, weather, manufacturer, date use no quotes in WHERE but double-quote the column name: WHERE e.status = 'ON'
- Always LIMIT results (max 20 rows unless aggregation)
- For COUNT queries: SELECT COUNT(*) AS count FROM "TableName"

VALID TABLES AND KEY COLUMNS:
- "User": id, name, email, "photoURL", "createdAt"
- "House": id, "ownerId", name, location, climate
- "Room": id, "houseId", name, type
- "Appliance": id, "roomId", name, type, manufacturer, "ratedPower"
- "EnergyLog": id, timestamp, date, hour, "dayOfWeek", "isWeekend", "houseId", "roomId", "applianceId", status, "runtimeMinutes", "powerConsumptionWh", "energyKwh", "electricityCost", occupancy, "ambientTemperature", weather, "tariffType", "dailyLimitKwh", "thresholdExceeded", "aiFlag"

If question cannot be answered from this schema, return:
SELECT 'ERROR: Question cannot be answered with current database schema' AS error;`

    let contextStr = ''
    if (userContext) {
      if (userContext.houseId) {
        contextStr += `- Current House ID: "${userContext.houseId}" (Filter using "houseId" = '${userContext.houseId}')\n`
      }
      if (userContext.ownerId) {
        contextStr += `- Current Owner/User ID: "${userContext.ownerId}" (Filter using "ownerId" = '${userContext.ownerId}')\n`
      }
    }

    const userPrompt = `Prisma Schema:
<schema>
${schema}
</schema>

${contextStr ? `Context:\n${contextStr}\n` : ''}${memoryContext ? `Prior context:\n${memoryContext}\n` : ''}
User Question: "${question}"

Generate ONLY a PostgreSQL SELECT query. Use double-quoted table and column names per Prisma convention.`

    const messages: Message[] = [
      { role: 'system', content: systemPrompt }
    ]

    if (history && history.length > 0) {
      const recentHistory = history.slice(-4)
      for (const h of recentHistory) {
        if (h.role === 'user') {
          messages.push({ role: 'user', content: h.content })
        } else if (h.role === 'assistant' && h.content && !h.content.includes('SELECT')) {
          messages.push({ role: 'assistant', content: h.content.substring(0, 150) })
        }
      }
    }

    messages.push({ role: 'user', content: userPrompt })

    const rawResponse = await this.grokClient.generateCompletion(messages, { temperature: 0.0 })
    const sql = this.cleanSQL(rawResponse)
    console.log(`[SQL Generated] ${sql.substring(0, 200)}`)
    return sql
  }

  private cleanSQL(rawSQL: string): string {
    let cleaned = rawSQL.trim()
    // Strip markdown code fences
    cleaned = cleaned.replace(/^```(sql)?\s*/i, '').replace(/\s*```$/, '')
    // Strip any leading explanation text before SELECT
    const selectIdx = cleaned.toUpperCase().indexOf('SELECT')
    if (selectIdx > 0) cleaned = cleaned.substring(selectIdx)
    return cleaned.trim()
  }
}
