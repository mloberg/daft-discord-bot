import { Client, Guild, Message, TextChannel } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import { FriendlyError } from '../error';
import command from './resume';

const mocks = {
    react: jest.fn(),
    join: jest.fn(),
    resume: jest.fn(),
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
                                        resume: mocks.resume,
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

describe('_resume configuration', () => {
    it('should have basic command infomation', () => {
        expect(command.name).toEqual('resume');
        expect(command.description).toEqual('Resume the playlist');
    });

    it('should have no aliases', () => {
        expect(command.alias).toBeUndefined();
    });
});

describe('_resume', () => {
    const client = new Client();
    const guild = new Guild(client, {});
    const channel = new TextChannel(guild, {});

    beforeEach(() => {
        mocks.react.mockClear();
        mocks.react.mockReturnThis();
        mocks.join.mockClear();
        mocks.resume.mockClear();
    });

    it('resumes current song', async () => {
        const message = new Message(client, {}, channel);

        await command.run(message, { _: [], $0: 'resume' });

        expect(mocks.resume).toHaveBeenCalledTimes(1);
        expect(mocks.react).toBeCalledWith('🎶');
    });

    it('will not resume if not playing', async () => {
        const message = new Message(client, {}, channel);
        mocks.join.mockReturnValue({ dispatcher: null });

        await command.run(message, { _: [], $0: 'resume' });

        expect(mocks.resume).toHaveBeenCalledTimes(0);
        expect(mocks.react).toHaveBeenCalledTimes(0);
    });

    it('will throw an error if not in a voice channel', async () => {
        (mocked(Message) as jest.Mock).mockImplementationOnce(() => {
            return { member: { voice: { channe: null } } };
        });
        const message = new Message(client, {}, channel);

        try {
            await command.run(message, { _: [], $0: 'resume' });
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('You are not in a voice channel');
        }
    });
});
