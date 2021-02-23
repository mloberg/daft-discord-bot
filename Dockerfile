FROM node:14.15.5

WORKDIR /app

ENV PRISMA_QUERY_ENGINE_BINARY /app/node_modules/prisma/query-engine-linux-arm-openssl-1.1.x

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate \
    npm run build \
    && npm prune --production \
    && rm -rf src tsconfig.json

CMD [ "npm", "start", "--silent" ]
