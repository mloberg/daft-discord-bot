import { Message } from 'discord.js';

import { FriendlyError } from '../error';
import playlist from '../playlist';
import { Command } from '../types';

const command: Command = {
    name: 'playing',
    description: 'Show the currently playing song',
    alias: ['now-playing', 'nowPlaying'],
    async run(message: Message) {
        if (!message.member || !message.member.voice.channel) {
            throw new FriendlyError('You are not in a voice channel');
        }

        const guild = message.member.voice.channel.guild.name;
        const room = message.member.voice.channel.name;

        const song = await playlist.nowPlaying(guild, room);
        if (!song) {
            throw new FriendlyError('Nothing is currently playing');
        }

        return message.reply(`${song.title ?? song.file} (*${song.tags.join('*, *')}*)`, { split: true });
    },
};

export default command;
