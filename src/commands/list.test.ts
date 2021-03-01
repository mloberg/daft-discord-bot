import { Client, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import db from '../db';
import { FriendlyError } from '../error';
import { hasPermission } from '../permission';
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

jest.mock('../permission');

describe('_play', () => {
    const client = {} as Client;
    const channel = {} as TextChannel;

    beforeEach(async () => {
        mocks.reply.mockClear();
        mocks.permission.mockClear();

        await db.song.create({
            data: {
                location: 'foo.mp3',
                guild: 'foo',
                tags: {
                    create: [{ tag: 'foo' }],
                },
            },
        });
        await db.song.create({
            data: {
                location: 'bar.mp3',
                guild: 'test',
                tags: {
                    create: [{ tag: 'bar' }],
                },
            },
        });
        await db.song.create({
            data: {
                location: 'test.mp3',
                guild: 'test',
                tags: {
                    create: [{ tag: 'foo' }, { tag: 'bar' }],
                },
            },
        });
    });

    afterEach(async () => {
        await db.$executeRaw`DELETE FROM tags`;
        await db.$executeRaw`DELETE FROM songs`;
        await db.$disconnect();
    });

    it('is a command', () => {
        expect(command.name).toBe('list');
        expect(command).toMatchSnapshot();
    });

    it('returns a list of available tags', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: [], $0: 'list' });

        expect(mocks.reply).toHaveBeenCalledWith('bar (2), foo (1)');
    });

    it('will throw an error if no songs were found', async () => {
        await db.$executeRaw`DELETE FROM tags`;
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: [], $0: 'list' })).rejects.toThrow(
            new FriendlyError('No tags found. Try adding some songs first.'),
        );
    });

    it('will throw an error if does not have role', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(false);

        await expect(command.run(message, { _: [], $0: 'list' })).rejects.toThrow(
            new FriendlyError('You do not have permission to do that.'),
        );
    });
});
