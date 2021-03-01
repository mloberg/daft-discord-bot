import db from '../db';
import { FriendlyError } from '../error';
import { hasPermission } from '../permission';
import { Command } from '../types';

const command: Command = {
    name: 'list',
    description: 'Show available song tags',
    async run(message) {
        if (!message.member || !hasPermission(message.member)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        const results: { tag: string; total: number }[] = await db.$queryRaw`
        SELECT T.tag, COUNT(T.id) as total
        FROM tags AS T
        INNER JOIN songs AS S ON T.song_id = S.id
        WHERE S.guild = ${message.member.guild.id}
        GROUP BY tag
        ORDER BY total DESC`;
        if (0 === results.length) {
            throw new FriendlyError('No tags found. Try adding some songs first.');
        }

        return message.reply(results.map((r) => `${r.tag} (${r.total})`).join(', '));
    },
};

export default command;
