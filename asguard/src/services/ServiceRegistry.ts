import { SchemaProvider } from './schema/SchemaProvider'
import { SqlValidator } from './sql/SqlValidator'
import { SqlRewriter } from './sql/SqlRewriter'
import { SqlExecutor } from './sql/SqlExecutor'
import { GrokClient } from './ai/GrokClient'
import { SqlGenerator } from './ai/SqlGenerator'
import { NlGenerator } from './ai/NlGenerator'
import { ConversationMemory } from './memory/ConversationMemory'

export class ServiceRegistry {
  private static schemaProvider = new SchemaProvider()
  private static sqlValidator = new SqlValidator()
  private static sqlRewriter = new SqlRewriter()
  private static sqlExecutor = new SqlExecutor(this.sqlValidator, this.sqlRewriter)
  private static grokClient = new GrokClient()
  private static sqlGenerator = new SqlGenerator(this.grokClient)
  private static nlGenerator = new NlGenerator(this.grokClient)
  private static conversationMemory = new ConversationMemory()

  public static getSchemaProvider(): SchemaProvider {
    return this.schemaProvider
  }

  public static getSqlValidator(): SqlValidator {
    return this.sqlValidator
  }

  public static getSqlRewriter(): SqlRewriter {
    return this.sqlRewriter
  }

  public static getSqlExecutor(): SqlExecutor {
    return this.sqlExecutor
  }

  public static getGrokClient(): GrokClient {
    return this.grokClient
  }

  public static getSqlGenerator(): SqlGenerator {
    return this.sqlGenerator
  }

  public static getNlGenerator(): NlGenerator {
    return this.nlGenerator
  }

  public static getConversationMemory(): ConversationMemory {
    return this.conversationMemory
  }
}
