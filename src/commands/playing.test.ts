import { Client, Guild, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import db from '../db';
import { FriendlyError } from '../error';
import playlist from '../playlist';
import command from './playing';

const mocks = {
    reply: jest.fn(),
};

jest.mock('discord.js', () => ({
    Client: jest.fn(),
    Guild: jest.fn(),
    TextChannel: jest.fn(),
    Message: jest.fn().mockImplementation(() => ({
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
        reply: mocks.reply,
    })),
}));

describe('_playing configuration', () => {
    it('should have basic command infomation', () => {
        expect(command.name).toEqual('playing');
        expect(command.description).toEqual('Show the currently playing song');
        expect(command.usage).toBeUndefined();
    });

    it('should have no aliases', () => {
        expect(command.alias).toContain('now-playing');
        expect(command.alias).toContain('nowPlaying');
    });
});

describe('_playing', () => {
    let message: Message;
    const client = new Client();
    const guild = new Guild(client, {});
    const channel = new TextChannel(guild, {});

    beforeEach(() => {
        mocks.reply.mockClear();
        mocks.reply.mockReturnThis();

        message = new Message(client, {}, channel);
    });

    afterEach(async () => {
        playlist.clear('testing', 'daft-test');
        await db.$executeRaw`DELETE FROM tags`;
        await db.$executeRaw`DELETE FROM songs`;
        await db.$disconnect();
    });

    it('returns the title and tags of current song', async () => {
        await db.song.create({
            data: {
                title: 'Testing',
                location: 'test.mp3',
                tags: {
                    create: [{ tag: 'foo' }, { tag: 'bar' }],
                },
            },
        });
        playlist.create('testing', 'daft-test', ['test.mp3']);
        playlist.next('testing', 'daft-test');

        await command.run(message, { _: [], $0: 'playing' });
        expect(mocks.reply).toBeCalledWith('Testing - test.mp3 (*foo*, *bar*)');
    });

    it('throws an error if no song is playing', async () => {
        try {
            await command.run(message, { _: [], $0: 'playing' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('Nothing is currently playing');
        }
    });

    it('throws an error if no song is found in the database', async () => {
        playlist.create('testing', 'daft-test', ['test.mp3']);
        playlist.next('testing', 'daft-test');

        try {
            await command.run(message, { _: [], $0: 'playing' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('I was unable to find that song');
        }
    });

    it('will throw an error if not in a voice channel', async () => {
        (mocked(Message) as jest.Mock).mockImplementationOnce(() => {
            return { member: { voice: { channe: null } } };
        });
        const message = new Message(client, {}, channel);

        try {
            await command.run(message, { _: [], $0: 'playing' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('You are not in a voice channel');
        }
    });
});
