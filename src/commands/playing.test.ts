import { Client, Guild, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import { FriendlyError } from '../error';
import Playlist from '../playlist';
import command from './playing';

const mocks = {
    reply: jest.fn(),
    playlist: mocked(Playlist),
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

jest.mock('../playlist');

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
        mocks.playlist.nowPlaying.mockClear();

        message = new Message(client, {}, channel);
    });

    it('returns the title and tags of current song', async () => {
        mocks.playlist.nowPlaying.mockReturnValue(
            new Promise((resolve) => resolve({ title: 'Testing', file: 'test.mp3', tags: ['foo', 'bar'] })),
        );
        await command.run(message, { _: [] });

        expect(mocks.playlist.nowPlaying).toHaveBeenCalledTimes(1);
        expect(mocks.playlist.nowPlaying).toHaveBeenCalledWith('testing', 'daft-test');

        expect(mocks.reply).toBeCalledWith('Testing (*foo*, *bar*)', { split: true });
    });

    it('returns the filename if no title is available', async () => {
        mocks.playlist.nowPlaying.mockReturnValue(
            new Promise((resolve) => resolve({ file: 'test.mp3', tags: ['foo', 'bar'] })),
        );
        await command.run(message, { _: [] });

        expect(mocks.playlist.nowPlaying).toHaveBeenCalledTimes(1);
        expect(mocks.playlist.nowPlaying).toHaveBeenCalledWith('testing', 'daft-test');

        expect(mocks.reply).toBeCalledWith('test.mp3 (*foo*, *bar*)', { split: true });
    });

    it('throws an error if no song is playing', async () => {
        mocks.playlist.nowPlaying.mockReturnValue(new Promise((resolve) => resolve(null)));

        try {
            await command.run(message, { _: [] });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('Nothing is currently playing');
        }
    });

    it('will throw an error if not in a voice channel', async () => {
        (mocked(Message) as jest.Mock).mockImplementationOnce(() => {
            return { member: { voice: { channe: null } } };
        });
        const message = new Message(client, {}, channel);

        try {
            await command.run(message, { _: [] });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('You are not in a voice channel');
        }
    });
});
