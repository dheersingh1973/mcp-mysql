# MCP MySQL Server

This is a Node.js-based MCP (Managed Connector Platform) server for MySQL, exposing functionalities to interact with a MySQL database.

## Features

-   **query**: Executes a SQL query with optional parameters.
-   **describe_table**: Describes the schema of a specified table.
-   **list_tables**: Lists all tables in the connected database.
-   **update**: Performs update operations on a table.
-   **insert**: Inserts a single record into a table.
-   **delete**: Deletes records from a table based on a condition (implemented by `deleteSingle` internally).

## Setup and Configuration

### Prerequisites

-   Node.js (LTS version recommended)
-   npm (Node Package Manager)
-   MySQL Server running and accessible
-   Express.js (included as a dependency)

### Installation

1.  **Clone the repository (or create the project structure manually):**

    ```bash
    git clone <repository-url>
    cd mcp-mysql
    ```

    If you are setting this up manually, ensure you have `package.json` and `index.js` as provided.

2.  **Install dependencies:**

    Navigate to the project directory and run:

    ```bash
    npm install
    ```

### Configuration

1.  **Create a `.env` file:**

    In the root directory of the project, create a file named `.env`.

2.  **Add database credentials to `.env`:**

    Populate the `.env` file with your MySQL database connection details:

    ```
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=password
    DB_DATABASE=mysql_db
    ```

    **Note:** Replace `localhost`, `3306`, `root`, `password`, `mysql_db`, and `your_mysql_port` with your actual database host, port, username, password, database name, and desired server port respectively.

## MCP JSON Configuration for IDEs (e.g., Cursor AI, VS Code)

To allow IDEs to automatically discover and interact with your MCP MySQL server, you can add the following JSON configuration to your IDE's `.cursor/mcp.json` file.

```json
{
  "mcpServers": {
    "mcp_mysql_dheer": {
      "command": "node",
      "args": ["index.js"],
      "env": {
        "DB_HOST": "your_db_host",
        "DB_PORT": "your_db_port",
        "DB_USER": "your_db_user",
        "DB_PASSWORD": "your_db_pwd",
        "DB_DATABASE": "your_db"
      }
    }
  }
}
```

## Docker Usage

This MCP server runs as a stdio application. Below are the instructions to build a Docker image and run the server within a container.

1.  **Build the Docker Image:**

    Navigate to the project directory containing the `Dockerfile` and `package.json`, then run:

    ```bash
    docker build -t mcp_mysql_dheer .
    ```

2.  **Run the Docker Container (as a stdio server):**

    When running the Docker container, you'll need to provide the MySQL database credentials as environment variables.

    ```bash
    docker run -i mcp_mysql_dheer node index.js \
      -e DB_HOST=your_mysql_host \
      -e DB_USER=your_mysql_user \
      -e DB_PASSWORD=your_mysql_password \
      -e DB_DATABASE=your_mysql_database \
      -e DB_PORT=your_mysql_port
    ```

    **Note:**
    -   `-i` flag is crucial for `STDIN` to remain open, allowing the MCP client to communicate with the server.
    -   Replace `your_mysql_host`, `your_mysql_user`, `your_mysql_password`, `your_mysql_database`, and `your_mysql_port` with your actual database connection details.

## Usage (Example with a hypothetical MCP Client)

This server is designed to be consumed by an MCP client. Here's a conceptual example of how an MCP client might interact with these functionalities:

```javascript
const client = new MCPClient({
  server: {
    command: 'docker',
    args: [
      'run',
      '-i',
      '--rm',
      'mcp_mysql_dheer',
      'node',
      'index.js',
      '-e', 'DB_HOST=your_mysql_host',
      '-e', 'DB_USER=your_mysql_user',
      '-e', 'DB_PASSWORD=your_mysql_password',
      '-e', 'DB_DATABASE=your_mysql_database',
      '-e', 'DB_PORT=your_mysql_port'
    ],
  },
});

async function exampleUsage() {
  // Example: List tables
  const tables = await client.callTool('list_tables', {});
  console.log('Tables:', tables);

  // Example: Query data
  const users = await client.callTool('query', { sql: 'SELECT * FROM users' });
  console.log('Users:', users);
}

exampleUsage();
```
