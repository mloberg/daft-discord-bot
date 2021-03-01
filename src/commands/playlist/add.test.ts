import { Client, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import db from '../../db';
import { FriendlyError } from '../../error';
import logger from '../../logger';
import { hasPermission } from '../../permission';
import player from '../../player';
import command from './add';

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

describe('_playlist add', () => {
    let message: Message;

    beforeEach(async () => {
        mocks.react.mockClear();
        mocks.logInfo.mockClear();
        mocks.player.supports.mockClear();
        mocks.permission.mockClear();

        const client = {} as Client;
        const channel = {} as TextChannel;
        message = new Message(client, {}, channel);

        await db.playlist.create({ data: { name: 'test', guild: 'test', songs: ['test.mp3'] } });
        await db.playlist.create({ data: { name: 'empty', guild: 'test', songs: [] } });
        await db.playlist.create({ data: { name: 'foo', guild: 'another', songs: [] } });
    });

    afterEach(async () => {
        await db.$executeRaw`DELETE FROM playlists`;
        await db.$disconnect();
    });

    it('is a command', () => {
        expect(command.name).toBe('playlist add');
        expect(command).toMatchSnapshot();
    });

    it('adds songs to the end of a playlist', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);

        await command.run(message, { _: ['test', 'foo.mp3', 'bar.mp3'], $0: 'playlist add' });
        expect(mocks.react).toHaveBeenCalledWith('🎵');
        expect(mocks.player.supports).toHaveBeenCalledTimes(2);
        expect(mocks.logInfo).toHaveBeenCalledWith('Added songs to playlist test in Test Guild');

        const playlist = await db.playlist.findFirst({ where: { name: 'test' } });
        expect(playlist).toMatchObject({
            name: 'test',
            guild: 'test',
            songs: ['test.mp3', 'foo.mp3', 'bar.mp3'],
        });
    });

    it('adds songs to empty playlists', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);

        await command.run(message, { _: ['empty', 'foo.mp3'], $0: 'playlist append' });
        expect(mocks.react).toHaveBeenCalledWith('🎵');

        const playlist = await db.playlist.findFirst({ where: { name: 'empty' } });
        expect(playlist).toMatchObject({
            name: 'empty',
            guild: 'test',
            songs: ['foo.mp3'],
        });
    });

    it('throws an error if no name is given', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);

        await expect(command.run(message, { _: [], $0: 'playlist add' })).rejects.toThrow(
            new FriendlyError('I need a name for the playlist.'),
        );
    });

    it('throws an error if invalid songs are given', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(false);

        await expect(command.run(message, { _: ['test', 'foo.mp3'], $0: 'playlist add' })).rejects.toThrow(
            new FriendlyError('Cannot add to playlist. These songs are unsupported: foo.mp3'),
        );
    });

    it('throws an error if no playlist exists', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);

        await expect(command.run(message, { _: ['none', 'test.mp3'], $0: 'playlist append' })).rejects.toThrow(
            new FriendlyError("I couldn't find that playlist."),
        );
    });

    it('will not add songs to a playlist from another guild', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);

        await expect(command.run(message, { _: ['foo', 'test.mp3'], $0: 'playlist append' })).rejects.toThrow(
            new FriendlyError("I couldn't find that playlist."),
        );
    });

    it('will throw an error if user does not have role', async () => {
        mocks.permission.mockReturnValue(false);

        await expect(command.run(message, { _: ['test'], $0: 'playlist add' })).rejects.toThrow(
            new FriendlyError('You do not have permission to do that.'),
        );
    });
});
