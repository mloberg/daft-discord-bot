import { Message } from 'discord.js';
import { Arguments } from 'yargs';

import { FriendlyError } from '../error';
import { Command } from '../types';

const command: Command = {
    name: 'volume',
    description: 'Set the playback volume',
    usage: '[VOLUME]',
    async run(message: Message, args: Arguments) {
        if (!message.member || !message.member.voice.channel) {
            throw new FriendlyError('You are not in a voice channel');
        }

        const connection = await message.member.voice.channel.join();
        if (!connection.dispatcher) {
            return;
        }

        const volume = Math.min(Number(args._[0]) || 100, 100) / 100;
        connection.dispatcher.setVolume(volume);

        return message.react('🎶');
    },
};

export default command;
