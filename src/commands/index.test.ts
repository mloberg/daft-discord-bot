import { Client, Message, TextChannel } from 'discord.js';

import { FriendlyError } from '../error';
import { Commands, help } from '.';

const mocks = {
    send: jest.fn(),
};

jest.mock('discord.js', () => ({
    Message: jest.fn().mockImplementation(() => ({
        channel: {
            send: mocks.send,
        },
    })),
}));

describe('_help configuration', () => {
    it('should have basic command infomation', () => {
        expect(help.name).toEqual('help');
        expect(help.description).toEqual('Get help with commands');
        expect(help.usage).toEqual('[COMMAND]');
    });

    it('should have an alias', () => {
        expect(help.alias).toContain('commands');
    });
});

describe('_help', () => {
    let message: Message;

    beforeEach(() => {
        mocks.send.mockClear();
        mocks.send.mockReturnThis();

        const client = {} as Client;
        const channel = {} as TextChannel;
        message = new Message(client, {}, channel);
    });

    it('returns a list of all commands', async () => {
        const reply = await help.run(message, { _: [], $0: 'help' });

        expect(reply).toEqual(message.channel);
        expect(mocks.send).toMatchSnapshot();
    });

    it.each(['help', 'add', 'play', 'pause', 'volume'])('returns the details for the %s command', async (cmd) => {
        const reply = await help.run(message, { _: [cmd], $0: 'help' });

        expect(reply).toEqual(message.channel);
        expect(mocks.send).toMatchSnapshot();
    });

    it('returns an error if an invalid command is given', async () => {
        try {
            await help.run(message, { _: ['invalid'], $0: 'help' });

            fail('expected error to be thrown');
        } catch (err) {
            expect(err instanceof FriendlyError).toBe(true);
            expect(err.message).toEqual('No command for "invalid" found.');
        }
    });
});

describe('Commands', () => {
    it('registers commands and their aliases', () => {
        const commands = new Commands();
        expect(commands.list).toHaveLength(0);

        commands.register(help);
        expect(commands.list).toHaveLength(1);
        expect(commands.all).toHaveLength(2);
    });

    it('returns the correct command', () => {
        const commands = new Commands();
        commands.register(help);

        expect(commands.get('help')).toEqual(help);
        expect(commands.get('commands')).toEqual(help);
        expect(commands.get('foo')).toBeNull();
    });
});
