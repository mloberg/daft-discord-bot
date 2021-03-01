import { FriendlyError } from '../error';
import { hasPermission } from '../permission';
import { Command } from '../types';

const command: Command = {
    name: 'resume',
    description: 'Resume the playlist',
    async run(message) {
        if (!message.member || !hasPermission(message.member)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        if (!message.member.voice.channel) {
            throw new FriendlyError('You are not in a voice channel.');
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
