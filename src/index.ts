import { Client } from 'discord.js';
import { escapeRegExp, memoize } from 'lodash';
import yargs from 'yargs';

import commands from './commands';
import config from './config';
import { FriendlyError } from './error';
import logger from './logger';
import { ensureRole } from './permission';

const client = new Client();
const commandRegex = memoize((client: Client) => {
    const prefix = `<@!?${client.user?.id}>|${escapeRegExp(config.prefix)}`;
    const command = commands.all.map(escapeRegExp).join('|');

    return new RegExp(`^(?:${prefix})\\s*(?<command>${command})(?:\\s+|$)(?<args>.*)`);
});

client.once('ready', () => {
    if (!client.user) {
        return;
    }

    client.guilds.cache.forEach(async (guild) => {
        await ensureRole(guild);
    });

    client.user.setActivity(`Music | ${config.prefix}help`);
    logger.info(
        {
            username: `${client.user.username}#${client.user.discriminator} (${client.user.id})`,
            prefix: config.prefix,
        },
        'Client ready',
    );
});

client.on('guildCreate', async (guild) => {
    await ensureRole(guild);
});

client.on('message', async (message) => {
    if (message.author.bot) {
        return;
    }

    const match = commandRegex(client).exec(message.content);
    const { command: commandName = '', args } = match?.groups || {};
    const command = commands.get(commandName.toLowerCase());

    if (!command) {
        return;
    }

    const parsed = yargs.help(false).parse(args);
    parsed.$0 = commandName;
    parsed._ = parsed._.map((arg) => arg.replace(/^['"]|['"]$/g, ''));

    logger.debug({
        guild: message.guild?.name,
        channel: message.channel.toString(),
        message: message.content,
        command: commandName,
        args: parsed,
    });

    try {
        await command.run(message, parsed);
    } catch (err) {
        if (err instanceof FriendlyError) {
            return message.reply(err.message);
        }

        message.reply('That broke me. Check my logs for details.');
        logger.error(err);
    }
});

process.on('unhandledRejection', (reason) => {
    //.throw it and let our exception handler deal with it
    throw reason;
});

process.on('uncaughtException', (err: Error) => {
    logger.error(err);
    process.exit(1);
});

if (config.env !== 'test') {
    client.login(config.token);
}
