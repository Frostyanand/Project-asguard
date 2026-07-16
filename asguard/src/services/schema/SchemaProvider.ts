import fs from 'fs'
import path from 'path'

export interface FieldMetadata {
  name: string
  type: string
  isNullable: boolean
  isArray: boolean
  isId: boolean
  isUnique: boolean
  isRelation: boolean
  relationModel?: string
}

export interface ModelMetadata {
  name: string
  fields: FieldMetadata[]
}

export class SchemaProvider {
  private schemaPath: string
  private cachedModels: ModelMetadata[] | null = null
  private cachedRawContent: string | null = null

  constructor(schemaPath?: string) {
    this.schemaPath = schemaPath || path.join(process.cwd(), 'prisma', 'schema.prisma')
  }

  /**
   * Reads raw schema.prisma contents. Caches in memory.
   */
  public getSchemaContent(): string {
    if (this.cachedRawContent !== null) return this.cachedRawContent
    try {
      this.cachedRawContent = fs.readFileSync(this.schemaPath, 'utf-8')
      return this.cachedRawContent
    } catch (err: any) {
      throw new Error(`Failed to read schema.prisma: ${err.message}`)
    }
  }

  /**
   * Parses the schema.prisma content into models, fields, and relations metadata.
   */
  public getModels(): ModelMetadata[] {
    if (this.cachedModels !== null) return this.cachedModels

    const content = this.getSchemaContent()
    const models: ModelMetadata[] = []

    // Match 'model ModelName { ... }' blocks
    const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\}/g
    let match
    
    // Pass 1: Gather all model names
    const modelNames = new Set<string>()
    const tempMatches: { name: string; body: string }[] = []
    
    while ((match = modelRegex.exec(content)) !== null) {
      modelNames.add(match[1])
      tempMatches.push({ name: match[1], body: match[2] })
    }

    // Pass 2: Parse fields inside models
    for (const temp of tempMatches) {
      const fields: FieldMetadata[] = []
      const lines = temp.body.split('\n')
      
      for (const line of lines) {
        const cleaned = line.trim()
        if (!cleaned || cleaned.startsWith('//') || cleaned.startsWith('///')) {
          continue
        }

        // Match "fieldName typeName attributes"
        const fieldMatch = cleaned.match(/^(\w+)\s+([\w\?\[\]]+)(?:\s+(.*))?/)
        if (fieldMatch) {
          const name = fieldMatch[1]
          let typeStr = fieldMatch[2]
          const attributes = fieldMatch[3] || ''

          const isNullable = typeStr.endsWith('?')
          const isArray = typeStr.endsWith('[]')
          const type = typeStr.replace(/[\?\[\]]/g, '')
          const isRelation = modelNames.has(type)

          const isId = attributes.includes('@id')
          const isUnique = attributes.includes('@unique')

          fields.push({
            name,
            type,
            isNullable,
            isArray,
            isId,
            isUnique,
            isRelation,
            relationModel: isRelation ? type : undefined
          })
        }
      }

      models.push({
        name: temp.name,
        fields
      })
    }

    this.cachedModels = models
    return models
  }

  /**
   * Lists all available model/table names.
   */
  public getTableNames(): string[] {
    return this.getModels().map(m => m.name)
  }

  /**
   * Describes columns for the given model, omitting relation objects.
   */
  public describeTable(tableName: string) {
    const model = this.getModels().find(m => m.name.toLowerCase() === tableName.toLowerCase())
    if (!model) {
      throw new Error(`Table/Model "${tableName}" not found in Prisma schema.`)
    }
    return model.fields
      .filter(f => !f.isRelation)
      .map(f => ({
        column_name: f.name,
        data_type: f.type,
        is_nullable: f.isNullable ? 'YES' : 'NO',
        is_primary: f.isId ? 'YES' : 'NO',
        is_unique: f.isUnique ? 'YES' : 'NO'
      }))
  }

  /**
   * Retrieves relationships between models.
   */
  public getRelationships() {
    const relationships: any[] = []
    const models = this.getModels()

    for (const model of models) {
      for (const field of model.fields) {
        if (field.isRelation) {
          relationships.push({
            fromTable: model.name,
            toTable: field.type,
            relationName: field.name,
            isArray: field.isArray
          })
        }
      }
    }
    return relationships
  }
}
