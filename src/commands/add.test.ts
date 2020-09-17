import { Client, Guild, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import db from '../db';
import { FriendlyError } from '../error';
import logger from '../logger';
import player from '../player';
import command from './add';

const mocks = {
    react: jest.fn(),
    db: mocked(db, true),
    logger: mocked(logger),
    player: mocked(player),
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

jest.mock('../db');
jest.mock('../logger');
jest.mock('../player');

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
        mocks.db.song.create.mockClear();
        mocks.logger.error.mockClear();
        mocks.player.supports.mockClear();
        mocks.player.getTitle.mockClear();

        const client = new Client();
        const guild = new Guild(client, {});
        const channel = new TextChannel(guild, {});
        message = new Message(client, {}, channel);
    });

    it('adds a file to the manager with a title', async () => {
        mocks.player.supports.mockReturnValue(true);
        mocks.player.getTitle.mockResolvedValue('Testing');

        await command.run(message, { _: ['test.mp3', 'foo', 'bar'] });
        expect(mocks.react).toBeCalledWith('🎵');

        expect(mocks.db.song.create).toHaveBeenCalledTimes(1);
        expect(mocks.db.song.create).toHaveBeenCalledWith({
            data: {
                title: 'Testing',
                location: 'test.mp3',
                tags: {
                    create: [{ tag: 'foo' }, { tag: 'bar' }],
                },
            },
        });
    });

    it('adds a file to the manager without a title', async () => {
        mocks.player.supports.mockReturnValue(true);
        mocks.player.getTitle.mockResolvedValue(null);

        await command.run(message, { _: ['notitle.mp3', 'foo', 'bar'] });
        expect(mocks.react).toBeCalledWith('🎵');

        expect(mocks.db.song.create).toHaveBeenCalledTimes(1);
        expect(mocks.db.song.create).toHaveBeenCalledWith({
            data: {
                title: null,
                location: 'notitle.mp3',
                tags: {
                    create: [{ tag: 'foo' }, { tag: 'bar' }],
                },
            },
        });
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

    it('will throw an error if file is unsupported', async () => {
        mocks.player.supports.mockReturnValue(false);

        try {
            await command.run(message, { _: ['none.mp3', 'foo', 'bar'] });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('I was unable to add that. Unsupported type.');
        }
    });

    it('will throw an error if cannot be added to database', async () => {
        const dbErr = new Error('duplicate');
        mocks.db.song.create.mockRejectedValue(dbErr);
        mocks.player.supports.mockReturnValue(true);
        mocks.player.getTitle.mockResolvedValue(null);

        try {
            await command.run(message, { _: ['test.mp3', 'foo', 'bar'] });
            fail('expected error to be thrown');
        } catch (err) {
            expect(mocks.logger.error).toHaveBeenCalledTimes(1);
            expect(mocks.logger.error).toHaveBeenCalledWith(dbErr);
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('I was unable to add that song. Does it exist already?');
        }
    });
});
