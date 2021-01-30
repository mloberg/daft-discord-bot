FROM node:14.15.4

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate \
    npm run build \
    && npm prune --production \
    && rm -rf src tsconfig.json

CMD [ "npm", "start", "--silent" ]
