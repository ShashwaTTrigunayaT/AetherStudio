FROM node:18-alpine

WORKDIR /app

# Ensure native C++ compilation modules are present for node-pty binaries
RUN apk add --no-cache python3 make g++ bash

COPY package*.json ./

# Changed from npm ci to npm install
RUN npm install --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]