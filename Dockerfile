FROM node:14.15.4

WORKDIR /app

COPY package*.json prisma ./
RUN npm ci

COPY . .
RUN npm run build \
    && npm prune --production \
    && rm -rf src tsconfig.json

CMD [ "npm", "start", "--silent" ]
