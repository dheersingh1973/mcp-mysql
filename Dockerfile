# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

EXPOSE 8000

# For instructions on how to consume this MCP server, please refer to the README.md file.
CMD ["node", "index.js"]
