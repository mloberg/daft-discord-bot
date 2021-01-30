import { Prisma } from '@prisma/client';
import { Message } from 'discord.js';
import { partition } from 'lodash';
import { Arguments } from 'yargs';

import db from '../db';
import { FriendlyError } from '../error';
import { hasPermission } from '../permission';
import player from '../player';
import playlist from '../playlist';
import { Command } from '../types';
import next from './next';

const command: Command = {
    name: 'play',
    description: 'Start a playlist',
    alias: ['start', 'playlist'],
    usage: '...TAGS|SONG [--volume|-v VOLUME]',
    async run(message: Message, args: Arguments) {
        if (!message.member || !message.member.voice.channel) {
            throw new FriendlyError('You are not in a voice channel');
        }

        if (!hasPermission(message.member)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        if (0 === args._.length) {
            throw new FriendlyError('Please give me something to play.');
        }

        const [songs, tags] = partition(args._, (arg) => player.supports(arg));

        const guild = message.member.voice.channel.guild.name;
        const room = message.member.voice.channel.name;

        if (0 !== tags.length) {
            const results: { location: string }[] = await db.$queryRaw`
            SELECT S.location
            FROM songs S
            JOIN tags T ON T.song_id = S.id
            WHERE T.tag IN (${Prisma.join(tags)})
            AND (S.guild IS NULL OR S.guild = ${message.guild?.id})
            GROUP BY S.id
            HAVING COUNT(T.id) = ${tags.length}
            ORDER BY RANDOM()`;
            if (0 === results.length) {
                throw new FriendlyError(`No songs matching "${tags.join(', ')}" were found`);
            }

            songs.push(...results.map((r) => r.location));
        }

        playlist.clear(guild, room);
        playlist.create(guild, room, songs);

        return await next.run(message, args);
    },
};

export default command;
