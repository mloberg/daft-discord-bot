import { Message } from 'discord.js';
import { Arguments } from 'yargs';

import db from '../db';
import { FriendlyError } from '../error';
import playlist from '../playlist';
import { Command } from '../types';

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
        const add = argsToArray(args.add as string, args.a as string);
        const remove = argsToArray(args.remove as string, args.r as string);

        await db.song.update({
            where: { id: song.id },
            data: {
                tags: {
                    deleteMany: remove.map((tag) => ({ songId: song.id, tag })),
                    upsert: add.map((tag) => ({
                        create: { tag },
                        update: { tag },
                        where: { song_tag: { songId: song.id, tag } },
                    })),
                },
            },
        });

        return message.react('🎵');
    },
};

export default command;
