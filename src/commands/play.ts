import { Prisma } from '@prisma/client';
import { partition } from 'lodash';

import db from '../db';
import { FriendlyError } from '../error';
import { hasPermission } from '../permission';
import player from '../player';
import playlist from '../playlist';
import { Command } from '../types';
import next from './next';

const command: Command = {
    name: 'play',
    alias: ['start'],
    description: 'Start a playlist',
    usage: '<...tags|song> [--volume|-v <volume>]',
    async run(message, args) {
        if (!message.member || !hasPermission(message.member)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        if (!message.member.voice.channel) {
            throw new FriendlyError('You are not in a voice channel.');
        }

        const [songs, tags] = partition(args._, (arg) => player.supports(arg));

        const guild = message.member.guild.id;
        const room = message.member.voice.channel.name;

        if (0 !== tags.length) {
            const results: { location: string }[] = await db.$queryRaw`
            SELECT S.location
            FROM songs S
            JOIN tags T ON T.song_id = S.id
            WHERE T.tag IN (${Prisma.join(tags)})
            AND S.guild = ${guild}
            GROUP BY S.id
            HAVING COUNT(T.id) = ${tags.length}
            ORDER BY RANDOM()`;
            if (0 === results.length) {
                throw new FriendlyError(`No songs matching "${tags.join(', ')}" were found.`);
            }

            songs.push(...results.map((r) => r.location));
        }

        playlist.clear(guild, room);
        playlist.create(guild, room, songs);

        return await next.run(message, args);
    },
};

export default command;
