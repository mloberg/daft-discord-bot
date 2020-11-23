import { Message } from 'discord.js';

import { FriendlyError } from '../error';
import { hasPermission } from '../permission';
import { Command } from '../types';

const command: Command = {
    name: 'resume',
    description: 'Resume the playlist',
    async run(message: Message) {
        if (!message.member || !message.member.voice.channel) {
            throw new FriendlyError('You are not in a voice channel');
        }

        if (!hasPermission(message.member)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        const connection = await message.member.voice.channel.join();
        if (!connection.dispatcher) {
            return;
        }

        connection.dispatcher.resume();

        return message.react('🎶');
    },
};

export default command;
