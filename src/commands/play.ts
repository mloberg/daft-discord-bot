import { join } from '@prisma/client';
import { Message } from 'discord.js';
import { Arguments } from 'yargs';

import db from '../db';
import { FriendlyError } from '../error';
import playlist from '../playlist';
import { Command } from '../types';
import next from './next';

const command: Command = {
    name: 'play',
    description: 'Start a playlist',
    alias: ['start'],
    usage: '[...TAGS] [--volume|-v VOLUME]',
    async run(message: Message, args: Arguments) {
        if (!message.member || !message.member.voice.channel) {
            throw new FriendlyError('You are not in a voice channel');
        }

        const guild = message.member.voice.channel.guild.name;
        const room = message.member.voice.channel.name;
        const tags = args._.map((t) => t.toString());

        const results: { location: string }[] = await db.$queryRaw`SELECT S.location
        FROM songs S
        JOIN tags T ON T.song_id = S.id
        WHERE T.tag IN (${join(tags)})
        GROUP BY S.id
        HAVING COUNT(T.id) = ${tags.length}
        ORDER BY RANDOM()`;
        if (0 === results.length) {
            throw new FriendlyError(`No songs matching "${tags.join(', ')}" were found`);
        }

        playlist.clear(guild, room);
        playlist.create(
            guild,
            room,
            results.map((r) => r.location),
        );

        await next.run(message, args);
    },
};

export default command;
