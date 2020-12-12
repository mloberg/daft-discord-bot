import { StreamDispatcher, StreamOptions, VoiceConnection } from 'discord.js';
import prism from 'prism-media';
import ytdl from 'ytdl-core';

import { FriendlyError } from '../error';
import { Player } from '../types';

export const filter = (format: ytdl.videoFormat): boolean => {
    return format.codecs === 'opus' && format.container === 'webm' && format.audioSampleRate === '48000';
};

const canDemux = (info: ytdl.videoInfo) => {
    return info.formats.find(filter) && info.videoDetails.lengthSeconds !== '0';
};

export default class YouTube implements Player {
    async play(location: string, connection: VoiceConnection, options: StreamOptions = {}): Promise<StreamDispatcher> {
        const info = await ytdl.getInfo(location);
        const demuxer = new prism.opus.WebmDemuxer();
        const stream = ytdl
            .downloadFromInfo(info, { highWaterMark: 1 << 25, filter })
            .pipe(demuxer)
            .on('end', () => demuxer.destroy());

        return connection.play(stream, { ...options, type: 'opus' });
    }

    async getTitle(location: string): Promise<string | null> {
        const info = await ytdl.getInfo(location);
        if (!canDemux(info)) {
            throw new FriendlyError('Video is not supported.');
        }

        return info.videoDetails.title;
    }

    supports(location: string): boolean {
        return ytdl.validateURL(location);
    }
}
