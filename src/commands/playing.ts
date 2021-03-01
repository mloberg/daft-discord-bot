import db from '../db';
import { FriendlyError } from '../error';
import playlist from '../playlist';
import { Command } from '../types';

const command: Command = {
    name: 'playing',
    alias: ['now-playing', 'now playing', "what's playing"],
    description: 'Show the currently playing song',
    async run(message) {
        if (!message.member || !message.member.voice.channel) {
            throw new FriendlyError('You are not in a voice channel.');
        }

        const guild = message.member.guild.id;
        const room = message.member.voice.channel.name;

        const playing = playlist.nowPlaying(guild, room);
        if (!playing) {
            throw new FriendlyError('Nothing is currently playing.');
        }

        const song = await db.song.findFirst({
            where: {
                guild,
                location: playing,
            },
            include: { tags: true },
        });
        if (!song) {
            return message.reply(playing);
        }

        return message.reply(`${song.title} - ${song.location} (*${song.tags.map((t) => t.tag).join('*, *')}*)`);
    },
};

export default command;
