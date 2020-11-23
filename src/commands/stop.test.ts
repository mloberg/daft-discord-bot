import { Client, Guild, Message, TextChannel } from 'discord.js';
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
    Client: jest.fn(),
    Guild: jest.fn(),
    TextChannel: jest.fn(),
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

describe('_stop configuration', () => {
    it('should have basic command infomation', () => {
        expect(command.name).toEqual('stop');
        expect(command.description).toEqual('Stop the playlist');
    });

    it('should have no aliases', () => {
        expect(command.alias).toBeUndefined();
    });
});

describe('_stop', () => {
    const client = new Client();
    const guild = new Guild(client, {});
    const channel = new TextChannel(guild, {});

    beforeEach(() => {
        mocks.react.mockClear();
        mocks.leave.mockClear();
        mocks.permission.mockClear();
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

        try {
            await command.run(message, { _: [], $0: 'stop' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('You are not in a voice channel');
        }
    });

    it('will throw an error if does not have role', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(false);

        try {
            await command.run(message, { _: [], $0: 'stop' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('You do not have permission to do that.');
        }
    });
});
