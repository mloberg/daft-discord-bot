import { Message } from 'discord.js';

import { FriendlyError } from '../error';
import { Arguments, Command } from '../types';
import { env } from '../utils';
import add from './add';
import next from './next';
import pause from './pause';
import ping from './ping';
import play from './play';
import resume from './resume';
import stop from './stop';
import volume from './volume';

const prefix = env('BOT_PREFIX', '_');

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
    async run(message: Message, args: Arguments): Promise<Message> {
        if (!args._.length) {
            return message.channel.send(
                [
                    'Here is a list of available commands:',
                    commands.list().join(', '),
                    `Get more details with "${prefix}help [command]"`,
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
            help.push(`*usage*: \`${prefix}${command.name} ${command.usage}\``);
        }
        if (command.examples) {
            help.push(`*examples*: ${command.examples.map((e) => `\`${prefix}${command.name} ${e}\``).join(', ')}`);
        }

        return message.channel.send(help, { split: true });
    },
};

const commands = new Commands();

commands.register(help);
commands.register(add);
commands.register(next);
commands.register(pause);
commands.register(ping);
commands.register(play);
commands.register(resume);
commands.register(stop);
commands.register(volume);

export default commands;
