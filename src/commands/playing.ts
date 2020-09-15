import { Message } from 'discord.js';

import db from '../db';
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

        const playing = playlist.nowPlaying(guild, room);
        if (!playing) {
            throw new FriendlyError('Nothing is currently playing');
        }

        const song = await db.song.findOne({
            where: { location: playing },
            include: { tags: true },
        });
        if (!song) {
            throw new FriendlyError('I was unable to find that song');
        }

        return message.reply(`${song.title} - ${song.location} (*${song.tags.map((t) => t.tag).join('*, *')}*)`);
    },
};

export default command;
