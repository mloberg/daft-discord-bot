FROM node:14.15.2-alpine

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache --virtual .build-deps \
        build-base python3 \
    && apk add --no-cache ffmpeg \
    && npm ci \
    && apk del .build-deps

COPY . .
RUN npx prisma generate \
    && npm run build \
    && npm prune --production \
    && rm -rf src tsconfig.json

CMD [ "npm", "start", "--silent" ]
