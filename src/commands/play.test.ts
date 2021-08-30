import { Client, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import { FriendlyError } from '../error';
import { hasPermission } from '../permission';
import Player from '../player';
import playlist from '../playlist';
import Next from './next';
import command from './play';

const mocks = {
    next: mocked(Next),
    permission: mocked(hasPermission),
    player: mocked(Player),
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
    })),
}));

jest.mock('./next');
jest.mock('../permission');
jest.mock('../player');

describe('_play', () => {
    const client = {} as Client;
    const channel = {} as TextChannel;

    beforeEach(() => {
        mocks.next.run.mockClear();
        mocks.permission.mockClear();
        mocks.player.supports.mockClear();
    });

    afterEach(() => {
        playlist.clear('testing', 'daft-test');
    });

    it('is a command', () => {
        expect(command.name).toBe('play');
        expect(command).toMatchSnapshot();
    });

    it('supports passing songs directly', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);
        mocks.player.supports.mockReturnValueOnce(true);

        await command.run(message, { _: ['/song.mp3'], $0: 'play' });

        const songs = playlist.queue('testing', 'daft-test');
        expect(songs).toHaveLength(1);
        expect(songs).toContain('/song.mp3');
    });

    it('will throw an error if no songs were found', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: ['none', 'test'], $0: 'play' })).rejects.toThrow(
            new FriendlyError("I don't know how to play _none_, _test_."),
        );
    });

    it('will throw an error if not in a voice channel', async () => {
        (mocked(Message) as jest.Mock).mockImplementationOnce(() => {
            return { member: { voice: { channe: null } } };
        });
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: [], $0: 'play' })).rejects.toThrow(
            new FriendlyError('You are not in a voice channel.'),
        );
    });

    it('will throw an error if does not have role', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(false);

        await expect(command.run(message, { _: [], $0: 'play' })).rejects.toThrow(
            new FriendlyError('You do not have permission to do that.'),
        );
    });
});
