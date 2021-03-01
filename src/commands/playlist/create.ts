import db from '../../db';
import { FriendlyError } from '../../error';
import logger from '../../logger';
import { hasPermission } from '../../permission';
import player from '../../player';
import { Command } from '../../types';

const command: Command = {
    name: 'playlist create',
    alias: ['playlist new'],
    description: 'Create a new playlist',
    usage: '<name> [...songs]',
    async run(message, args) {
        if (!message.member || !hasPermission(message.member)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        const guild = message.member.guild.id;
        const [name, ...songs] = args._;
        if (!name) {
            throw new FriendlyError('I need a name for the playlist.');
        }

        const unsupported = songs.filter((s) => !player.supports(s));
        if (unsupported.length !== 0) {
            throw new FriendlyError(`Cannot create playlist. These songs are unsupported: ${unsupported.join(', ')}`);
        }

        const existing = await db.playlist.findFirst({ where: { name, guild } });
        if (existing) {
            throw new FriendlyError('There is already a playlist with that name.');
        }

        await db.playlist.create({ data: { name, guild, songs } });
        logger.info(`Created playlist ${name} in ${message.member.guild.name}`);

        return message.react('🎵');
    },
};

export default command;
