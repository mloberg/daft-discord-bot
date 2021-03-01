import db from '../../db';
import { FriendlyError } from '../../error';
import { hasPermission } from '../../permission';
import { Command } from '../../types';

const command: Command = {
    name: 'playlist list',
    alias: ['playlist show'],
    description: 'List all playlists or songs in a playlist',
    usage: '[name]',
    async run(message, args) {
        if (!message.member || !hasPermission(message.member)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        const guild = message.member.guild.id;
        const name = args._.shift();
        if (!name) {
            const playlists = await db.playlist.findMany({ where: { guild } });

            return message.reply(playlists.map((playlist) => playlist.name).join(', '));
        }

        const playlist = await db.playlist.findFirst({ where: { name, guild } });
        if (!playlist) {
            throw new FriendlyError("I couldn't find that playlist.");
        }

        const songs = playlist.songs as string[];
        return message.reply(songs.join(', '));
    },
};

export default command;
