import { Client, Guild, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import db from '../db';
import { FriendlyError } from '../error';
import logger from '../logger';
import { hasPermission } from '../permission';
import player from '../player';
import command from './add';

const mocks = {
    react: jest.fn(),
    db: mocked(db, true),
    logError: mocked(logger.error),
    player: mocked(player),
    permission: mocked(hasPermission),
};

jest.mock('discord.js', () => ({
    Client: jest.fn(),
    Guild: jest.fn(),
    TextChannel: jest.fn(),
    Message: jest.fn().mockImplementation(() => ({
        member: true,
        react: mocks.react,
    })),
}));

jest.mock('../db');
jest.mock('../logger');
jest.mock('../player');
jest.mock('../permission');

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
        mocks.logError.mockClear();
        mocks.player.supports.mockClear();
        mocks.player.getTitle.mockClear();
        mocks.permission.mockClear();

        const client = new Client();
        const guild = new Guild(client, {});
        const channel = new TextChannel(guild, {});
        message = new Message(client, {}, channel);
    });

    it('adds a file to the manager with a title', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);
        mocks.player.getTitle.mockResolvedValue('Testing');

        await command.run(message, { _: ['test.mp3', 'foo', 'bar'], $0: 'add' });
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
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);
        mocks.player.getTitle.mockResolvedValue(null);

        await command.run(message, { _: ['notitle.mp3', 'foo', 'bar'], $0: 'add' });
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
        mocks.permission.mockReturnValue(true);

        try {
            await command.run(message, { _: [], $0: 'add' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('Invalid command usage: [song] [...tag]');
        }
    });

    it('will throw an error if no tags given', async () => {
        mocks.permission.mockReturnValue(true);

        try {
            await command.run(message, { _: ['test.mp3'], $0: 'add' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('Invalid command usage: [song] [...tag]');
        }
    });

    it('will throw an error if file is unsupported', async () => {
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(false);

        try {
            await command.run(message, { _: ['none.mp3', 'foo', 'bar'], $0: 'add' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('I was unable to add that. Unsupported type.');
        }
    });

    it('will throw an error if cannot be added to database', async () => {
        const dbErr = new Error('duplicate');
        mocks.db.song.create.mockRejectedValue(dbErr);
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValue(true);
        mocks.player.getTitle.mockResolvedValue(null);

        try {
            await command.run(message, { _: ['test.mp3', 'foo', 'bar'], $0: 'add' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(mocks.logError).toHaveBeenCalledTimes(1);
            expect(mocks.logError).toHaveBeenCalledWith(dbErr);
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('I was unable to add that song. Does it exist already?');
        }
    });

    it('will throw an error if user does not have role', async () => {
        mocks.permission.mockReturnValue(false);

        try {
            await command.run(message, { _: ['test.mp3', 'foo', 'bar'], $0: 'add' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('You do not have permission to do that.');
        }
    });
});
