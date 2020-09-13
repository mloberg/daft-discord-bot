import { Client, Guild, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import { FriendlyError } from '../error';
import Playlist from '../playlist';
import command from './tag';

const mocks = {
    react: jest.fn(),
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
        react: mocks.react,
    })),
}));

jest.mock('../playlist');

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

describe('_playing', () => {
    let message: Message;
    const client = new Client();
    const guild = new Guild(client, {});
    const channel = new TextChannel(guild, {});

    beforeEach(() => {
        mocks.react.mockClear();
        mocks.playlist.nowPlaying.mockClear();
        mocks.playlist.updateSong.mockClear();

        message = new Message(client, {}, channel);
    });

    it('updates tags of current song', async () => {
        mocks.playlist.nowPlaying.mockReturnValue(
            new Promise((resolve) => resolve({ title: 'Testing', file: 'test.mp3', tags: ['foo', 'bar', 'test'] })),
        );
        await command.run(message, { _: [], add: ['one', 'two'], a: 'three', remove: 'foo', r: ['test', 'testing'] });

        expect(mocks.playlist.nowPlaying).toHaveBeenCalledTimes(1);
        expect(mocks.playlist.nowPlaying).toHaveBeenCalledWith('testing', 'daft-test');

        expect(mocks.playlist.updateSong).toHaveBeenCalledTimes(1);
        expect(mocks.playlist.updateSong).toHaveBeenCalledWith('test.mp3', ['bar', 'one', 'two', 'three'], 'Testing');

        expect(mocks.react).toBeCalledWith('🎵');
    });

    it('throws an error if no song is currently playing', async () => {
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
