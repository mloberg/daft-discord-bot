import { Client, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import { FriendlyError } from '../error';
import { hasPermission } from '../permission';
import command from './stop';

const mocks = {
    react: jest.fn(),
    leave: jest.fn(),
    permission: mocked(hasPermission),
};

jest.mock('discord.js', () => ({
    Message: jest.fn().mockImplementation(() => ({
        member: {
            voice: {
                channel: {
                    leave: mocks.leave,
                },
            },
        },
        react: mocks.react,
    })),
}));

jest.mock('../permission');

describe('_stop', () => {
    const client = {} as Client;
    const channel = {} as TextChannel;

    beforeEach(() => {
        mocks.react.mockClear();
        mocks.leave.mockClear();
        mocks.permission.mockClear();
    });

    it('is a command', () => {
        expect(command.name).toBe('stop');
        expect(command).toMatchSnapshot();
    });

    it('leaves the voice channel', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: [], $0: 'stop' });

        expect(mocks.leave).toHaveBeenCalledTimes(1);
        expect(mocks.react).toBeCalledWith('🎶');
    });

    it('will throw an error if not in a voice channel', async () => {
        (mocked(Message) as jest.Mock).mockImplementationOnce(() => {
            return { member: { voice: { channe: null } } };
        });
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: [], $0: 'stop' })).rejects.toThrow(
            new FriendlyError('You are not in a voice channel.'),
        );
    });

    it('will throw an error if does not have role', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(false);

        await expect(command.run(message, { _: [], $0: 'stop' })).rejects.toThrow(
            new FriendlyError('You do not have permission to do that.'),
        );
    });
});
