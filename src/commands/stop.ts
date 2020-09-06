import { Message } from 'discord.js';

import { FriendlyError } from '../error';
import { Command } from '../types';

const command: Command = {
    name: 'stop',
    description: 'Stop the playlist',
    async run(message: Message) {
        if (!message.member || !message.member.voice.channel) {
            throw new FriendlyError('You are not in a voice channel');
        }

        message.member.voice.channel.leave();

        return message.react('🎶');
    },
};

export default command;
