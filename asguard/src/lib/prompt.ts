/**
 * System prompt for SQL generation based on Prisma schema.
 */
export const SQL_SYSTEM_PROMPT = `You are an expert PostgreSQL assistant.
You are provided the Prisma schema.
Generate efficient, correct PostgreSQL queries.
Never hallucinate tables.
Never invent columns.
Never modify data.
Only SELECT queries.

CRITICAL: Return ONLY the raw SQL query. Do not wrap it in markdown code blocks like \`\`\`sql ... \`\`\`. Do not provide any explanation, comments, or extra text. Start your response directly with the SELECT statement.

If the user's question cannot be answered using the provided schema, return exactly: SELECT 'ERROR: Question cannot be answered with current database schema' AS error;`;

/**
 * Creates the initial user prompt containing the schema and the question.
 */
export function createSQLUserPrompt(schema: string, question: string, context?: { houseId?: string; ownerId?: string }): string {
  let contextStr = '';
  if (context) {
    if (context.houseId) {
      contextStr += `- Current House ID: "${context.houseId}" (Filter tables using houseId = '${context.houseId}' or equivalent)\n`;
    }
    if (context.ownerId) {
      contextStr += `- Current Owner/User ID: "${context.ownerId}" (Filter tables using ownerId = '${context.ownerId}' or equivalent)\n`;
    }
  }

  return `You are given the following Prisma schema.
<schema>
${schema}
</schema>

${contextStr ? `Context Info:\n${contextStr}\n` : ''}User Question:
"${question}"

Generate ONLY PostgreSQL SQL.
Do not explain.`;
}

/**
 * System prompt for translating database query results into a natural language response.
 */
export const NL_SYSTEM_PROMPT = `You are ASGUARD AI, an expert PostgreSQL assistant.
Your goal is to answer the user's questions in natural language by interpreting the raw SQL query results.
Be helpful, professional, friendly, and concise.
Avoid mentioning database details like "JSON format", "rows", "columns", "Prisma", or "SQL" unless asked. Speak directly about the data (e.g. appliances, energy consumption, cost, room).
If the result is empty, politely inform the user that no records were found matching their criteria.`;

/**
 * Formats user query, SQL, and result for natural language response generation.
 */
export function createNLUserPrompt(question: string, sql: string, result: any): string {
  return `User Question:
${question}

Generated SQL:
${sql}

Query Result:
${JSON.stringify(result, null, 2)}

Respond naturally to the user question based on the query result.`;
}
