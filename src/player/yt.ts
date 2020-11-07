import { StreamDispatcher, StreamOptions, VoiceConnection } from 'discord.js';
import ytdl from 'ytdl-core-discord';

import { Player } from '../types';

export default class YouTube implements Player {
    async play(location: string, connection: VoiceConnection, options: StreamOptions = {}): Promise<StreamDispatcher> {
        options.type = 'opus';
        return connection.play(await ytdl(location, { highWaterMark: 1 << 25 }), options);
    }

    async getTitle(location: string): Promise<string | null> {
        const info = await ytdl.getBasicInfo(location);
        return info.title;
    }

    supports(location: string): boolean {
        return ytdl.validateURL(location);
    }
}
