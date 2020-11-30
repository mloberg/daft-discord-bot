import { Message } from 'discord.js';
import { Arguments } from 'yargs';

import config from '../config';
import { FriendlyError } from '../error';
import { Command } from '../types';
import add from './add';
import manage from './manage';
import next from './next';
import pause from './pause';
import ping from './ping';
import play from './play';
import playing from './playing';
import resume from './resume';
import stop from './stop';
import tag from './tag';
import volume from './volume';

export class Commands {
    private commands: Command[] = [];

    register(command: Command): void {
        this.commands.push(command);
    }

    get(name: string): Command | null {
        return this.commands.find((c) => c.name === name || (c.alias && c.alias.includes(name))) || null;
    }

    list(): string[] {
        return this.commands.map((c) => c.name);
    }
}

export const help: Command = {
    name: 'help',
    description: 'Get help with commands',
    alias: ['commands'],
    usage: '[COMMAND]',
    async run(message: Message, args: Arguments): Promise<Message | Message[]> {
        if (!args._.length) {
            return message.channel.send(
                [
                    'Here is a list of available commands:',
                    commands.list().join(', '),
                    `Get more details with "${config.prefix}help [command]"`,
                ],
                { split: true },
            );
        }

        const name = args._[0].toString().toLowerCase();
        const command = commands.get(name);

        if (!command) {
            throw new FriendlyError(`No command for "${name}" found.`);
        }

        const help = [`**${command.name}**: ${command.description}`];
        if (command.alias) {
            help.push(`*aliases*: ${command.alias.join(', ')}`);
        }
        if (command.usage) {
            help.push(`*usage*: \`${config.prefix}${command.name} ${command.usage}\``);
        }
        if (command.examples) {
            help.push(
                `*examples*: ${command.examples.map((e) => `\`${config.prefix}${command.name} ${e}\``).join(', ')}`,
            );
        }

        return message.channel.send(help, { split: true });
    },
};

const commands = new Commands();

commands.register(help);
commands.register(add);
commands.register(manage);
commands.register(next);
commands.register(pause);
commands.register(ping);
commands.register(play);
commands.register(playing);
commands.register(resume);
commands.register(stop);
commands.register(tag);
commands.register(volume);

export default commands;
