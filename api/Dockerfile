FROM node:20-alpine

WORKDIR /usr/src/app

# Встановлення залежностей
COPY package*.json ./
RUN npm ci --omit=dev

# Копіюємо решту файлів (включаючи schema.prisma)
COPY . .

# Генеруємо Prisma Client під час збірки
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]
