import { Client, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import db from '../db';
import { FriendlyError } from '../error';
import playlist from '../playlist';
import command from './playing';

const mocks = {
    reply: jest.fn(),
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
        reply: mocks.reply,
    })),
}));

describe('_playing', () => {
    let message: Message;
    const client = {} as Client;
    const channel = {} as TextChannel;

    beforeEach(() => {
        mocks.reply.mockClear();

        message = new Message(client, {}, channel);
    });

    afterEach(async () => {
        playlist.clear('testing', 'daft-test');
        await db.$executeRaw`DELETE FROM tags`;
        await db.$executeRaw`DELETE FROM songs`;
        await db.$disconnect();
    });

    it('is a command', () => {
        expect(command.name).toBe('playing');
        expect(command).toMatchSnapshot();
    });

    it('returns the title and tags of current song', async () => {
        await db.song.create({
            data: {
                title: 'Testing',
                location: 'test.mp3',
                guild: 'testing',
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

    it('returns the song location if no additional information is known', async () => {
        playlist.create('testing', 'daft-test', ['test.mp3']);
        playlist.next('testing', 'daft-test');

        await command.run(message, { _: [], $0: 'playing' });
        expect(mocks.reply).toBeCalledWith('test.mp3');
    });

    it('throws an error if no song is playing', async () => {
        await expect(command.run(message, { _: [], $0: 'playing' })).rejects.toThrow(
            new FriendlyError('Nothing is currently playing.'),
        );
    });

    it('will throw an error if not in a voice channel', async () => {
        (mocked(Message) as jest.Mock).mockImplementationOnce(() => {
            return { member: { voice: { channe: null } } };
        });
        const message = new Message(client, {}, channel);

        await expect(command.run(message, { _: [], $0: 'playing' })).rejects.toThrow(
            new FriendlyError('You are not in a voice channel.'),
        );
    });
});
