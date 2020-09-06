import { Message } from 'discord.js';

import { Command } from '../types';

const command: Command = {
    name: 'ping',
    description: 'Pong',
    async run(message: Message) {
        return message.react('👍');
    },
};

export default command;
