import { Client, Guild, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import { FriendlyError } from '../error';
import { hasPermission } from '../permission';
import command from './pause';

const mocks = {
    react: jest.fn(),
    join: jest.fn(),
    pause: jest.fn(),
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
                    join: mocks.join.mockImplementation(() => ({
                        dispatcher: {
                            pause: mocks.pause,
                        },
                    })),
                },
            },
        },
        react: mocks.react,
    })),
}));

jest.mock('../permission');

describe('_pause configuration', () => {
    it('should have basic command infomation', () => {
        expect(command.name).toEqual('pause');
        expect(command.description).toEqual('Pause the playlist');
    });

    it('should have no aliases', () => {
        expect(command.alias).toBeUndefined();
    });
});

describe('_pause', () => {
    const client = new Client();
    const guild = new Guild(client, {});
    const channel = new TextChannel(guild, {});

    beforeEach(() => {
        mocks.react.mockClear();
        mocks.react.mockReturnThis();
        mocks.join.mockClear();
        mocks.pause.mockClear();
        mocks.permission.mockClear();
    });

    it('pauses current song', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: [], $0: 'pause' });

        expect(mocks.pause).toHaveBeenCalledTimes(1);
        expect(mocks.react).toBeCalledWith('🎶');
    });

    it('will not pause if not playing', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);
        mocks.join.mockReturnValue({ dispatcher: null });

        await command.run(message, { _: [], $0: 'pause' });

        expect(mocks.pause).toHaveBeenCalledTimes(0);
        expect(mocks.react).toHaveBeenCalledTimes(0);
    });

    it('will throw an error if not in a voice channel', async () => {
        (mocked(Message) as jest.Mock).mockImplementationOnce(() => {
            return { member: { voice: { channe: null } } };
        });
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        try {
            await command.run(message, { _: [], $0: 'pause' });
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
            await command.run(message, { _: [], $0: 'pause' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('You do not have permission to do that.');
        }
    });
});
