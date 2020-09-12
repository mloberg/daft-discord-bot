import { Client, Guild, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import { FriendlyError } from '../error';
import Playlist from '../playlist';
import command from './add';

const mocks = {
    react: jest.fn(),
    playlist: mocked(Playlist),
};

jest.mock('discord.js', () => ({
    Client: jest.fn(),
    Guild: jest.fn(),
    TextChannel: jest.fn(),
    Message: jest.fn().mockImplementation(() => {
        return {
            react: mocks.react,
        };
    }),
}));

jest.mock('../playlist');
jest.mock('fs-extra', () => ({
    existsSync: (file: string) => {
        return 'none.mp3' === file ? false : true;
    },
}));
jest.mock('child_process', () => ({
    exec: (command: string, callback: { (error: Error | null, result: { stdout: string }): void }) => {
        command.includes('notitle.mp3')
            ? callback(null, { stdout: '{}' })
            : callback(null, { stdout: '{"format": {"tags": {"title": "Testing"}}}' });
    },
}));

describe('_add configuration', () => {
    it('should have basic command infomation', () => {
        expect(command.name).toEqual('add');
        expect(command.description).toEqual('Add a song');
        expect(command.usage).toEqual('[FILE] [...TAGS]');
    });

    it('should have no aliases', () => {
        expect(command.alias).toBeUndefined();
    });
});

describe('_add', () => {
    let message: Message;

    beforeEach(() => {
        mocks.react.mockClear();
        mocks.react.mockReturnThis();
        mocks.playlist.addSong.mockClear();

        const client = new Client();
        const guild = new Guild(client, {});
        const channel = new TextChannel(guild, {});
        message = new Message(client, {}, channel);
    });

    it('adds a file to the manager with a title', async () => {
        await command.run(message, { _: ['test.mp3', 'foo', 'bar'] });

        expect(mocks.playlist.addSong).toHaveBeenCalledTimes(1);
        expect(mocks.playlist.addSong).toHaveBeenCalledWith('test.mp3', ['foo', 'bar'], 'Testing');

        expect(mocks.react).toBeCalledWith('🎵');
    });

    it('adds a file to the manager without a title', async () => {
        await command.run(message, { _: ['notitle.mp3', 'foo', 'bar'] });

        expect(mocks.playlist.addSong).toHaveBeenCalledTimes(1);
        expect(mocks.playlist.addSong).toHaveBeenCalledWith('notitle.mp3', ['foo', 'bar'], null);

        expect(mocks.react).toBeCalledWith('🎵');
    });

    it('will throw an error if no file given', async () => {
        try {
            await command.run(message, { _: [] });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('Invalid command usage: [song] [...tag]');
        }
    });

    it('will throw an error if no tags given', async () => {
        try {
            await command.run(message, { _: ['test.mp3'] });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('Invalid command usage: [song] [...tag]');
        }
    });

    it('will throw an error if file does not exist', async () => {
        try {
            await command.run(message, { _: ['none.mp3', 'foo', 'bar'] });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('Could not find file. I only support local files for now.');
        }
    });
});
