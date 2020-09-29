import { Client, Guild, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import { FriendlyError } from '../error';
import command from './volume';

const mocks = {
    react: jest.fn(),
    join: jest.fn(),
    setVolume: jest.fn(),
};

jest.mock('discord.js', () => {
    return {
        Client: jest.fn(),
        Guild: jest.fn(),
        TextChannel: jest.fn(),
        Message: jest.fn().mockImplementation(() => {
            return {
                member: {
                    voice: {
                        channel: {
                            join: mocks.join.mockImplementation(() => {
                                return {
                                    dispatcher: {
                                        setVolume: mocks.setVolume,
                                    },
                                };
                            }),
                        },
                    },
                },
                react: mocks.react,
            };
        }),
    };
});

describe('_volume configuration', () => {
    it('should have basic command infomation', () => {
        expect(command.name).toEqual('volume');
        expect(command.description).toEqual('Set the playback volume');
        expect(command.usage).toEqual('[VOLUME]');
    });

    it('should have no aliases', () => {
        expect(command.alias).toBeUndefined();
    });
});

describe('_volume', () => {
    const client = new Client();
    const guild = new Guild(client, {});
    const channel = new TextChannel(guild, {});

    beforeEach(() => {
        mocks.react.mockClear();
        mocks.react.mockReturnThis();
        mocks.join.mockClear();
        mocks.setVolume.mockClear();
    });

    it('sets the volume', async () => {
        const message = new Message(client, {}, channel);

        await command.run(message, { _: ['50'], $0: 'volume' });

        expect(mocks.setVolume).toHaveBeenCalledTimes(1);
        expect(mocks.setVolume).toHaveBeenCalledWith(0.5);
        expect(mocks.react).toBeCalledWith('🎶');
    });

    it("won't set volume over 100", async () => {
        const message = new Message(client, {}, channel);

        await command.run(message, { _: ['150'], $0: 'volume' });

        expect(mocks.setVolume).toHaveBeenCalledTimes(1);
        expect(mocks.setVolume).toHaveBeenCalledWith(1);
        expect(mocks.react).toBeCalledWith('🎶');
    });

    it('defaults to 100% volume', async () => {
        const message = new Message(client, {}, channel);

        await command.run(message, { _: [], $0: 'volume' });

        expect(mocks.setVolume).toHaveBeenCalledTimes(1);
        expect(mocks.setVolume).toHaveBeenCalledWith(1);
        expect(mocks.react).toBeCalledWith('🎶');
    });

    it('will not set volume if not playing', async () => {
        const message = new Message(client, {}, channel);
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

        try {
            await command.run(message, { _: [], $0: 'volume' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('You are not in a voice channel');
        }
    });
});
