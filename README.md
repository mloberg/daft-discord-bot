# Daft - Discord Music Bot

Daft is a music bot for Discord designed for my D&D games. It allows me to play
music randonly by tags or single songs.

## Running

The first thing you'll need to do is create a Discord bot. Following the instructions
over at [discordjs.guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot).

### Docker (recommended)

The recommended way to run Daft is with Docker and Docker Compose. Download
[docker-compose.yml](https://raw.githubusercontent.com/mloberg/daft-discord-bot/main/docker-compose.yml)
and [.env.dist](https://raw.githubusercontent.com/mloberg/daft-discord-bot/main/.env.dist)
files. Copy `.env.dist` to `.env` and update the values (ignoring `DATABASE_URL`).

Run `docker-compose up -d` and your bot should come online.

When running for the first time or upgrading, you'll want to run database migrations.

    docker-compose run --rm daft bash -c "npm install && npx prisma migrate deploy --preview-feature"

### Locally

To run Daft locally, you'll need NodeJS (>= 14) and a Postgres database to connect
to.

Then either clone this repo or download the ZIP archive and extract it. Copy
`.env.dist` to `.env` and update the values. Then run `npm install`, `npm run build`,
and `npm start`. You should now have a running Discord bot. To start the web app
to manage songs, run `npm run server`.

## Permissions

When connecting to a guild, it will create a DJ role. Assign this role to users
that should be able to add and play music. Set this role with the `DJ_ROLE`
environment variable, otherwise it defaults to _daft-dj_.

## Usage

Here are some commands to get you started with Daft.

* Help: `_help`
* Add a song: `_add <url> [...tags]`
* Start a playlist: `_play <...tags>`
* Play a single song: `_play <url>`
* Stop playing: `_stop`
* Skip song: `_next`
* Manage songs: `_manage`
* Create a playlist: `_playlist create <name> [...songs]`
* Play a playlist: `_playlist play <name> [--shuffle]`
* Append songs to a playlist: `_playlist add <name> [...songs]`
* Delete a playlist: `_playlist delete <name>`

## Development

Follow the instructions for running locally. Rebuild and restart the bot on file
changes with `npm run dev`.

## Contributing

Make sure tests (`npm test`) and lint (`npm run lint`) pass before submitting
a Pull Request.
