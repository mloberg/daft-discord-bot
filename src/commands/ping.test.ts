import { Client, Message, TextChannel } from 'discord.js';

import command from './ping';

const mocks = {
    react: jest.fn(),
};

jest.mock('discord.js', () => {
    return {
        Message: jest.fn().mockImplementation(() => {
            return {
                react: mocks.react,
            };
        }),
    };
});

describe('_ping', () => {
    let message: Message;

    beforeEach(() => {
        mocks.react.mockClear();

        const client = {} as Client;
        const channel = {} as TextChannel;
        message = new Message(client, {}, channel);
    });

    it('is a command', () => {
        expect(command.name).toBe('ping');
        expect(command).toMatchSnapshot();
    });

    it('responds', async () => {
        await command.run(message, { _: [], $0: 'ping' });

        expect(mocks.react).toBeCalledWith('👍');
    });
});
