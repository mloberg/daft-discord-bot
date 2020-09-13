import { Message } from 'discord.js';
import { createReadStream } from 'fs';

import { FriendlyError } from '../error';
import logger from '../logger';
import playlist from '../playlist';
import { Arguments, Command } from '../types';

const command: Command = {
    name: 'next',
    description: 'Play the next song in the playlist',
    alias: ['skip'],
    usage: '[--volume|-v VOLUME]',
    async run(message: Message, args: Arguments) {
        if (!message.member || !message.member.voice.channel) {
            throw new FriendlyError('You are not in a voice channel');
        }

        const guild = message.member.voice.channel.guild.name;
        const room = message.member.voice.channel.name;

        const connection = await message.member.voice.channel.join();

        const song = playlist.next(guild, room);
        if (!song) {
            connection.disconnect();

            return;
        }

        const volume = Math.min(Number(args.volume || args.v) || 100, 100) / 100;
        const dispatcher = connection.play(createReadStream(song), { type: 'webm/opus', volume });

        dispatcher.on('error', (err) => {
            logger.error({ guild, room, type: err.name, stack: err.stack }, err.message);
            connection.disconnect();
        });

        dispatcher.on('finish', async () => {
            await this.run(message, args);
        });

        return message.react('🎶');
    },
};

export default command;
