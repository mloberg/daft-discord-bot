import { Client, Guild, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import db from '../db';
import { FriendlyError } from '../error';
import playlist from '../playlist';
import command from './tag';

const mocks = {
    react: jest.fn(),
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
        react: mocks.react,
    })),
}));

describe('_tag configuration', () => {
    it('should have basic command infomation', () => {
        expect(command.name).toEqual('tag');
        expect(command.description).toEqual('Update tags of current song');
        expect(command.usage).toEqual('[-a|--add TAG] [-r|--remove TAG]');
    });

    it('should have no aliases', () => {
        expect(command.alias).toContain('tags');
    });
});

describe('_tag', () => {
    let message: Message;
    const client = new Client();
    const guild = new Guild(client, {});
    const channel = new TextChannel(guild, {});

    beforeEach(async () => {
        mocks.react.mockClear();
        await db.song.create({
            data: {
                title: 'Test',
                location: 'test.mp3',
                tags: {
                    create: [{ tag: 'foo' }, { tag: 'bar' }, { tag: 'test' }],
                },
            },
        });

        message = new Message(client, {}, channel);
    });

    afterEach(async () => {
        playlist.clear('testing', 'daft-test');
        await db.$executeRaw`DELETE FROM tags`;
        await db.$executeRaw`DELETE FROM songs`;
        await db.$disconnect();
    });

    it('updates tags of current song', async () => {
        playlist.create('testing', 'daft-test', ['test.mp3']);
        playlist.next('testing', 'daft-test');

        await command.run(message, {
            $0: 'tag',
            _: [],
            add: ['one', 'two'],
            a: 'three',
            remove: 'foo',
            r: ['test', 'testing'],
        });
        expect(mocks.react).toBeCalledWith('🎵');

        const song = await db.song.findOne({
            where: { location: 'test.mp3' },
            include: { tags: true },
        });
        const tags = song?.tags.map((t) => t.tag);

        expect(tags).toHaveLength(4);
        expect(tags).toContain('one');
        expect(tags).toContain('two');
        expect(tags).toContain('three');
        expect(tags).toContain('bar');
    });

    it('throws an error if no song is currently playing', async () => {
        try {
            await command.run(message, { $0: 'tag', _: [] });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('Nothing is currently playing');
        }
    });

    it('throws error if song not in database', async () => {
        playlist.create('testing', 'daft-test', ['foo.mp3']);
        playlist.next('testing', 'daft-test');

        try {
            await command.run(message, { $0: 'tag', _: [] });
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
            await command.run(message, { $0: 'tag', _: [] });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('You are not in a voice channel');
        }
    });
});
