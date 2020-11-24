import { Message } from 'discord.js';
import { Arguments } from 'yargs';

import db from '../db';
import { FriendlyError } from '../error';
import logger from '../logger';
import { hasPermission } from '../permission';
import player from '../player';
import { Command } from '../types';

const command: Command = {
    name: 'add',
    description: 'Add a song',
    usage: '[FILE] [...TAGS]',
    examples: ['counting-the-cost.webm dark menacing epic'],
    async run(message: Message, args: Arguments) {
        if (!message.member || !hasPermission(message.member)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        const file = args._.shift()?.toString().replace(/^"|"$/, '');
        const tags = args._.map((t) => t.toString());

        if (!file || tags.length === 0) {
            throw new FriendlyError('Invalid command usage: [song] [...tag]');
        }

        if (!player.supports(file)) {
            throw new FriendlyError('I was unable to add that. Unsupported type.');
        }

        const title = await player.getTitle(file);

        try {
            await db.song.create({
                data: {
                    title,
                    location: file,
                    tags: {
                        create: tags.map((tag) => ({ tag })),
                    },
                    guild: message.guild?.id,
                },
            });
        } catch (err) {
            logger.error(err);
            throw new FriendlyError('I was unable to add that song. Does it exist already?');
        }

        return message.react('🎵');
    },
};

export default command;
