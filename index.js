#!/usr/bin/env node
require('dotenv').config();

const mysql = require('mysql2/promise');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// Your existing database functions
async function connectDb() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'mcp_database'
    });
    console.error('Connected to MySQL database');
    return connection;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

async function query(sql, params) {
  const connection = await connectDb();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    await connection.end();
  }
}

async function listTables() {
  const connection = await connectDb();
  try {
    const [rows] = await connection.execute('SHOW TABLES');
    return rows;
  } finally {
    await connection.end();
  }
}

async function describeTable(tableName) {
  const connection = await connectDb();
  try {
    const [rows] = await connection.execute(`DESCRIBE ${tableName}`);
    return rows;
  } finally {
    await connection.end();
  }
}

async function insert(tableName, data) {
  const connection = await connectDb();
  try {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    const [result] = await connection.execute(sql, values);
    return result;
  } finally {
    await connection.end();
  }
}

async function update(tableName, data, condition) {
  const connection = await connectDb();
  try {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${condition}`;
    const [result] = await connection.execute(sql, values);
    return result;
  } finally {
    await connection.end();
  }
}

async function deleteSingle(tableName, condition) {
  const connection = await connectDb();
  try {
    const sql = `DELETE FROM ${tableName} WHERE ${condition}`;
    const [result] = await connection.execute(sql);
    return result;
  } finally {
    await connection.end();
  }
}

// Create MCP Server
const server = new Server(
  {
    name: 'mcp_mysql_dheer',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools list handler - CORRECT SYNTAX
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query',
        description: 'Execute a SQL query on the MySQL database',
        inputSchema: {
          type: 'object',
          properties: {
            sql: {
              type: 'string',
              description: 'SQL query to execute',
            },
            params: {
              type: 'array',
              description: 'Query parameters for prepared statements',
              items: { type: 'string' },
            },
          },
          required: ['sql'],
        },
      },
      {
        name: 'list_tables',
        description: 'List all tables in the database',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'describe_table',
        description: 'Get the structure/schema of a table',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Name of the table to describe',
            },
          },
          required: ['tableName'],
        },
      },
      {
        name: 'insert',
        description: 'Insert a single row into a table',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Name of the table',
            },
            data: {
              type: 'object',
              description: 'Key-value pairs representing column names and values',
            },
          },
          required: ['tableName', 'data'],
        },
      },
      {
        name: 'update',
        description: 'Update rows in a table',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Name of the table',
            },
            data: {
              type: 'object',
              description: 'Key-value pairs to update',
            },
            condition: {
              type: 'string',
              description: 'WHERE clause condition (e.g., "id = 1")',
            },
          },
          required: ['tableName', 'data', 'condition'],
        },
      },
      {
        name: 'delete',
        description: 'Delete rows from a table based on a condition',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Name of the table',
            },
            condition: {
              type: 'string',
              description: 'WHERE clause condition',
            },
          },
          required: ['tableName', 'condition'],
        },
      },
      {
        name: 'connect_db',
        description: 'Connect to the MySQL database. This tool does not require any input parameters.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool execution - CORRECT SYNTAX
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'query':
        const rows = await query(args.sql, args.params || []);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(rows, null, 2),
            },
          ],
        };

      case 'list_tables':
        const tables = await listTables();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tables, null, 2),
            },
          ],
        };

      case 'describe_table':
        const description = await describeTable(args.tableName);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(description, null, 2),
            },
          ],
        };

      case 'insert':
        const insertResult = await insert(args.tableName, args.data);
        return {
          content: [
            {
              type: 'text',
              text: `Inserted successfully. Insert ID: ${insertResult.insertId}`,
            },
          ],
        };

      case 'update':
        const updateResult = await update(args.tableName, args.data, args.condition);
        return {
          content: [
            {
              type: 'text',
              text: `Updated ${updateResult.affectedRows} row(s)`,
            },
          ],
        };

      case 'delete':
        const deleteResult = await deleteSingle(args.tableName, args.condition);
        return {
          content: [
            {
              type: 'text',
              text: `Deleted ${deleteResult.affectedRows} row(s)`,
            },
          ],
        };

      case 'connect_db':
        await connectDb();
        return {
          content: [
            {
              type: 'text',
              text: 'Successfully connected to the database.',
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MySQL MCP Server running on stdio');
}

main().catch(console.error);
