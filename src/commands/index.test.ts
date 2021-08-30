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

describe('_help', () => {
    let message: Message;

    beforeEach(() => {
        mocks.send.mockClear();

        const client = {} as Client;
        const channel = {} as TextChannel;
        message = new Message(client, {}, channel);
    });

    it('is a command', () => {
        expect(help.name).toBe('help');
        expect(help).toMatchSnapshot();
    });

    it('returns a list of all commands', async () => {
        await help.run(message, { _: [], $0: 'help' });

        expect(mocks.send).toMatchSnapshot();
    });

    it.each(['help', 'play', 'pause', 'volume'])('returns the details for the %s command', async (cmd) => {
        await help.run(message, { _: [cmd], $0: 'help' });

        expect(mocks.send).toMatchSnapshot();
    });

    it('returns an error if an invalid command is given', async () => {
        await expect(help.run(message, { _: ['invalid'], $0: 'help' })).rejects.toThrow(
            new FriendlyError('No command for "invalid" found.'),
        );
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
