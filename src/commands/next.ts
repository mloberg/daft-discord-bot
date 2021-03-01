import { FriendlyError } from '../error';
import logger from '../logger';
import { hasPermission } from '../permission';
import player from '../player';
import playlist from '../playlist';
import { Command } from '../types';

const command: Command = {
    name: 'next',
    alias: ['skip'],
    description: 'Play the next song in the playlist',
    usage: '[--volume|-v <volume>]',
    async run(message, args) {
        if (!message.member || !hasPermission(message.member)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        if (!message.member.voice.channel) {
            throw new FriendlyError('You are not in a voice channel.');
        }

        const guild = message.member.guild.id;
        const room = message.member.voice.channel.name;

        const connection = await message.member.voice.channel.join();

        const song = playlist.next(guild, room);
        if (!song) {
            return connection.disconnect();
        }

        logger.debug(`Playing ${song}`);

        const volume = Math.min(Number(args.volume || args.v) || 100, 100) / 100;
        const dispatcher = await player.play(song, connection, { volume });

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
