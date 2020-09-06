import { Client, Guild, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import { FriendlyError } from '../error';
import Playlist from '../playlist';
import command from './add';

const mocks = {
    react: jest.fn(),
    playlist: mocked(Playlist),
};

jest.mock('discord.js', () => {
    return {
        Client: jest.fn(),
        Guild: jest.fn(),
        TextChannel: jest.fn(),
        Message: jest.fn().mockImplementation(() => {
            return {
                react: mocks.react,
            };
        }),
    };
});

jest.mock('../playlist');

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

    it('adds a file to the manager', async () => {
        await command.run(message, { _: [__filename, 'foo', 'bar'] });

        expect(mocks.playlist.addSong).toHaveBeenCalledTimes(1);
        expect(mocks.playlist.addSong).toHaveBeenCalledWith(__filename, ['foo', 'bar']);

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
            await command.run(message, { _: [__filename] });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('Invalid command usage: [song] [...tag]');
        }
    });

    it('will throw an error if file does not exist', async () => {
        try {
            await command.run(message, { _: ['foo', 'bar'] });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('Could not find file. I only support local files for now.');
        }
    });
});
