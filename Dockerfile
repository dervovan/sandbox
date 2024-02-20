# FROM node:16
#FROM node:lts-bookworm-slim
FROM node:alpine

WORKDIR /app
#https://youtu.be/9zUHg7xjIqQ?si=TsaNuva-npx0zt2u&t=821
COPY package.json .
COPY package-lock.json .
#----------------------
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
# CMD ["npm", "run", "start"]
CMD [  "npm", "run", "start:migrate:prod" ]