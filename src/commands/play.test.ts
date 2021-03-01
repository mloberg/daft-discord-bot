import { Client, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import db from '../db';
import { FriendlyError } from '../error';
import { hasPermission } from '../permission';
import Player from '../player';
import playlist from '../playlist';
import Next from './next';
import command from './play';

const mocks = {
    next: mocked(Next),
    permission: mocked(hasPermission),
    player: mocked(Player),
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
                },
            },
        },
    })),
}));

jest.mock('./next');
jest.mock('../permission');
jest.mock('../player');

describe('_play', () => {
    const client = {} as Client;
    const channel = {} as TextChannel;

    beforeEach(async () => {
        mocks.next.run.mockClear();
        mocks.permission.mockClear();
        mocks.player.supports.mockClear();

        await db.song.create({
            data: {
                title: 'Foo',
                location: 'foo.mp3',
                guild: 'testing',
                tags: {
                    create: [{ tag: 'foo' }],
                },
            },
        });
        await db.song.create({
            data: {
                title: 'Bar',
                location: 'bar.mp3',
                guild: 'testing',
                tags: {
                    create: [{ tag: 'bar' }],
                },
            },
        });
        await db.song.create({
            data: {
                title: 'Test',
                location: 'test.mp3',
                guild: 'testing',
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

    it('is a command', () => {
        expect(command.name).toBe('play');
        expect(command).toMatchSnapshot();
    });

    it('starts a new playlist', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: ['foo'], $0: 'play' });

        const songs = playlist.queue('testing', 'daft-test');
        expect(songs).toHaveLength(2);
        expect(songs).toContain('foo.mp3');
        expect(songs).toContain('test.mp3');

        expect(mocks.player.supports).toHaveBeenCalledTimes(1);
        expect(mocks.next.run).toHaveBeenCalledTimes(1);
        expect(mocks.next.run).toHaveBeenCalledWith(message, { _: ['foo'], $0: 'play' });
    });

    it('will only play songs with all tags', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: ['foo', 'bar'], $0: 'play' });

        const songs = playlist.queue('testing', 'daft-test');
        expect(songs).toHaveLength(1);
        expect(songs).toContain('test.mp3');

        expect(mocks.next.run).toHaveBeenCalledTimes(1);
        expect(mocks.next.run).toHaveBeenCalledWith(message, { _: ['foo', 'bar'], $0: 'play' });
    });

    it('supports passing songs directly', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValueOnce(true);

        await command.run(message, { _: ['/song.mp3'], $0: 'play' });

        const songs = playlist.queue('testing', 'daft-test');
        expect(songs).toHaveLength(1);
        expect(songs).toContain('/song.mp3');
    });

    it('will throw an error if no songs were found', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: ['none'], $0: 'play' })).rejects.toThrow(
            new FriendlyError('No songs matching "none" were found.'),
        );
    });

    it('will throw an error if not in a voice channel', async () => {
        (mocked(Message) as jest.Mock).mockImplementationOnce(() => {
            return { member: { voice: { channe: null } } };
        });
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: [], $0: 'play' })).rejects.toThrow(
            new FriendlyError('You are not in a voice channel.'),
        );
    });

    it('will throw an error if does not have role', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(false);

        await expect(command.run(message, { _: [], $0: 'play' })).rejects.toThrow(
            new FriendlyError('You do not have permission to do that.'),
        );
    });
});
