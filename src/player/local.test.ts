import { Client, ClientVoiceManager, Guild, VoiceChannel, VoiceConnection } from 'discord.js';
import fs from 'fs';
import { mocked } from 'ts-jest/utils';

import logger from '../logger';
import LocalFile from './local';

const mockPlay = jest.fn();
const mockFs = mocked(fs);

jest.mock('discord.js', () => ({
    Client: jest.fn(),
    Guild: jest.fn(),
    ClientVoiceManager: jest.fn(),
    VoiceChannel: jest.fn(),
    VoiceConnection: jest.fn().mockImplementation(() => ({
        play: mockPlay,
    })),
}));
jest.mock('fs');
jest.mock('child_process', () => ({
    exec: (command: string, callback: { (error: Error | null, result: { stdout: string }): void }) => {
        command.includes('notitle.mp3')
            ? callback(null, { stdout: '{}' })
            : callback(null, { stdout: '{"format": {"tags": {"title": "Testing"}}}' });
    },
}));
jest.mock('../logger');

describe('LocalFile Player', () => {
    const player = new LocalFile();
    const client = new Client();
    const manager = new ClientVoiceManager(client);
    const guild = new Guild(client, {});
    const channel = new VoiceChannel(guild);
    const connection = new VoiceConnection(manager, channel);

    beforeEach(() => {
        mockPlay.mockReset();
        mockPlay.mockReturnThis();
        mockFs.createReadStream.mockClear();
    });

    it('plays ogg files', async () => {
        (mockFs.createReadStream as jest.Mock).mockReturnValue('__stream__');
        const dispatcher = await player.play('test.ogg', connection);

        expect(dispatcher).toEqual(connection);
        expect(mockPlay).toHaveBeenCalledTimes(1);
        expect(mockPlay).toHaveBeenCalledWith('__stream__', { type: 'ogg/opus' });
        expect(mockFs.createReadStream).toHaveBeenCalledWith('test.ogg');
    });

    it('plays webm files', async () => {
        (mockFs.createReadStream as jest.Mock).mockReturnValue('__stream__');
        const dispatcher = await player.play('test.webm', connection, { volume: 0.5 });

        expect(dispatcher).toEqual(connection);
        expect(mockPlay).toHaveBeenCalledTimes(1);
        expect(mockPlay).toHaveBeenCalledWith('__stream__', { type: 'webm/opus', volume: 0.5 });
        expect(mockFs.createReadStream).toHaveBeenCalledWith('test.webm');
    });

    it('fallbacks with any other filetype', async () => {
        const dispatcher = await player.play('test.mp3', connection, { volume: 0.5 });

        expect(dispatcher).toEqual(connection);
        expect(mockPlay).toHaveBeenCalledTimes(1);
        expect(mockPlay).toHaveBeenCalledWith('test.mp3', { volume: 0.5 });
        expect(mockFs.createReadStream).toHaveBeenCalledTimes(0);
    });

    it('fetches the song title with ffprobe', async () => {
        expect(await player.getTitle('test.mp3')).toEqual('Testing');
        expect(mocked(logger).debug).toHaveBeenCalledWith({
            process: 'ffprobe',
            input: 'test.mp3',
            stdout: '{"format": {"tags": {"title": "Testing"}}}',
        });
        expect(await player.getTitle('notitle.mp3')).toEqual(null);
        expect(mocked(logger).debug).toHaveBeenCalledWith({ process: 'ffprobe', input: 'notitle.mp3', stdout: '{}' });
    });

    it('supports local files', () => {
        mockFs.existsSync.mockReturnValueOnce(true);
        expect(player.supports(__filename)).toBe(true);
        expect(mockFs.existsSync).toHaveBeenCalledWith(__filename);

        mockFs.existsSync.mockReturnValueOnce(false);
        expect(player.supports('none.test')).toBe(false);
        expect(mockFs.existsSync).toHaveBeenCalledWith('none.test');
    });
});
