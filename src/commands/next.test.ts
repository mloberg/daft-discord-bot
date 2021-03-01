import { Client, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import { FriendlyError } from '../error';
import Logger from '../logger';
import { hasPermission } from '../permission';
import Player from '../player';
import Playlist from '../playlist';
import command from './next';

const mocks = {
    react: jest.fn(),
    connection: jest.fn(),
    disconnect: jest.fn(),
    dispatcher: jest.fn(),
    playlist: mocked(Playlist),
    logger: mocked(Logger, true),
    logError: mocked(Logger.error),
    logDebug: mocked(Logger.debug),
    player: mocked(Player),
    permission: mocked(hasPermission),
};

jest.mock('discord.js', () => ({
    Message: jest.fn().mockImplementation(() => ({
        member: {
            guild: {
                id: 'testing',
            },
            voice: {
                channel: {
                    name: 'daft-test',
                    join: mocks.connection.mockImplementation(() => ({
                        disconnect: mocks.disconnect,
                    })),
                },
            },
        },
        react: mocks.react,
    })),
}));

jest.mock('../logger');
jest.mock('../player');
jest.mock('../playlist');
jest.mock('../permission');

describe('_next', () => {
    const client = {} as Client;
    const channel = {} as TextChannel;

    beforeEach(() => {
        mocks.react.mockClear();
        mocks.connection.mockClear();
        mocks.disconnect.mockClear();
        mocks.dispatcher.mockClear();
        mocks.playlist.next.mockClear();
        mocks.logError.mockClear();
        mocks.logDebug.mockClear();
        mocks.player.play.mockClear();
        mocks.permission.mockClear();

        (mocks.player.play as jest.Mock).mockResolvedValue({
            on: mocks.dispatcher,
        });
    });

    it('is a command', () => {
        expect(command.name).toBe('next');
        expect(command).toMatchSnapshot();
    });

    it('plays the next song', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);
        mocks.playlist.next.mockReturnValue(__filename);

        await command.run(message, { _: [], $0: 'next' });
        expect(mocks.react).toHaveBeenCalledTimes(1);
        expect(mocks.react).toHaveBeenCalledWith('🎶');
        expect(mocks.playlist.next).toHaveBeenCalledTimes(1);
        expect(mocks.playlist.next).toHaveBeenCalledWith('testing', 'daft-test');
        expect(mocks.player.play).toHaveBeenCalledTimes(1);
        expect(mocks.player.play).toHaveBeenCalledWith(__filename, mocks.connection(), { volume: 1 });
        expect(mocks.logDebug).toHaveBeenCalledWith(`Playing ${__filename}`);

        expect(mocks.dispatcher).toHaveBeenCalledTimes(2);
        const [error, errorFunc] = mocks.dispatcher.mock.calls[0];
        expect(error).toEqual('error');
        expect(mocks.disconnect).toHaveBeenCalledTimes(0);
        const err = new Error('foo');
        err.stack = 'error stack';
        errorFunc(err);
        expect(mocks.logError).toHaveBeenCalledTimes(1);
        expect(mocks.logError).toHaveBeenLastCalledWith(
            { guild: 'testing', room: 'daft-test', stack: 'error stack', type: 'Error' },
            'foo',
        );
        expect(mocks.disconnect).toHaveBeenCalledTimes(1);

        const [finish, finishFunc] = mocks.dispatcher.mock.calls[1];
        expect(finish).toEqual('finish');
        await finishFunc();
        expect(mocks.playlist.next).toHaveBeenCalledTimes(2);
    });

    it('will set volume of next song', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);
        mocks.playlist.next.mockReturnValue(__filename);

        await command.run(message, { $0: 'next', _: [], volume: '50' });
        expect(mocks.react).toHaveBeenCalledTimes(1);
        expect(mocks.react).toHaveBeenCalledWith('🎶');
        expect(mocks.player.play).toHaveBeenCalledTimes(1);
        expect(mocks.player.play).toHaveBeenCalledWith(__filename, mocks.connection(), { volume: 0.5 });
    });

    it('will disconnect if no more songs in playlist', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);
        mocks.playlist.next.mockReturnValue(null);

        await command.run(message, { _: [], $0: 'next' });
        expect(mocks.react).toHaveBeenCalledTimes(0);

        expect(mocks.playlist.next).toHaveBeenCalledTimes(1);
        expect(mocks.playlist.next).toHaveBeenCalledWith('testing', 'daft-test');

        expect(mocks.disconnect).toHaveBeenCalledTimes(1);
        expect(mocks.dispatcher).toHaveBeenCalledTimes(0);
        expect(mocks.react).toHaveBeenCalledTimes(0);
    });

    it('will throw an error if not in a voice channel', async () => {
        (mocked(Message) as jest.Mock).mockImplementationOnce(() => {
            return { member: { voice: { channel: null } } };
        });
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: [], $0: 'next' })).rejects.toThrow(
            new FriendlyError('You are not in a voice channel.'),
        );
    });

    it('will throw an error if does not have role', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(false);

        await expect(command.run(message, { _: [], $0: 'next' })).rejects.toThrow(
            new FriendlyError('You do not have permission to do that.'),
        );
    });
});
