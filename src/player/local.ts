import { exec } from 'child_process';
import { StreamDispatcher, StreamOptions, VoiceConnection } from 'discord.js';
import { createReadStream, existsSync } from 'fs';
import { extname } from 'path';
import { promisify } from 'util';

import logger from '../logger';
import { Player } from '../types';

const shell = promisify(exec);

export default class LocalFile implements Player {
    async play(location: string, connection: VoiceConnection, options: StreamOptions = {}): Promise<StreamDispatcher> {
        const ext = extname(location);

        if ('.ogg' === ext) {
            return connection.play(createReadStream(location), { ...options, type: 'ogg/opus' });
        }

        if ('.webm' === ext) {
            return connection.play(createReadStream(location), { ...options, type: 'webm/opus' });
        }

        return connection.play(location, options);
    }

    async getTitle(location: string): Promise<string | null> {
        const { stdout } = await shell(`ffprobe -v quiet -print_format json -show_format -show_streams "${location}"`);
        logger.debug({ process: 'ffprobe', input: location, stdout });

        return JSON.parse(stdout).format?.tags?.title || null;
    }

    supports(location: string): boolean {
        return existsSync(location);
    }
}
