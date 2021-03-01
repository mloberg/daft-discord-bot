import { Client, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import db from '../../db';
import { FriendlyError } from '../../error';
import { hasPermission } from '../../permission';
import Player from '../../player';
import playlist from '../../playlist';
import Next from '../next';
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

jest.mock('../next');
jest.mock('../../permission');
jest.mock('../../player');

describe('_playlist play', () => {
    const client = {} as Client;
    const channel = {} as TextChannel;

    beforeEach(async () => {
        mocks.next.run.mockClear();
        mocks.permission.mockClear();
        mocks.player.supports.mockClear();

        await db.playlist.create({ data: { name: 'test', guild: 'testing', songs: ['foo.mp3', 'bar.mp3'] } });
        await db.playlist.create({ data: { name: 'awesome playlist', guild: 'foo', songs: ['test.mp3'] } });
    });

    afterEach(async () => {
        playlist.clear('testing', 'daft-test');
        await db.$executeRaw`DELETE FROM playlists`;
        await db.$disconnect();
    });

    it('is a command', () => {
        expect(command.name).toBe('playlist play');
        expect(command).toMatchSnapshot();
    });

    it('plays a playlist', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: ['test'], $0: 'playlist play' });

        const songs = playlist.queue('testing', 'daft-test');
        expect(songs).toEqual(['foo.mp3', 'bar.mp3']);

        expect(mocks.next.run).toHaveBeenCalledTimes(1);
        expect(mocks.next.run).toHaveBeenCalledWith(message, { _: [], $0: 'playlist play' });
    });

    it('shuffles a playlist', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: ['test'], $0: 'playlist start', shuffle: true });

        const songs = playlist.queue('testing', 'daft-test');
        expect(songs).toHaveLength(2);
        expect(songs).toContain('foo.mp3');
        expect(songs).toContain('bar.mp3');

        expect(mocks.next.run).toHaveBeenCalledTimes(1);
        expect(mocks.next.run).toHaveBeenCalledWith(message, { _: [], $0: 'playlist start', shuffle: true });
    });

    it('will throw an error if no playlist is given', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: [], $0: 'playlist play' })).rejects.toThrow(
            new FriendlyError('Give me a playlist to play.'),
        );
    });

    it('will throw an error if no playlist was found', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: ['none'], $0: 'playlist play' })).rejects.toThrow(
            new FriendlyError("I couldn't find that playlist."),
        );
    });

    it('will not play a playlist from another guild', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: ['awesome playlist'], $0: 'playlist play' })).rejects.toThrow(
            new FriendlyError("I couldn't find that playlist."),
        );
    });

    it('will throw an error if not in a voice channel', async () => {
        (mocked(Message) as jest.Mock).mockImplementationOnce(() => {
            return { member: { voice: { channe: null } } };
        });
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: [], $0: 'playlist play' })).rejects.toThrow(
            new FriendlyError('You are not in a voice channel.'),
        );
    });

    it('will throw an error if does not have role', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(false);

        await expect(command.run(message, { _: [], $0: 'playlist play' })).rejects.toThrow(
            new FriendlyError('You do not have permission to do that.'),
        );
    });
});
