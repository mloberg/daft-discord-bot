import { Client, Guild, Message, TextChannel } from 'discord.js';
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
    Client: jest.fn(),
    Guild: jest.fn(),
    TextChannel: jest.fn(),
    Message: jest.fn().mockImplementation(() => ({
        reply: mocks.reply,
        guild: {
            id: 'foo',
        },
        member: {},
    })),
}));

jest.mock('../permission');

describe('_list configuration', () => {
    it('should have basic command infomation', () => {
        expect(command.name).toEqual('list');
        expect(command.description).toEqual('Show available song tags');
    });

    it('should have no aliases', () => {
        expect(command.alias).toBeUndefined();
    });
});

describe('_play', () => {
    const client = new Client();
    const guild = new Guild(client, {});
    const channel = new TextChannel(guild, {});

    beforeEach(async () => {
        mocks.reply.mockClear();
        mocks.permission.mockClear();

        await db.song.create({
            data: {
                location: 'foo.mp3',
                tags: {
                    create: [{ tag: 'foo' }],
                },
            },
        });
        await db.song.create({
            data: {
                location: 'bar.mp3',
                guild: 'foo',
                tags: {
                    create: [{ tag: 'bar' }],
                },
            },
        });
        await db.song.create({
            data: {
                location: 'test.mp3',
                guild: 'foo',
                tags: {
                    create: [{ tag: 'foo' }, { tag: 'bar' }],
                },
            },
        });
        await db.song.create({
            data: {
                location: 'external.mp3',
                guild: 'bar',
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

    it('returns a list of available tags', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: [], $0: 'list' });

        expect(mocks.reply).toHaveBeenCalledWith('bar (2), foo (2)');
    });

    it('will throw an error if no songs were found', async () => {
        await db.$executeRaw`DELETE FROM tags`;
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        try {
            await command.run(message, { _: [], $0: 'list' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('No tags found. Try adding some songs first.');
        }
    });

    it('will throw an error if does not have role', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(false);

        try {
            await command.run(message, { _: [], $0: 'listq' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('You do not have permission to do that.');
        }
    });
});
