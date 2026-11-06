FROM node:22-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
EXPOSE 3000
# Aplica as migrations pendentes e inicia a API
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
