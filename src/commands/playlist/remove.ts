import db from '../../db';
import { FriendlyError } from '../../error';
import logger from '../../logger';
import { hasPermission } from '../../permission';
import { Command } from '../../types';

const command: Command = {
    name: 'playlist delete',
    alias: ['playlist remove'],
    description: 'Delete a playlist',
    usage: '<name>',
    async run(message, args) {
        if (!message.member || !hasPermission(message.member)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        const guild = message.member.guild.id;
        const name = args._.shift();
        if (!name) {
            throw new FriendlyError('Give me a playlist to delete.');
        }

        await db.playlist.deleteMany({ where: { name, guild } });
        logger.info(`Deleted playlist ${name} from ${message.member.guild.name}`);

        return message.react('🎵');
    },
};

export default command;
