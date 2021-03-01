import { Client, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import { FriendlyError } from '../error';
import { hasPermission } from '../permission';
import command from './volume';

const mocks = {
    react: jest.fn(),
    join: jest.fn(),
    setVolume: jest.fn(),
    permission: mocked(hasPermission),
};

jest.mock('discord.js', () => ({
    Message: jest.fn().mockImplementation(() => ({
        member: {
            voice: {
                channel: {
                    join: mocks.join.mockImplementation(() => ({
                        dispatcher: {
                            setVolume: mocks.setVolume,
                        },
                    })),
                },
            },
        },
        react: mocks.react,
    })),
}));

jest.mock('../permission');

describe('_volume', () => {
    const client = {} as Client;
    const channel = {} as TextChannel;

    beforeEach(() => {
        mocks.react.mockClear();
        mocks.join.mockClear();
        mocks.setVolume.mockClear();
        mocks.permission.mockClear();
    });

    it('is a command', () => {
        expect(command.name).toBe('volume');
        expect(command).toMatchSnapshot();
    });

    it('sets the volume', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: ['50'], $0: 'volume' });

        expect(mocks.setVolume).toHaveBeenCalledTimes(1);
        expect(mocks.setVolume).toHaveBeenCalledWith(0.5);
        expect(mocks.react).toBeCalledWith('🎶');
    });

    it("won't set volume over 100", async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: ['150'], $0: 'volume' });

        expect(mocks.setVolume).toHaveBeenCalledTimes(1);
        expect(mocks.setVolume).toHaveBeenCalledWith(1);
        expect(mocks.react).toBeCalledWith('🎶');
    });

    it('defaults to 100% volume', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await command.run(message, { _: [], $0: 'volume' });

        expect(mocks.setVolume).toHaveBeenCalledTimes(1);
        expect(mocks.setVolume).toHaveBeenCalledWith(1);
        expect(mocks.react).toBeCalledWith('🎶');
    });

    it('will not set volume if not playing', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);
        mocks.join.mockReturnValue({ dispatcher: null });

        await command.run(message, { _: [], $0: 'volume' });

        expect(mocks.setVolume).toHaveBeenCalledTimes(0);
        expect(mocks.react).toHaveBeenCalledTimes(0);
    });

    it('will throw an error if not in a voice channel', async () => {
        (mocked(Message) as jest.Mock).mockImplementationOnce(() => {
            return { member: { voice: { channe: null } } };
        });
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(true);

        await expect(command.run(message, { _: [], $0: 'volume' })).rejects.toThrow(
            new FriendlyError('You are not in a voice channel.'),
        );
    });

    it('will throw an error if does not have role', async () => {
        const message = new Message(client, {}, channel);
        mocks.permission.mockReturnValue(false);

        await expect(command.run(message, { _: [], $0: 'volume' })).rejects.toThrow(
            new FriendlyError('You do not have permission to do that.'),
        );
    });
});
