import { Client, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import db from '../db';
import { FriendlyError } from '../error';
import logger from '../logger';
import { hasPermission } from '../permission';
import player from '../player';
import command from './add';

const mocks = {
    react: jest.fn(),
    logError: mocked(logger.error),
    player: mocked(player),
    permission: mocked(hasPermission),
};

jest.mock('discord.js', () => ({
    Message: jest.fn().mockImplementation(() => ({
        member: { guild: { id: 'test' } },
        react: mocks.react,
    })),
}));

jest.mock('../logger');
jest.mock('../player');
jest.mock('../permission');

describe('_add', () => {
    let message: Message;

    beforeEach(() => {
        mocks.react.mockClear();
        mocks.logError.mockClear();
        mocks.player.supports.mockClear();
        mocks.player.getTitle.mockClear();
        mocks.permission.mockClear();

        const client = {} as Client;
        const channel = {} as TextChannel;
        message = new Message(client, {}, channel);
    });

    afterEach(async () => {
        await db.$executeRaw`DELETE FROM tags`;
        await db.$executeRaw`DELETE FROM songs`;
        await db.$disconnect();
    });

    it('is a command', () => {
        expect(command.name).toBe('add');
        expect(command).toMatchSnapshot();
    });

    it('adds a file to the manager with a title', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);
        mocks.player.getTitle.mockResolvedValue('Testing');

        await command.run(message, { _: ['test.mp3', 'foo', 'bar'], $0: 'add' });
        expect(mocks.react).toBeCalledWith('🎵');

        const songs = await db.song.findMany({ include: { tags: true } });
        expect(songs).toHaveLength(1);
        expect(songs[0]).toMatchObject({
            location: 'test.mp3',
            title: 'Testing',
            guild: 'test',
            tags: [{ tag: 'foo' }, { tag: 'bar' }],
        });
    });

    it('adds a file to the manager without a title', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);
        mocks.player.getTitle.mockResolvedValue(null);

        await command.run(message, { _: ['notitle.mp3', 'foo', 'bar'], $0: 'add' });
        expect(mocks.react).toBeCalledWith('🎵');

        const songs = await db.song.findMany({ include: { tags: true } });
        expect(songs).toHaveLength(1);
        expect(songs[0]).toMatchObject({
            location: 'notitle.mp3',
            title: null,
            guild: 'test',
            tags: [{ tag: 'foo' }, { tag: 'bar' }],
        });
    });

    it('will throw an error if no file given', async () => {
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: [], $0: 'add' })).rejects.toThrow(
            new FriendlyError('Invalid command usage: <song> [...tag]'),
        );
    });

    it('will throw an error if no tags given', async () => {
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: ['test.mp3'], $0: 'add' })).rejects.toThrow(
            new FriendlyError('Invalid command usage: <song> [...tag]'),
        );
    });

    it('will throw an error if file is unsupported', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(false);

        await expect(command.run(message, { _: ['none.mp3', 'foo', 'bar'], $0: 'add' })).rejects.toThrow(
            new FriendlyError('I was unable to add that. Unsupported type.'),
        );
    });

    it('will throw an error if cannot be added to database', async () => {
        await db.song.create({ data: { location: 'test.mp3', guild: 'test' } });

        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);
        mocks.player.getTitle.mockResolvedValue(null);

        await expect(command.run(message, { _: ['test.mp3', 'foo', 'bar'], $0: 'add' })).rejects.toThrow(
            new FriendlyError('I was unable to add that song. Does it exist already?'),
        );
    });

    it('will throw an error if user does not have role', async () => {
        mocks.permission.mockReturnValue(false);

        await expect(command.run(message, { _: ['test.mp3', 'foo', 'bar'], $0: 'add' })).rejects.toThrow(
            new FriendlyError('You do not have permission to do that.'),
        );
    });
});
