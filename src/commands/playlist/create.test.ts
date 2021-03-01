import { Client, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import db from '../../db';
import { FriendlyError } from '../../error';
import logger from '../../logger';
import { hasPermission } from '../../permission';
import player from '../../player';
import command from './create';

const mocks = {
    react: jest.fn(),
    logInfo: mocked(logger.info),
    player: mocked(player),
    permission: mocked(hasPermission),
};

jest.mock('discord.js', () => ({
    Message: jest.fn().mockImplementation(() => ({
        member: { guild: { id: 'test', name: 'Test Guild' } },
        react: mocks.react,
    })),
}));

jest.mock('../../logger');
jest.mock('../../player');
jest.mock('../../permission');

describe('_playlist create', () => {
    let message: Message;

    beforeEach(() => {
        mocks.react.mockClear();
        mocks.logInfo.mockClear();
        mocks.player.supports.mockClear();
        mocks.permission.mockClear();

        const client = {} as Client;
        const channel = {} as TextChannel;
        message = new Message(client, {}, channel);
    });

    afterEach(async () => {
        await db.$executeRaw`DELETE FROM playlists`;
        await db.$disconnect();
    });

    it('is a command', () => {
        expect(command.name).toBe('playlist create');
        expect(command).toMatchSnapshot();
    });

    it('creates a playlist with the given songs', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);

        await command.run(message, { _: ['Test Playlist', 'foo.mp3', 'bar.mp3'], $0: 'playlist create' });
        expect(mocks.react).toHaveBeenCalledWith('🎵');
        expect(mocks.player.supports).toHaveBeenCalledTimes(2);
        expect(mocks.logInfo).toHaveBeenCalledWith('Created playlist Test Playlist in Test Guild');

        const playlists = await db.playlist.findMany();
        expect(playlists).toHaveLength(1);
        expect(playlists[0]).toMatchObject({
            name: 'Test Playlist',
            guild: 'test',
            songs: ['foo.mp3', 'bar.mp3'],
        });
    });

    it('can create empty playlists', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);

        await command.run(message, { _: ['Test Playlist'], $0: 'playlist create' });
        expect(mocks.react).toHaveBeenCalledWith('🎵');

        const playlists = await db.playlist.findMany();
        expect(playlists).toHaveLength(1);
        expect(playlists[0]).toMatchObject({
            name: 'Test Playlist',
            guild: 'test',
            songs: [],
        });
    });

    it('throws an error if no name is given', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);

        await expect(command.run(message, { _: [], $0: 'playlist new' })).rejects.toThrow(
            new FriendlyError('I need a name for the playlist.'),
        );
    });

    it('throws an error if invalid songs are given', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(false);

        await expect(command.run(message, { _: ['test', 'foo.mp3'], $0: 'playlist new' })).rejects.toThrow(
            new FriendlyError('Cannot create playlist. These songs are unsupported: foo.mp3'),
        );
    });

    it('throws an error if a playlist with the same name already exists', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);

        await db.playlist.create({ data: { name: 'test', guild: 'test', songs: [] } });

        await expect(command.run(message, { _: ['test'], $0: 'playlist new' })).rejects.toThrow(
            new FriendlyError('There is already a playlist with that name.'),
        );
    });

    it('will throw an error if user does not have role', async () => {
        mocks.permission.mockReturnValue(false);

        await expect(command.run(message, { _: ['test'], $0: 'playlist create' })).rejects.toThrow(
            new FriendlyError('You do not have permission to do that.'),
        );
    });
});
