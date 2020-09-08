import { Client } from 'discord.js';
import yargs from 'yargs';

import commands from './commands';
import config from './config';
import { FriendlyError } from './error';
import logger from './logger';
import { Arguments } from './types';

const client = new Client();

client.once('ready', () => {
    if (!client.user) {
        return;
    }

    client.user.setActivity(`Music | ${config.prefix}help`);
    logger.info(
        {
            username: `${client.user.username}#${client.user.discriminator} (${client.user.id})`,
            prefix: config.prefix,
        },
        'Client ready',
    );
});

client.on('message', async (message) => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) {
        return;
    }

    const [commandName, ...args] = message.content.slice(config.prefix.length).trim().split(' ');
    const parsed: Arguments = yargs.help(false).parse(args.join(' '));
    delete parsed.$0;

    const command = commands.get(commandName);
    if (!command) {
        return;
    }

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
