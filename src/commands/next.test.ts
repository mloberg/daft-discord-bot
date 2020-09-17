import { Client, Guild, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import { FriendlyError } from '../error';
import Logger from '../logger';
import Player from '../player';
import Playlist from '../playlist';
import command from './next';

const mocks = {
    react: jest.fn(),
    connection: jest.fn(),
    disconnect: jest.fn(),
    dispatcher: jest.fn(),
    playlist: mocked(Playlist),
    logger: mocked(Logger),
    player: mocked(Player),
};

jest.mock('discord.js', () => {
    return {
        Client: jest.fn(),
        Guild: jest.fn(),
        TextChannel: jest.fn(),
        Message: jest.fn().mockImplementation(() => ({
            member: {
                voice: {
                    channel: {
                        guild: {
                            name: 'testing',
                        },
                        name: 'daft-test',
                        join: mocks.connection.mockImplementation(() => ({
                            disconnect: mocks.disconnect,
                        })),
                    },
                },
            },
            react: mocks.react,
        })),
    };
});

jest.mock('../logger');
jest.mock('../player');
jest.mock('../playlist');

describe('_next configuration', () => {
    it('should have basic command infomation', () => {
        expect(command.name).toEqual('next');
        expect(command.description).toEqual('Play the next song in the playlist');
        expect(command.usage).toEqual('[--volume|-v VOLUME]');
    });

    it('should have an alias', () => {
        expect(command.alias).toEqual(['skip']);
    });
});

describe('_next', () => {
    const client = new Client();
    const guild = new Guild(client, {});
    const channel = new TextChannel(guild, {});

    beforeEach(() => {
        mocks.react.mockClear();
        mocks.connection.mockClear();
        mocks.disconnect.mockClear();
        mocks.dispatcher.mockClear();
        mocks.playlist.next.mockClear();
        mocks.logger.error.mockClear();
        mocks.logger.debug.mockClear();
        mocks.player.play.mockClear();

        (mocks.player.play as jest.Mock).mockResolvedValue({
            on: mocks.dispatcher,
        });
    });

    it('plays the next song', async () => {
        const message = new Message(client, {}, channel);
        mocks.playlist.next.mockReturnValue(__filename);

        await command.run(message, { _: [] });
        expect(mocks.react).toHaveBeenCalledTimes(1);
        expect(mocks.react).toHaveBeenCalledWith('🎶');
        expect(mocks.playlist.next).toHaveBeenCalledTimes(1);
        expect(mocks.playlist.next).toHaveBeenCalledWith('testing', 'daft-test');
        expect(mocks.player.play).toHaveBeenCalledTimes(1);
        expect(mocks.player.play).toHaveBeenCalledWith(__filename, mocks.connection(), { volume: 1 });
        expect(mocks.logger.debug).toHaveBeenCalledWith(`Playing ${__filename}`);

        expect(mocks.dispatcher).toHaveBeenCalledTimes(2);
        const [error, errorFunc] = mocks.dispatcher.mock.calls[0];
        expect(error).toEqual('error');
        expect(mocks.disconnect).toHaveBeenCalledTimes(0);
        const err = new Error('foo');
        err.stack = 'error stack';
        errorFunc(err);
        expect(mocks.logger.error).toHaveBeenCalledTimes(1);
        expect(mocks.logger.error).toHaveBeenLastCalledWith(
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
        mocks.playlist.next.mockReturnValue(__filename);

        await command.run(message, { _: [], volume: '50' });
        expect(mocks.react).toHaveBeenCalledTimes(1);
        expect(mocks.react).toHaveBeenCalledWith('🎶');
        expect(mocks.player.play).toHaveBeenCalledTimes(1);
        expect(mocks.player.play).toHaveBeenCalledWith(__filename, mocks.connection(), { volume: 0.5 });
    });

    it('will disconnect if no more songs in playlist', async () => {
        const message = new Message(client, {}, channel);
        mocks.playlist.next.mockReturnValue(null);

        await command.run(message, { _: [] });
        expect(mocks.react).toHaveBeenCalledTimes(0);

        expect(mocks.playlist.next).toHaveBeenCalledTimes(1);
        expect(mocks.playlist.next).toHaveBeenCalledWith('testing', 'daft-test');

        expect(mocks.disconnect).toHaveBeenCalledTimes(1);
        expect(mocks.dispatcher).toHaveBeenCalledTimes(0);
        expect(mocks.react).toHaveBeenCalledTimes(0);
    });

    it('will throw an error if not in a voice channel', async () => {
        (mocked(Message) as jest.Mock).mockImplementationOnce(() => {
            return { member: { voice: { channe: null } } };
        });
        const message = new Message(client, {}, channel);

        try {
            await command.run(message, { _: [] });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('You are not in a voice channel');
        }
    });
});
