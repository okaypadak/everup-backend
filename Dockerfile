# 1. Aşama: Build ortamı
FROM node:20-alpine AS builder

WORKDIR /app

# package.json ve package-lock.json kopyala
COPY package*.json ./

# Gerekli bağımlılıkları yükle
RUN npm install

# Projeyi kopyala
COPY . .

# NestJS uygulamasını build et
RUN npm run build

# 2. Aşama: Prod ortamı
FROM node:20-alpine

WORKDIR /app

# Sadece prod bağımlılıkları yükle
COPY package*.json ./
RUN npm install --only=production

# Build edilen dist klasörünü kopyala
COPY --from=builder /app/dist ./dist

# Env dosyası varsa (isteğe bağlı)
# COPY .env .env

# Giriş noktası
CMD ["node", "dist/main"]

# Uygulama hangi portu dinliyorsa o expose edilir
EXPOSE 9120
