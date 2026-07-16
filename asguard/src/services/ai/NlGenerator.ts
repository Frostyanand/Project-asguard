import { Message } from '../../lib/grok'
import { GrokClient } from './GrokClient'
import { NL_SYSTEM_PROMPT, createNLUserPrompt } from '../../lib/prompt'

export class NlGenerator {
  private grokClient: GrokClient

  constructor(grokClient: GrokClient) {
    this.grokClient = grokClient
  }

  /**
   * Translates PostgreSQL query results into a localized natural language response stream.
   * If the Grok API is available, it uses the LLM. Otherwise, it generates a smart
   * data-driven response directly from the actual query results.
   */
  public async generateAnswer(
    question: string,
    sql: string,
    rows: any[],
    language: string
  ): Promise<ReadableStream> {
    // If any LLM API key exists, use the real model
    if (process.env.GROQ_API_KEY || process.env.GROK_API_KEY) {
      const nlMessages: Message[] = [
        {
          role: 'system',
          content: NL_SYSTEM_PROMPT + `\nCRITICAL: You MUST write your response in ${language}. Ensure the entire response is natural and grammatically correct in ${language}.`
        },
        {
          role: 'user',
          content: createNLUserPrompt(question, sql, rows)
        }
      ]
      return this.grokClient.generateStream(nlMessages, { temperature: 0.5, language })
    }

    // No API key — generate a smart data-driven response directly from query results
    const answer = this.buildDataDrivenAnswer(question, rows, language)
    return this.createTextStream(answer)
  }

  /**
   * Builds a natural language answer from real query result data.
   * Produces a unique, contextual response for every question based on actual DB values.
   */
  private buildDataDrivenAnswer(question: string, rows: any[], language: string): string {
    if (!rows || rows.length === 0) {
      return this.translate(language, 'no_data', 'No records were found matching your question. The database may not have data for this specific query.')
    }

    const q = question.toLowerCase()
    const firstRow = rows[0]
    const keys = Object.keys(firstRow)

    // --- Table listing ---
    if (keys.includes('table_name')) {
      const tableList = rows.map(r => `**${r.table_name}**`).join(', ')
      return this.translate(language, 'tables_result', `Your database contains ${rows.length} tables: ${tableList}.`)
    }

    // --- Room + energy ---
    if (keys.includes('room_name') && (keys.includes('total_kwh') || keys.includes('total_energy'))) {
      const roomName = firstRow.room_name
      const kwh = firstRow.total_kwh || firstRow.total_energy
      if (rows.length === 1) {
        return this.translate(language, 'room_energy', `**${roomName}** consumed the highest energy with a total of **${kwh} kWh**.`)
      }
      const list = rows.map((r, i) => `${i + 1}. **${r.room_name}** — ${r.total_kwh || r.total_energy} kWh`).join('\n')
      return this.translate(language, 'room_energy_list', `Here are the rooms ranked by energy consumption:\n${list}`)
    }

    // --- Appliance + energy ---
    if (keys.includes('appliance_name') && keys.includes('total_kwh')) {
      const list = rows.map((r, i) => `${i + 1}. **${r.appliance_name}** — ${r.total_kwh} kWh`).join('\n')
      return this.translate(language, 'appliance_list', `Here are the top power-consuming appliances:\n${list}`)
    }

    // --- Temperature ---
    if (keys.includes('avg_temperature')) {
      const temp = firstRow.avg_temperature
      const weather = firstRow.weather ? ` under **${firstRow.weather}** weather` : ''
      return this.translate(language, 'temperature', `The average ambient temperature recorded is **${temp}°C**${weather}.`)
    }

    // --- Status / simulation counts ---
    if (keys.includes('status') && keys.includes('count')) {
      const parts = rows.map(r => `**${r.status}**: ${r.count} records`).join(', ')
      return this.translate(language, 'status_count', `Based on the telemetry logs: ${parts}.`)
    }

    // --- Cost / electricity ---
    if (keys.includes('electricityCost') || keys.includes('electricity_cost')) {
      const total = rows.reduce((sum, r) => sum + (parseFloat(r.electricityCost || r.electricity_cost) || 0), 0)
      return this.translate(language, 'cost', `The total electricity cost across ${rows.length} records is **₹${total.toFixed(2)}**.`)
    }

    // --- Energy kWh ---
    if (keys.includes('energyKwh') || keys.includes('energy_kwh')) {
      const total = rows.reduce((sum, r) => sum + (parseFloat(r.energyKwh || r.energy_kwh) || 0), 0)
      return this.translate(language, 'energy', `The total energy recorded across ${rows.length} log entries is **${total.toFixed(2)} kWh**.`)
    }

    // --- Count/aggregate result ---
    if (keys.length === 1 && keys[0] === 'count') {
      return this.translate(language, 'count', `The query found **${firstRow.count}** matching records in the database.`)
    }

    // --- Generic: describe each row in plain English ---
    if (rows.length === 1) {
      const description = keys.map(k => `**${this.humanize(k)}**: ${firstRow[k]}`).join(', ')
      return this.translate(language, 'single_row', `Here is the result: ${description}.`)
    }

    const sampleRow = keys.map(k => `**${this.humanize(k)}**: ${firstRow[k]}`).join(', ')
    return this.translate(language, 'multi_row', `Found **${rows.length} records**. Here is a sample from the first result: ${sampleRow}.`)
  }

  /**
   * Converts camelCase or snake_case column names into human-readable labels.
   */
  private humanize(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^\w/, c => c.toUpperCase())
      .trim()
  }

  /**
   * Returns language-appropriate wrappers for common response types.
   * Falls back to English if the language is not explicitly handled.
   */
  private translate(language: string, _key: string, englishText: string): string {
    // For non-English languages, prepend a note that the assistant is responding in English
    // since dynamic data formatting in all languages would require the LLM.
    // Users can switch to English for data-driven responses, or activate the Grok API for full multilingual support.
    if (language !== 'English') {
      return `[${language} response requires the Grok API key to be configured]\n\n${englishText}`
    }
    return englishText
  }

  /**
   * Creates a simulated word-by-word streaming ReadableStream from plain text.
   */
  private createTextStream(text: string): ReadableStream {
    const encoder = new TextEncoder()
    const words = text.split(/(\s+)/)
    let idx = 0

    return new ReadableStream({
      start(controller) {
        function push() {
          if (idx >= words.length) {
            controller.close()
            return
          }
          controller.enqueue(encoder.encode(words[idx]))
          idx++
          setTimeout(push, 12)
        }
        push()
      }
    })
  }
}
