import { shuffle } from 'lodash';

import db from '../../db';
import { FriendlyError } from '../../error';
import { hasPermission } from '../../permission';
import playlist from '../../playlist';
import { Command } from '../../types';
import next from '../next';

const command: Command = {
    name: 'playlist play',
    alias: ['playlist start'],
    description: 'Play a playlist',
    usage: '<name> [--shuffle|-r] [--volume|-v <volume>]',
    async run(message, args) {
        if (!message.member || !hasPermission(message.member)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        if (!message.member.voice.channel) {
            throw new FriendlyError('You are not in a voice channel.');
        }

        const guild = message.member.guild.id;
        const room = message.member.voice.channel.name;

        const name = args._.shift();
        if (!name) {
            throw new FriendlyError('Give me a playlist to play.');
        }

        const toPlay = await db.playlist.findFirst({ where: { guild, name } });
        if (!toPlay) {
            throw new FriendlyError("I couldn't find that playlist.");
        }

        const songs = toPlay.songs as string[];
        const randomize = args.shuffle || args.r;

        playlist.clear(guild, room);
        playlist.create(guild, room, randomize ? shuffle(songs) : songs);

        return await next.run(message, args);
    },
};

export default command;
