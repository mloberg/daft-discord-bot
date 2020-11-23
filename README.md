# Daft - Discord Music Bot

Daft is a music bot for Discord. It differs from other music bots in that it will
create a random playlist from tagged songs.

## Requirements

* NodeJS (>=12)
* ffmpeg

## Setup

You'll need to create a Discord bot. Follow the instructions over at
[discordjs.guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot).

Once you have that, copy `.env.dist` to `.env` and set the `BOT_TOKEN` value to
the token you created above.

Once that's done run `npm install`, `npm run build`, and `npm start`.

When connecting to a guild, it will create a DJ role. Assign this role to users
that should be able to add and play music. Set this role with the `DJ_ROLE`
environment variable, otherwise it defaults to _daft-dj_.

## Development

To rebuild and restart the bot on file changes, run `npm run watch`.

## Contributing

Make sure tests (`npm run test`) and lint (`npm run lint`) pass before submitting
a Pull Request.
