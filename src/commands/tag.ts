import { Message } from 'discord.js';
import { uniq } from 'lodash';

import { FriendlyError } from '../error';
import playlist from '../playlist';
import { Arguments, Command } from '../types';

const argsToArray = (...args: (string | string[])[]): string[] => {
    const final = [];

    for (const arg of args) {
        if (typeof arg === 'string') {
            final.push(arg);
        } else if (Array.isArray(arg)) {
            final.push(...arg);
        }
    }

    return final;
};

const command: Command = {
    name: 'tag',
    description: 'Update tags of current song',
    alias: ['tags'],
    usage: '[-a|--add TAG] [-r|--remove TAG]',
    examples: ['--add travel', '-a travel -r tavern', '-a epic -a battle'],
    async run(message: Message, args: Arguments) {
        if (!message.member || !message.member.voice.channel) {
            throw new FriendlyError('You are not in a voice channel');
        }

        const guild = message.member.voice.channel.guild.name;
        const room = message.member.voice.channel.name;

        const song = await playlist.nowPlaying(guild, room);
        if (!song) {
            throw new FriendlyError('Nothing is currently playing');
        }

        const add = argsToArray(args.add, args.a);
        const remove = argsToArray(args.remove, args.r);
        const tags = song.tags.filter((t) => !remove.includes(t)).concat(...add);

        await playlist.updateSong(song.file, uniq(tags), song.title);

        return message.react('🎵');
    },
};

export default command;
