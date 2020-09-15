FROM node:12-alpine

RUN apk add --no-cache --virtual .build-deps \
    build-base python3 \
    && apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm ci

RUN apk del .build-deps

COPY . .
RUN npm run build \
    && npm prune --production \
    && rm -rf src prisma tsconfig.json

CMD [ "npm", "start", "--silent" ]
