import { Client, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import db from '../../db';
import { FriendlyError } from '../../error';
import { hasPermission } from '../../permission';
import command from './list';

const mocks = {
    reply: jest.fn(),
    permission: mocked(hasPermission),
};

jest.mock('discord.js', () => ({
    Message: jest.fn().mockImplementation(() => ({
        reply: mocks.reply,
        member: { guild: { id: 'test' } },
    })),
}));

jest.mock('../../permission');

describe('_playlist list', () => {
    const client = {} as Client;
    const channel = {} as TextChannel;

    beforeEach(async () => {
        mocks.reply.mockClear();
        mocks.permission.mockClear();

        await db.playlist.create({ data: { name: 'test', guild: 'test', songs: ['test.mp3', 'foo.mp3'] } });
        await db.playlist.create({ data: { name: 'Playlist One', guild: 'test', songs: [] } });
        await db.playlist.create({ data: { name: 'Another Playlist', guild: 'foo', songs: [] } });
    });

    afterEach(async () => {
        await db.$executeRaw`DELETE FROM playlists`;
        await db.$disconnect();
    });

    it('is a command', () => {
        expect(command.name).toBe('playlist list');
        expect(command).toMatchSnapshot();
    });

    it('returns a list of playlists', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: [], $0: 'playlist list' });
        expect(mocks.reply).toHaveBeenCalledWith('test, Playlist One');
    });

    it('returns a list of songs in a playlist', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: ['test'], $0: 'playlist list' });
        expect(mocks.reply).toHaveBeenCalledWith('test.mp3, foo.mp3');
    });

    it('will throw an error if playlist does not exist', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: ['none'], $0: 'playlist list' })).rejects.toThrow(
            new FriendlyError("I couldn't find that playlist."),
        );
    });

    it('will throw an error if does not have role', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(false);

        await expect(command.run(message, { _: [], $0: 'playlist list' })).rejects.toThrow(
            new FriendlyError('You do not have permission to do that.'),
        );
    });
});
