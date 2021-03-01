import { FriendlyError } from '../error';
import { hasPermission } from '../permission';
import { Command } from '../types';

const command: Command = {
    name: 'volume',
    description: 'Set the playback volume',
    usage: '<volume>',
    async run(message, args) {
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

        const volume = Math.min(Number(args._[0]) || 100, 100) / 100;
        connection.dispatcher.setVolume(volume);

        return message.react('🎶');
    },
};

export default command;
