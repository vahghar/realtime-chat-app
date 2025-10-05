FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 10000  # ✅ Use dynamic PORT from Render

CMD ["npm", "start"]