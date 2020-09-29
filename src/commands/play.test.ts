import { Client, Guild, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import db from '../db';
import { FriendlyError } from '../error';
import playlist from '../playlist';
import Next from './next';
import command from './play';

const mocks = {
    next: mocked(Next),
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

jest.mock('./next');

describe('_play configuration', () => {
    it('should have basic command infomation', () => {
        expect(command.name).toEqual('play');
        expect(command.description).toEqual('Start a playlist');
        expect(command.usage).toEqual('[...TAGS] [--volume|-v VOLUME]');
    });

    it('should have an alias', () => {
        expect(command.alias).toEqual(['start']);
    });
});

describe('_play', () => {
    const client = new Client();
    const guild = new Guild(client, {});
    const channel = new TextChannel(guild, {});

    beforeEach(async () => {
        mocks.next.run.mockClear();

        await db.song.create({
            data: {
                title: 'Foo',
                location: 'foo.mp3',
                tags: {
                    create: [{ tag: 'foo' }],
                },
            },
        });
        await db.song.create({
            data: {
                title: 'Bar',
                location: 'bar.mp3',
                tags: {
                    create: [{ tag: 'bar' }],
                },
            },
        });
        await db.song.create({
            data: {
                title: 'Test',
                location: 'test.mp3',
                tags: {
                    create: [{ tag: 'foo' }, { tag: 'bar' }],
                },
            },
        });
    });

    afterEach(async () => {
        playlist.clear('testing', 'daft-test');
        await db.$executeRaw`DELETE FROM tags`;
        await db.$executeRaw`DELETE FROM songs`;
        await db.$disconnect();
    });

    it('starts a new playlist', async () => {
        const message = new Message(client, {}, channel);

        await command.run(message, { _: ['foo'], $0: 'play' });

        const songs = playlist.queue('testing', 'daft-test');
        expect(songs).toHaveLength(2);
        expect(songs).toContain('foo.mp3');
        expect(songs).toContain('test.mp3');

        expect(mocks.next.run).toHaveBeenCalledTimes(1);
        expect(mocks.next.run).toHaveBeenCalledWith(message, { _: ['foo'], $0: 'play' });
    });

    it('will only play songs with all tags', async () => {
        const message = new Message(client, {}, channel);

        await command.run(message, { _: ['foo', 'bar'], $0: 'play' });

        const songs = playlist.queue('testing', 'daft-test');
        expect(songs).toHaveLength(1);
        expect(songs).toContain('test.mp3');

        expect(mocks.next.run).toHaveBeenCalledTimes(1);
        expect(mocks.next.run).toHaveBeenCalledWith(message, { _: ['foo', 'bar'], $0: 'play' });
    });

    it('will throw an error if no songs were found', async () => {
        const message = new Message(client, {}, channel);

        try {
            await command.run(message, { _: ['none'], $0: 'play' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('No songs matching "none" were found');
        }
    });

    it('will throw an error if not in a voice channel', async () => {
        (mocked(Message) as jest.Mock).mockImplementationOnce(() => {
            return { member: { voice: { channe: null } } };
        });
        const message = new Message(client, {}, channel);

        try {
            await command.run(message, { _: [], $0: 'play' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('You are not in a voice channel');
        }
    });
});
