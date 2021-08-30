FROM node:16.6.1

WORKDIR /app

RUN apt-get update \
    && apt-get -y install --no-install-recommends ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build \
    && npm prune --production \
    && rm -rf src tsconfig.json

CMD [ "npm", "start", "--silent" ]
