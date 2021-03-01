import db from '../../db';
import { FriendlyError } from '../../error';
import logger from '../../logger';
import { hasPermission } from '../../permission';
import player from '../../player';
import { Command } from '../../types';

const command: Command = {
    name: 'playlist add',
    alias: ['playlist append'],
    description: 'Append songs to a playlist',
    usage: '<name> [...songs]',
    async run(message, args) {
        if (!message.member || !hasPermission(message.member)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        const guild = message.member.guild.id;
        const [name, ...append] = args._;
        if (!name) {
            throw new FriendlyError('I need a name for the playlist.');
        }

        const unsupported = append.filter((s) => !player.supports(s));
        if (unsupported.length !== 0) {
            throw new FriendlyError(`Cannot add to playlist. These songs are unsupported: ${unsupported.join(', ')}`);
        }

        const playlist = await db.playlist.findFirst({ where: { name, guild } });
        if (!playlist) {
            throw new FriendlyError("I couldn't find that playlist.");
        }

        const songs: string[] = playlist.songs as string[];
        songs.push(...append);

        await db.playlist.update({
            where: { id: playlist.id },
            data: { songs },
        });
        logger.info(`Added songs to playlist ${name} in ${message.member.guild.name}`);

        return message.react('🎵');
    },
};

export default command;
