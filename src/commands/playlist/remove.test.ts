import { Client, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import db from '../../db';
import { FriendlyError } from '../../error';
import logger from '../../logger';
import { hasPermission } from '../../permission';
import command from './remove';

const mocks = {
    react: jest.fn(),
    logInfo: mocked(logger.info),
    permission: mocked(hasPermission),
};

jest.mock('discord.js', () => ({
    Message: jest.fn().mockImplementation(() => ({
        member: { guild: { id: 'test', name: 'Test Guild' } },
        react: mocks.react,
    })),
}));

jest.mock('../../logger');
jest.mock('../../permission');

describe('_playlist delete', () => {
    let message: Message;

    beforeEach(async () => {
        mocks.react.mockClear();
        mocks.logInfo.mockClear();
        mocks.permission.mockClear();

        const client = {} as Client;
        const channel = {} as TextChannel;
        message = new Message(client, {}, channel);

        await db.playlist.create({ data: { name: 'test', guild: 'test', songs: [] } });
        await db.playlist.create({ data: { name: 'foo', guild: 'another', songs: [] } });
    });

    afterEach(async () => {
        await db.$executeRaw`DELETE FROM playlists`;
        await db.$disconnect();
    });

    it('is a command', () => {
        expect(command.name).toBe('playlist delete');
        expect(command).toMatchSnapshot();
    });

    it('deletes a playlist', async () => {
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: ['test'], $0: 'playlist delete' });
        expect(mocks.react).toHaveBeenCalledWith('🎵');
        expect(mocks.logInfo).toHaveBeenCalledWith('Deleted playlist test from Test Guild');

        const playlists = await db.playlist.findMany({ where: { name: 'test' } });
        expect(playlists).toHaveLength(0);
    });

    it('throws an error if no name is given', async () => {
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: [], $0: 'playlist remove' })).rejects.toThrow(
            new FriendlyError('Give me a playlist to delete.'),
        );
    });

    it('will not delete a playlist from another guild', async () => {
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: ['foo'], $0: 'playlist remove' });
        const playlists = await db.playlist.findMany({ where: { name: 'foo' } });
        expect(playlists).toHaveLength(1);
    });

    it('will throw an error if user does not have role', async () => {
        mocks.permission.mockReturnValue(false);

        await expect(command.run(message, { _: [], $0: 'playlist delete' })).rejects.toThrow(
            new FriendlyError('You do not have permission to do that.'),
        );
    });
});
