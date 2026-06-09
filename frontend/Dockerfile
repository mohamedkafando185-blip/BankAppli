# Étape 1 : Build React
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# Étape 2 : Serveur Nginx pour servir le SPA
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
# BUG FIX #56 : configuration nginx pour React Router (SPA)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
