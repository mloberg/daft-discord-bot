import { Client, ClientVoiceManager, Guild, VoiceChannel, VoiceConnection } from 'discord.js';
import prism from 'prism-media';
import { mocked } from 'ts-jest/utils';
import ytdl from 'ytdl-core';

import { FriendlyError } from '../error';
import Player, { filter } from './yt';

const mockPlay = jest.fn();
const mockYt = mocked(ytdl, true);
const mockPrism = mocked(prism.opus.WebmDemuxer);

jest.mock('discord.js', () => ({
    Client: jest.fn(),
    Guild: jest.fn(),
    ClientVoiceManager: jest.fn(),
    VoiceChannel: jest.fn(),
    VoiceConnection: jest.fn().mockImplementation(() => ({
        play: mockPlay,
    })),
}));
jest.mock('prism-media', () => ({
    opus: {
        WebmDemuxer: jest.fn().mockImplementation(() => mockPrism),
    },
}));
jest.mock('ytdl-core');

describe('yt player', () => {
    const player = new Player();
    const client = new Client();
    const manager = new ClientVoiceManager(client);
    const guild = new Guild(client, {});
    const channel = new VoiceChannel(guild);
    const connection = new VoiceConnection(manager, channel);

    beforeEach(() => {
        mockPlay.mockClear();
        mockPlay.mockReturnThis();
        mockYt.mockClear();
        mockYt.getBasicInfo.mockClear();
        mockYt.validateURL.mockClear();
        mockPrism.mockClear();
    });

    it('plays from a url', async () => {
        const stream = {
            pipe: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
        };
        (mockYt.getInfo as jest.Mock).mockResolvedValue({ title: 'foo' });
        (mockYt.downloadFromInfo as jest.Mock).mockReturnValue(stream);
        const dispatcher = await player.play('http://example.com/play', connection);

        expect(dispatcher).toEqual(connection);
        expect(mockPlay).toHaveBeenCalledTimes(1);
        expect(mockPlay).toHaveBeenCalledWith(stream, { type: 'opus' });
        expect(mockYt.getInfo).toHaveBeenCalledWith('http://example.com/play');
        expect(mockYt.downloadFromInfo).toHaveBeenCalledWith({ title: 'foo' }, { highWaterMark: 1 << 25, filter });
        expect(stream.pipe).toHaveBeenCalledWith(mockPrism);
    });

    it('gets the title from a url', async () => {
        (mockYt.getInfo as jest.Mock).mockResolvedValue({
            videoDetails: {
                title: 'Testing',
                lengthSeconds: '100',
            },
            formats: [
                {
                    codecs: 'opus',
                    container: 'webm',
                    audioSampleRate: '48000',
                },
            ],
        });
        const title = await player.getTitle('http://example.com/play');
        expect(title).toEqual('Testing');
        expect(mockYt.getInfo).toHaveBeenCalledWith('http://example.com/play');
    });

    it('throws an error on non opus streams', async () => {
        (mockYt.getInfo as jest.Mock).mockResolvedValue({
            videoDetails: {
                title: 'Testing',
                lengthSeconds: '10',
            },
            formats: [],
        });

        try {
            await player.getTitle('http://example.com/play');
            fail('expected error to be thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(FriendlyError);
            expect(err.message).toEqual('Video is not supported.');
        }

        expect(mockYt.getInfo).toHaveBeenCalledWith('http://example.com/play');
    });

    it('checks for support of a url', async () => {
        mockYt.validateURL.mockReturnValueOnce(true);
        expect(player.supports('http://example.com/play')).toBe(true);
        expect(mockYt.validateURL).toHaveBeenCalledWith('http://example.com/play');

        mockYt.validateURL.mockReturnValueOnce(false);
        expect(player.supports('test.mp3')).toBe(false);
        expect(mockYt.validateURL).toHaveBeenCalledWith('test.mp3');
    });
});
