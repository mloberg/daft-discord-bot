import { Message } from 'discord.js';
import { shuffle } from 'lodash';

import { FriendlyError } from '../error';
import playlist from '../playlist';
import { Arguments, Command } from '../types';
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

        playlist.clear(guild, room);

        const songs = shuffle(await playlist.findSongs(tags));
        playlist.create(guild, room, songs);

        await next.run(message, args);
    },
};

export default command;
