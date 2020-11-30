import { Message } from 'discord.js';
import jwt from 'jsonwebtoken';

import config from '../config';
import { FriendlyError } from '../error';
import { hasPermission } from '../permission';
import { Command } from '../types';

const command: Command = {
    name: 'manage',
    description: 'Manage songs via web interface',
    alias: ['web'],
    async run(message: Message) {
        if (!message.member || !hasPermission(message.member)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        const token = jwt.sign(
            {
                guild: message.member.guild.id,
                member: message.member.id,
                name: message.member.guild.name,
            },
            config.secret,
            { expiresIn: '1h' },
        );

        return message.author.send(`Manage songs at ${config.host}:${config.port}/?token=${token}`);
    },
};

export default command;
