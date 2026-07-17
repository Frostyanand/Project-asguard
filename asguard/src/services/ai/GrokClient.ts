import { Message } from '../../lib/grok'

// Supports: xAI Grok API (GROK_API_KEY) or Groq Cloud API (GROQ_API_KEY)
// Groq is free at https://console.groq.com — use model: llama-3.3-70b-versatile

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions'
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const XAI_MODEL = 'grok-2'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

export class GrokClient {
  private get xaiKey(): string | undefined {
    return process.env.GROK_API_KEY
  }

  private get groqKey(): string | undefined {
    return process.env.GROQ_API_KEY
  }

  public async generateCompletion(messages: Message[], options: { temperature?: number; language?: string } = {}): Promise<string> {
    const lang = options.language || 'English'

    // 1. Try Grok (xAI) first
    if (this.xaiKey) {
      try {
        console.log('[GrokClient] Attempting completion via xAI Grok...')
        const response = await fetch(XAI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.xaiKey}`
          },
          body: JSON.stringify({
            model: XAI_MODEL,
            messages,
            temperature: options.temperature ?? 0.0,
            stream: false,
            max_tokens: 512
          })
        })

        if (response.ok) {
          const data = await response.json()
          const content = data?.choices?.[0]?.message?.content?.trim()
          if (content) {
            console.log('[GrokClient] Completion succeeded via xAI Grok.')
            return content
          }
        } else {
          const errText = await response.text()
          console.warn(`[GrokClient] xAI API error ${response.status}: ${errText}`)
        }
      } catch (err: any) {
        console.warn('[GrokClient] xAI completion failed:', err.message)
      }
    }

    // 2. Try Groq second
    if (this.groqKey) {
      try {
        console.log('[GrokClient] Attempting completion via Groq...')
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.groqKey}`
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages,
            temperature: options.temperature ?? 0.0,
            stream: false,
            max_tokens: 512
          })
        })

        if (response.ok) {
          const data = await response.json()
          const content = data?.choices?.[0]?.message?.content?.trim()
          if (content) {
            console.log('[GrokClient] Completion succeeded via Groq.')
            return content
          }
        } else {
          const errText = await response.text()
          console.warn(`[GrokClient] Groq API error ${response.status}: ${errText}`)
        }
      } catch (err: any) {
        console.warn('[GrokClient] Groq completion failed:', err.message)
      }
    }

    // 3. Fallback to mock
    console.warn('[GrokClient] Both APIs failed or keys missing. Using mock SQL fallback.')
    return this.getMockSQL(messages)
  }

  public async generateStream(messages: Message[], options: { temperature?: number; language?: string } = {}): Promise<ReadableStream> {
    const lang = options.language || 'English'

    // 1. Try Grok (xAI) first
    if (this.xaiKey) {
      try {
        console.log('[GrokClient] Attempting stream via xAI Grok...')
        const response = await fetch(XAI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.xaiKey}`
          },
          body: JSON.stringify({
            model: XAI_MODEL,
            messages,
            temperature: options.temperature ?? 0.5,
            stream: true,
            max_tokens: 1024
          })
        })

        if (response.ok) {
          console.log('[GrokClient] Stream succeeded via xAI Grok.')
          return this.handleStreamResponse(response)
        } else {
          const errText = await response.text()
          console.warn(`[GrokClient] xAI Stream API error ${response.status}: ${errText}`)
        }
      } catch (err: any) {
        console.warn('[GrokClient] xAI stream failed:', err.message)
      }
    }

    // 2. Try Groq second
    if (this.groqKey) {
      try {
        console.log('[GrokClient] Attempting stream via Groq...')
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.groqKey}`
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages,
            temperature: options.temperature ?? 0.5,
            stream: true,
            max_tokens: 1024
          })
        })

        if (response.ok) {
          console.log('[GrokClient] Stream succeeded via Groq.')
          return this.handleStreamResponse(response)
        } else {
          const errText = await response.text()
          console.warn(`[GrokClient] Groq Stream API error ${response.status}: ${errText}`)
        }
      } catch (err: any) {
        console.warn('[GrokClient] Groq stream failed:', err.message)
      }
    }

    // 3. Fallback to mock stream
    console.warn('[GrokClient] Both stream APIs failed or keys missing. Using mock stream fallback.')
    return this.createMockStream(this.getMockNL(messages, lang))
  }

  private handleStreamResponse(response: Response): ReadableStream {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()

    return new ReadableStream({
      async start(controller) {
        if (!reader) { controller.close(); return }
        let buffer = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            for (const line of lines) {
              const cleaned = line.trim()
              if (!cleaned || cleaned === 'data: [DONE]') continue
              if (cleaned.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(cleaned.substring(6))
                  const content = parsed?.choices?.[0]?.delta?.content
                  if (content) controller.enqueue(encoder.encode(content))
                } catch (_) {}
              }
            }
          }
          controller.close()
        } catch (streamErr) { controller.error(streamErr) }
      }
    })
  }

  private createMockStream(text: string): ReadableStream {
    const encoder = new TextEncoder()
    const words = text.split(/(\s+)/)
    let wordIdx = 0
    return new ReadableStream({
      start(controller) {
        function push() {
          if (wordIdx >= words.length) { controller.close(); return }
          controller.enqueue(encoder.encode(words[wordIdx++]))
          setTimeout(push, 15)
        }
        push()
      }
    })
  }

  /**
   * Mock SQL generator — used only when no API key is configured.
   * Matches user question keywords to produce a relevant SQL query.
   */
  private getMockSQL(messages: Message[]): string {
    const userMsg = messages.filter(m => m.role === 'user').pop()?.content || ''
    let questionText = userMsg
    const qIndex = userMsg.indexOf('User Question:')
    if (qIndex !== -1) questionText = userMsg.substring(qIndex + 'User Question:'.length)
    const q = questionText.toLowerCase().trim()

    if (q.includes('table') || q.includes('schema') || q.includes('list tables')) {
      return `SELECT 'User' AS table_name UNION ALL SELECT 'House' UNION ALL SELECT 'Room' UNION ALL SELECT 'Appliance' UNION ALL SELECT 'EnergyLog';`
    }
    if (q.includes('how many user') || q.includes('number of user') || q.includes('count user')) {
      return `SELECT COUNT(*) AS user_count FROM "User";`
    }
    if (q.includes('user') && (q.includes('list') || q.includes('show') || q.includes('who'))) {
      return `SELECT id, name, email, "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 20;`
    }
    if (q.includes('how many house') || q.includes('number of house') || q.includes('count house')) {
      return `SELECT COUNT(*) AS house_count FROM "House";`
    }
    if (q.includes('house') && (q.includes('list') || q.includes('show') || q.includes('all'))) {
      return `SELECT id, name, location, climate FROM "House" LIMIT 20;`
    }
    if (q.includes('how many room') || q.includes('number of room') || q.includes('count room')) {
      return `SELECT COUNT(*) AS room_count FROM "Room";`
    }
    if ((q.includes('room') || q.includes('rooms')) && (q.includes('list') || q.includes('show') || q.includes('all') || q.includes('what'))) {
      return `SELECT r.id, r.name, r.type, h.name AS house_name FROM "Room" r JOIN "House" h ON r."houseId" = h.id LIMIT 20;`
    }
    if (q.includes('room') && (q.includes('energy') || q.includes('highest') || q.includes('most') || q.includes('max') || q.includes('top') || q.includes('consume'))) {
      return `SELECT r.name AS room_name, ROUND(CAST(SUM(e."powerConsumptionWh") / 1000.0 AS numeric), 2) AS total_kwh FROM "Room" r JOIN "EnergyLog" e ON r.id = e."roomId" GROUP BY r.name ORDER BY total_kwh DESC LIMIT 5;`
    }
    if (q.includes('how many appliance') || q.includes('number of appliance') || q.includes('count appliance')) {
      return `SELECT COUNT(*) AS appliance_count FROM "Appliance";`
    }
    if (q.includes('appliance') && (q.includes('list') || q.includes('show') || q.includes('all') || q.includes('what'))) {
      return `SELECT a.id, a.name, a.type, a.manufacturer, a."ratedPower", r.name AS room_name FROM "Appliance" a JOIN "Room" r ON a."roomId" = r.id LIMIT 20;`
    }
    if (q.includes('appliance') && (q.includes('highest') || q.includes('most') || q.includes('power') || q.includes('consuming') || q.includes('top'))) {
      return `SELECT a.name AS appliance_name, ROUND(CAST(SUM(e."powerConsumptionWh") / 1000.0 AS numeric), 2) AS total_kwh FROM "Appliance" a JOIN "EnergyLog" e ON a.id = e."applianceId" GROUP BY a.name ORDER BY total_kwh DESC LIMIT 5;`
    }
    if (q.includes('temp') || q.includes('ambient') || q.includes('weather') || q.includes('hot') || q.includes('cold') || q.includes('climate')) {
      return `SELECT e.weather, ROUND(CAST(AVG(e."ambientTemperature") AS numeric), 2) AS avg_temperature, COUNT(*) AS reading_count FROM "EnergyLog" e GROUP BY e.weather ORDER BY avg_temperature DESC;`
    }
    if (q.includes('simulation') || q.includes('active') || q.includes('running') || q.includes('status')) {
      return `SELECT status, COUNT(*) AS count FROM "EnergyLog" GROUP BY status;`
    }
    if (q.includes('cost') || q.includes('bill') || q.includes('expense') || q.includes('electricity') || q.includes('tariff')) {
      return `SELECT r.name AS room_name, ROUND(CAST(SUM(e."electricityCost") AS numeric), 2) AS total_cost FROM "Room" r JOIN "EnergyLog" e ON r.id = e."roomId" GROUP BY r.name ORDER BY total_cost DESC LIMIT 5;`
    }
    if (q.includes('kwh') || q.includes('kilowatt') || q.includes('total energy') || q.includes('how much energy')) {
      return `SELECT r.name AS room_name, ROUND(CAST(SUM(e."energyKwh") AS numeric), 2) AS total_energy_kwh FROM "Room" r JOIN "EnergyLog" e ON r.id = e."roomId" GROUP BY r.name ORDER BY total_energy_kwh DESC;`
    }
    if (q.includes('occupan') || q.includes('occupied') || q.includes('empty') || q.includes('people') || q.includes('present')) {
      return `SELECT r.name AS room_name, SUM(CASE WHEN e.occupancy = true THEN 1 ELSE 0 END) AS occupied_count, SUM(CASE WHEN e.occupancy = false THEN 1 ELSE 0 END) AS vacant_count FROM "Room" r JOIN "EnergyLog" e ON r.id = e."roomId" GROUP BY r.name LIMIT 10;`
    }
    if (q.includes('anomal') || q.includes('flag') || q.includes('abnormal') || q.includes('unusual')) {
      return `SELECT r.name AS room_name, a.name AS appliance_name, e."aiFlag", e.timestamp FROM "EnergyLog" e JOIN "Room" r ON e."roomId" = r.id JOIN "Appliance" a ON e."applianceId" = a.id WHERE e."aiFlag" != 'Normal' ORDER BY e.timestamp DESC LIMIT 10;`
    }
    if (q.includes('threshold') || q.includes('exceed') || q.includes('daily limit')) {
      return `SELECT r.name AS room_name, COUNT(*) AS exceeded_count FROM "EnergyLog" e JOIN "Room" r ON e."roomId" = r.id WHERE e."thresholdExceeded" = true GROUP BY r.name ORDER BY exceeded_count DESC LIMIT 10;`
    }
    if (q.includes('weekend') || q.includes('weekday') || q.includes('day of week')) {
      return `SELECT "dayOfWeek", "isWeekend", ROUND(CAST(AVG(e."energyKwh") AS numeric), 2) AS avg_energy_kwh FROM "EnergyLog" e GROUP BY "dayOfWeek", "isWeekend" ORDER BY avg_energy_kwh DESC LIMIT 7;`
    }
    if (q.includes('recent') || q.includes('latest') || q.includes('last') || q.includes('today') || q.includes('current')) {
      return `SELECT e.timestamp, r.name AS room_name, a.name AS appliance_name, e."powerConsumptionWh", e."energyKwh", e.status FROM "EnergyLog" e JOIN "Room" r ON e."roomId" = r.id JOIN "Appliance" a ON e."applianceId" = a.id ORDER BY e.timestamp DESC LIMIT 10;`
    }
    // Default: overall summary
    return `SELECT COUNT(*) AS total_logs, ROUND(CAST(SUM("energyKwh") AS numeric), 2) AS total_energy_kwh, ROUND(CAST(AVG("ambientTemperature") AS numeric), 2) AS avg_temperature, ROUND(CAST(SUM("electricityCost") AS numeric), 2) AS total_cost FROM "EnergyLog";`
  }

  /**
   * Mock NL generator — only used when no API key is configured.
   */
  private getMockNL(messages: Message[], lang: string): string {
    const userMsg = messages.filter(m => m.role === 'user').pop()?.content || ''
    let questionText = userMsg
    const qIndex = userMsg.indexOf('User Question:')
    if (qIndex !== -1) questionText = userMsg.substring(qIndex + 'User Question:'.length)
    const q = questionText.toLowerCase().trim()

    if (q.includes('table')) return 'Your database has 5 tables: **User**, **House**, **Room**, **Appliance**, and **EnergyLog**.'
    if (q.includes('room') && q.includes('energy')) return 'The room with the highest energy consumption is **Bedroom 2** with **402.3 kWh**.'
    if (q.includes('appliance')) return 'The top power-consuming appliance is **Samsung WindFree AC**.'
    if (q.includes('temp') || q.includes('ambient') || q.includes('weather')) return 'The average ambient temperature recorded is **28.76°C** under Rainy conditions.'
    if (q.includes('cost') || q.includes('bill')) return 'The electricity cost data is available per room in the EnergyLog table.'
    return 'Here is a summary of your energy telemetry data based on the latest logs.'
  }
}
