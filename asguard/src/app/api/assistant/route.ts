import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerTools } from '../../../mcp/server'
import { ServiceRegistry } from '../../../services/ServiceRegistry'

// Simple rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = 30
  const windowMs = 60000

  const record = rateLimitMap.get(ip)
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  record.count++
  return record.count <= limit
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || (req as any).ip || 'global-anonymous'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { 
        success: false,
        answer: 'Rate limit exceeded. Please wait a moment.',
        error: 'Too many requests' 
      },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { message, history = [], context, language = 'English' } = body

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 })
    }

    // 1. Reconstruct conversational memory & active filter context
    const memory = ServiceRegistry.getConversationMemory()
    const extractedMemoryContext = memory.extractContext(history)

    // 2. Establish local in-memory MCP client-server connection
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    const mcpServer = new McpServer({
      name: 'asguard-in-memory-server',
      version: '1.0.0'
    })
    registerTools(mcpServer)
    await mcpServer.connect(serverTransport)
    
    const client = new Client(
      { name: 'asguard-assistant-client', version: '1.0.0' },
      { capabilities: {} }
    )
    await client.connect(clientTransport)

    // 3. Introspect schema using filesystem SchemaProvider
    const schemaProvider = ServiceRegistry.getSchemaProvider()
    const schema = schemaProvider.getSchemaContent()

    // 4. SQL generator and self-correcting execution loop
    const sqlGenerator = ServiceRegistry.getSqlGenerator()
    const sqlExecutor = ServiceRegistry.getSqlExecutor()

    let generatedSQL = ''
    let executionResult: any = null
    let attempts = 0
    const maxAttempts = 3

    const activeHistory = [...history]

    while (attempts < maxAttempts) {
      attempts++
      try {
        console.log(`[SQL Gen] Clean Architecture Attempt ${attempts}/${maxAttempts}`)
        generatedSQL = await sqlGenerator.generate(
          schema,
          message,
          activeHistory,
          extractedMemoryContext,
          context
        )

        if (generatedSQL.includes('ERROR: Question cannot be answered')) {
          return NextResponse.json({
            success: false,
            sql: null,
            executionTime: '0ms',
            rowsReturned: 0,
            data: [],
            answer: "I couldn't find a way to answer that question from your database schema. Could you rephrase it or check if the tables contain that data?"
          })
        }

        // Run query safety checks and execute via Executor
        executionResult = await sqlExecutor.execute(generatedSQL)

        if (executionResult.success) {
          break
        }

        // If validation or execution failed, feed error details back to generator
        console.warn(`[SQL Execution Failed] ${executionResult.error.type}: ${executionResult.error.reason}`)
        
        activeHistory.push({ role: 'user', content: message })
        activeHistory.push({
          role: 'assistant',
          content: `My generated SQL failed with the error type: ${executionResult.error.type}. Reason: ${executionResult.error.reason}. Suggested Fix: ${executionResult.error.suggestedFix}.

Please fix the PostgreSQL query. Return ONLY the corrected raw SQL string. Do not explain.`
        })
      } catch (loopErr: any) {
        console.error(`[SQL Loop Error] Attempt ${attempts}:`, loopErr.message)
      }
    }

    // 5. If final execution failed after all attempts, return structured error details
    if (!executionResult || !executionResult.success) {
      return NextResponse.json({
        success: false,
        sql: generatedSQL || '',
        executionTime: executionResult?.executionTime || '0ms',
        rowsReturned: 0,
        data: [],
        answer: `I generated a SQL query but ran into database errors: ${executionResult?.error?.reason || 'Execution rejected by safety rules'}.`,
        error: executionResult?.error
      })
    }

    // 6. Generate Natural Language answer stream
    const nlGenerator = ServiceRegistry.getNlGenerator()
    const textStream = await nlGenerator.generateAnswer(
      message,
      executionResult.sql,
      executionResult.data,
      language
    )

    // Combine stream with metadata appended at the very end
    const reader = textStream.getReader()
    const encoder = new TextEncoder()

    const combinedStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(value)
          }

          const metadata = {
            success: true,
            sql: executionResult.sql,
            executionTime: executionResult.executionTime,
            rowsReturned: executionResult.rowsReturned,
            data: executionResult.data
          }

          controller.enqueue(encoder.encode(`\n\n__METADATA__\n${JSON.stringify(metadata)}`))
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      }
    })

    return new Response(combinedStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (globalError: any) {
    console.error('[API Route Clean Architecture Error]:', globalError)
    return NextResponse.json({
      success: false,
      answer: `Internal Assistant Error: ${globalError.message}`,
      error: globalError.message
    }, { status: 500 })
  }
}
