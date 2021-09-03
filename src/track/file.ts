import { AudioResource, createAudioResource, StreamType } from '@discordjs/voice';
import { exec } from 'child_process';
import { createReadStream } from 'fs';
import { extname } from 'path';
import { promisify } from 'util';

import logger from '../logger';
import { Track } from '../types';

const shell = promisify(exec);

export default class implements Track {
    constructor(public readonly url: string) {}

    async getTitle(): Promise<string> {
        const { stdout } = await shell(`ffprobe -v quiet -print_format json -show_format -show_streams "${this.url}"`);
        logger.debug({ process: 'ffprobe', input: this.url, stdout });

        return JSON.parse(stdout).format?.tags?.title;
    }

    async createAudioResource(): Promise<AudioResource<Track>> {
        const ext = extname(this.url);

        if ('.ogg' === ext) {
            return createAudioResource(createReadStream(this.url), { inputType: StreamType.OggOpus, metadata: this });
        }

        if ('.webm' === ext) {
            return createAudioResource(createReadStream(this.url), { inputType: StreamType.WebmOpus, metadata: this });
        }

        return createAudioResource(this.url, { metadata: this });
    }
}
