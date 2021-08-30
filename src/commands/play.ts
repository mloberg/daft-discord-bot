import { partition } from 'lodash';

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
    usage: '<...song> [--volume|-v <volume>]',
    async run(message, args) {
        if (!message.member || !hasPermission(message.member)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        if (!message.member.voice.channel) {
            throw new FriendlyError('You are not in a voice channel.');
        }

        const [songs, unsupported] = partition(args._, (arg) => player.supports(arg));
        if (unsupported.length > 0) {
            throw new FriendlyError(`I don't know how to play ${unsupported.map((u) => `_${u}_`).join(', ')}.`);
        }

        const guild = message.member.guild.id;
        const room = message.member.voice.channel.name;

        playlist.clear(guild, room);
        playlist.create(guild, room, songs);

        return await next.run(message, args);
    },
};

export default command;
