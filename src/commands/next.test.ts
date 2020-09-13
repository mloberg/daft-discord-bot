import { Client, Guild, Message, TextChannel } from 'discord.js';
import { ReadStream } from 'fs';
import { mocked } from 'ts-jest/utils';

import { FriendlyError } from '../error';
import Logger from '../logger';
import Playlist from '../playlist';
import command from './next';

const mocks = {
    react: jest.fn(),
    dispatcher: jest.fn(),
    dispatcherEvent: jest.fn(),
    disconnect: jest.fn(),
    playlist: mocked(Playlist),
    logger: mocked(Logger),
};

jest.mock('discord.js', () => {
    return {
        Client: jest.fn(),
        Guild: jest.fn(),
        TextChannel: jest.fn(),
        Message: jest.fn().mockImplementation(() => {
            return {
                member: {
                    voice: {
                        channel: {
                            guild: {
                                name: 'testing',
                            },
                            name: 'daft-test',
                            async join() {
                                return {
                                    play: mocks.dispatcher.mockImplementation(() => {
                                        return {
                                            on: mocks.dispatcherEvent,
                                        };
                                    }),
                                    disconnect: mocks.disconnect,
                                };
                            },
                        },
                    },
                },
                react: mocks.react,
            };
        }),
    };
});

jest.mock('../playlist');
jest.mock('../logger');

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
        mocks.react.mockReturnThis();
        mocks.disconnect.mockClear();
        mocks.dispatcher.mockClear();
        mocks.playlist.next.mockClear();
        mocks.logger.error.mockClear();
    });

    it('plays the next song', async () => {
        const message = new Message(client, {}, channel);
        mocks.playlist.next.mockReturnValue(__filename);

        await command.run(message, { _: [] });

        expect(mocks.playlist.next).toHaveBeenCalledTimes(1);
        expect(mocks.playlist.next).toHaveBeenCalledWith('testing', 'daft-test');

        const [stream, opts] = mocks.dispatcher.mock.calls[0];

        expect(stream).toBeInstanceOf(ReadStream);
        expect((stream as ReadStream).path).toEqual(__filename);
        expect(opts).toEqual({ type: 'webm/opus', volume: 1 });

        const [error, errorFunc] = mocks.dispatcherEvent.mock.calls[0];
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

        const [finish, finishFunc] = mocks.dispatcherEvent.mock.calls[1];
        expect(finish).toEqual('finish');
        await finishFunc();
        expect(mocks.playlist.next).toHaveBeenCalledTimes(2);

        expect(mocks.react).toBeCalledWith('🎶');
    });

    it('will set volume of next song', async () => {
        const message = new Message(client, {}, channel);
        mocks.playlist.next.mockReturnValue(__filename);

        await command.run(message, { _: [], volume: '50' });

        const [stream, opts] = mocks.dispatcher.mock.calls[0];

        expect(stream).toBeInstanceOf(ReadStream);
        expect((stream as ReadStream).path).toEqual(__filename);
        expect(opts).toEqual({ type: 'webm/opus', volume: 0.5 });
    });

    it('will disconnect if no more songs in playlist', async () => {
        const message = new Message(client, {}, channel);
        mocks.playlist.next.mockReturnValue(null);

        await command.run(message, { _: [] });

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
