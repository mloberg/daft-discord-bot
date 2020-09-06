import { Message } from 'discord.js';
import fs from 'fs-extra';

import { FriendlyError } from '../error';
import playlist from '../playlist';
import { Arguments, Command } from '../types';

const command: Command = {
    name: 'add',
    description: 'Add a song',
    usage: '[FILE] [...TAGS]',
    examples: ['counting-the-cost.webm dark menacing epic'],
    async run(message: Message, args: Arguments) {
        const file = args._.shift()?.toString();
        const tags = args._.map((t) => t.toString());

        if (!file || tags.length === 0) {
            throw new FriendlyError('Invalid command usage: [song] [...tag]');
        }

        if (!fs.existsSync(file)) {
            throw new FriendlyError('Could not find file. I only support local files for now.');
        }

        // TODO: verify webm or mp3 and update to play mp3
        await playlist.addSong(file, tags);

        return message.react('🎵');
    },
};

export default command;
