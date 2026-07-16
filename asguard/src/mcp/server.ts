import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ServiceRegistry } from "../services/ServiceRegistry";

/**
 * Registers the database assistant tools onto an MCP Server instance.
 */
export function registerTools(srv: McpServer) {
  // 1. Tool: getSchema
  srv.tool(
    "getSchema",
    "Returns the complete raw Prisma schema file of the application database.",
    {},
    async () => {
      try {
        const schema = ServiceRegistry.getSchemaProvider().getSchemaContent();
        return {
          content: [{ type: "text", text: schema }],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error fetching schema: ${err.message}` }],
        };
      }
    }
  );

  // 2. Tool: getTableNames
  srv.tool(
    "getTableNames",
    "Lists all available tables parsed from the Prisma schema.",
    {},
    async () => {
      try {
        const tables = ServiceRegistry.getSchemaProvider().getTableNames();
        return {
          content: [{ type: "text", text: JSON.stringify(tables, null, 2) }],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing table names: ${err.message}` }],
        };
      }
    }
  );

  // 3. Tool: getRelationships
  srv.tool(
    "getRelationships",
    "Returns the relationships and foreign key mappings between Prisma models.",
    {},
    async () => {
      try {
        const relationships = ServiceRegistry.getSchemaProvider().getRelationships();
        return {
          content: [{ type: "text", text: JSON.stringify(relationships, null, 2) }],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error fetching relationships: ${err.message}` }],
        };
      }
    }
  );

  // 4. Tool: describeTable
  srv.tool(
    "describeTable",
    "Describes columns, data types, and primary/unique keys for a given table name from the Prisma schema.",
    {
      table: z.string().describe("The name of the database table/model to describe."),
    },
    async ({ table }) => {
      try {
        const description = ServiceRegistry.getSchemaProvider().describeTable(table);
        return {
          content: [{ type: "text", text: JSON.stringify(description, null, 2) }],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error describing table "${table}": ${err.message}` }],
        };
      }
    }
  );

  // 5. Tool: sampleRows
  srv.tool(
    "sampleRows",
    "Fetches up to 5 sample rows from the specified table. Safely queries via the SELECT executor.",
    {
      table: z.string().describe("The name of the table to sample rows from."),
    },
    async ({ table }) => {
      try {
        const tables = ServiceRegistry.getSchemaProvider().getTableNames();
        const matchedTable = tables.find(t => t.toLowerCase() === table.toLowerCase());
        if (!matchedTable) {
          throw new Error(`Table "${table}" does not exist in the Prisma schema.`);
        }
        
        // Safely delegate database read queries to the SQL Executor
        const sql = `SELECT * FROM "${matchedTable}" LIMIT 5;`;
        const result = await ServiceRegistry.getSqlExecutor().execute(sql);
        if (!result.success) {
          throw new Error(result.error?.reason || "Failed to execute sample query.");
        }
        return {
          content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting sample rows for table "${table}": ${err.message}` }],
        };
      }
    }
  );

  // 6. Tool: executeSQL
  srv.tool(
    "executeSQL",
    "Executes a read-only SQL SELECT query on the database. Throws an error if validation fails.",
    {
      sql: z.string().describe("The SQL SELECT query to safely execute."),
    },
    async ({ sql }) => {
      try {
        const result = await ServiceRegistry.getSqlExecutor().execute(sql);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error executing SQL: ${err.message}` }],
        };
      }
    }
  );
}

// Initialize the default MCP server singleton
export const server = new McpServer({
  name: "asguard-db-assistant-server",
  version: "1.0.0",
});

// Register all tools onto the singleton server
registerTools(server);

// Run with stdio transport if started directly as a node script
if (typeof require !== 'undefined' && require.main === module) {
  const transport = new StdioServerTransport();
  server.connect(transport).then(() => {
    console.error("ASGUARD Database MCP Server running on stdio transport");
  }).catch((err) => {
    console.error("Failed to start MCP server:", err);
  });
}
