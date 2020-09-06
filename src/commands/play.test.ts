import { Client, Guild, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import { FriendlyError } from '../error';
import Playlist from '../playlist';
import Next from './next';
import command from './play';

const mocks = {
    next: mocked(Next),
    playlist: mocked(Playlist),
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
                        },
                    },
                },
            };
        }),
    };
});

jest.mock('../playlist');
jest.mock('./next');

describe('_play configuration', () => {
    it('should have basic command infomation', () => {
        expect(command.name).toEqual('play');
        expect(command.description).toEqual('Start a playlist');
        expect(command.usage).toEqual('[...TAGS]');
    });

    it('should have an alias', () => {
        expect(command.alias).toEqual(['start']);
    });
});

describe('_play', () => {
    const client = new Client();
    const guild = new Guild(client, {});
    const channel = new TextChannel(guild, {});

    beforeEach(() => {
        mocks.playlist.clear.mockClear();
        mocks.playlist.findSongs.mockClear();
        mocks.playlist.create.mockClear();
        mocks.next.run.mockClear();
    });

    it('starts a new playlist', async () => {
        const message = new Message(client, {}, channel);
        mocks.playlist.findSongs.mockReturnValue(
            new Promise((resolve) => {
                resolve(['foo.mp3', 'bar.mp3']);
            }),
        );

        await command.run(message, { _: [] });

        expect(mocks.playlist.clear).toHaveBeenCalledTimes(1);
        expect(mocks.playlist.clear).toHaveBeenCalledWith('testing', 'daft-test');

        expect(mocks.playlist.create).toHaveBeenCalledTimes(1);
        const songs = mocks.playlist.create.mock.calls[0][2];
        expect(songs).toHaveLength(2);
        expect(songs).toContain('foo.mp3');
        expect(songs).toContain('bar.mp3');

        expect(mocks.next.run).toHaveBeenCalledTimes(1);
        expect(mocks.next.run).toHaveBeenCalledWith(message, { _: [] });
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
