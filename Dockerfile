# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Install Backend Dependencies
FROM node:18-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN apk add --no-cache python3 make g++ bash
RUN npm install --omit=dev
COPY backend/ .

# Stage 3: Final Image
FROM node:18-alpine
RUN apk add --no-cache bash wget
WORKDIR /app
COPY --from=backend-deps /app/backend /app/backend
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1
CMD ["node", "backend/server.js"]
