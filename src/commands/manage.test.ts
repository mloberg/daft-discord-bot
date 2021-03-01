import { Client, Message, TextChannel } from 'discord.js';
import jwt from 'jsonwebtoken';
import { mocked } from 'ts-jest/utils';

import config from '../config';
import { FriendlyError } from '../error';
import { hasPermission } from '../permission';
import command from './manage';

const mocks = {
    author: jest.fn(),
    permission: mocked(hasPermission),
};

jest.mock('discord.js', () => ({
    Message: jest.fn().mockImplementation(() => ({
        member: {
            id: 'testuser',
            guild: {
                id: 'testguild',
                name: 'Test Guild',
            },
        },
        author: {
            send: mocks.author,
        },
    })),
}));

jest.mock('../permission');

describe('_manage', () => {
    let message: Message;

    beforeEach(() => {
        mocks.author.mockClear();
        mocks.permission.mockClear();

        const client = {} as Client;
        const channel = {} as TextChannel;
        message = new Message(client, {}, channel);
    });

    it('is a command', () => {
        expect(command.name).toBe('manage');
        expect(command).toMatchSnapshot();
    });

    it('adds a file to the manager with a title', async () => {
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: [], $0: 'manage' });

        expect(mocks.author).toHaveBeenCalledTimes(1);

        const msg = mocks.author.mock.calls[0][0];
        const match = msg.match(/^Manage songs at http:\/\/localhost:53134\/\?token=(.+)/);
        const data = jwt.verify(match[1], config.secret);

        expect(data).toMatchObject({ guild: 'testguild', name: 'Test Guild', member: 'testuser' });
    });

    it('will throw an error if user does not have role', async () => {
        mocks.permission.mockReturnValue(false);

        await expect(command.run(message, { _: [], $0: 'web' })).rejects.toThrow(
            new FriendlyError('You do not have permission to do that.'),
        );
    });
});
