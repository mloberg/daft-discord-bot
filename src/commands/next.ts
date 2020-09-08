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

        const dispatcher = connection.play(createReadStream(song), { type: 'webm/opus' });

        dispatcher.on('error', (error) => {
            logger.error({ guild, room, error }, 'encountered error when playing track');
            connection.disconnect();
        });

        dispatcher.on('finish', async () => {
            await this.run(message, args);
        });

        return message.react('🎶');
    },
};

export default command;
