import { Client, ClientVoiceManager, Guild, VoiceChannel, VoiceConnection } from 'discord.js';
import { mocked } from 'ts-jest/utils';
import ytdl from 'ytdl-core-discord';

import Player from './yt';

const mockPlay = jest.fn();
const mockYt = mocked(ytdl, true);

jest.mock('discord.js', () => ({
    Client: jest.fn(),
    Guild: jest.fn(),
    ClientVoiceManager: jest.fn(),
    VoiceChannel: jest.fn(),
    VoiceConnection: jest.fn().mockImplementation(() => ({
        play: mockPlay,
    })),
}));
jest.mock('ytdl-core-discord');

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
    });

    it('plays from a url', async () => {
        (mockYt as jest.Mock).mockReturnValue('__stream__');
        const dispatcher = await player.play('http://example.com/play', connection);

        expect(dispatcher).toEqual(connection);
        expect(mockPlay).toHaveBeenCalledTimes(1);
        expect(mockPlay).toHaveBeenCalledWith('__stream__', { type: 'opus' });
        expect(mockYt).toHaveBeenCalledWith('http://example.com/play');
    });

    it('gets the title from a url', async () => {
        (mockYt.getBasicInfo as jest.Mock).mockResolvedValue({ title: 'Testing' });
        const title = await player.getTitle('http://example.com/play');
        expect(title).toEqual('Testing');
        expect(mockYt.getBasicInfo).toHaveBeenCalledWith('http://example.com/play');
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
