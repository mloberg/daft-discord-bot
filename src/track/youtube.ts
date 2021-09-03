import { AudioResource, createAudioResource, demuxProbe } from '@discordjs/voice';
import { raw as ytdl } from 'youtube-dl-exec';
import { getBasicInfo } from 'ytdl-core';

import { Track } from '../types';

export default class implements Track {
    constructor(public readonly url: string) {}

    async getTitle(): Promise<string> {
        const info = await getBasicInfo(this.url);
        return info.videoDetails.title;
    }

    createAudioResource(): Promise<AudioResource<Track>> {
        return new Promise((resolve, reject) => {
            const process = ytdl(
                this.url,
                {
                    o: '-',
                    q: '',
                    f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
                    r: '100K',
                },
                { stdio: ['ignore', 'pipe', 'ignore'] },
            );
            if (!process.stdout) {
                return reject(new Error('No stdout'));
            }
            const stream = process.stdout;
            const onError = (error: Error) => {
                if (!process.killed) process.kill();
                stream.resume();
                reject(error);
            };
            process
                .once('spawn', () => {
                    demuxProbe(stream)
                        .then((probe) =>
                            resolve(createAudioResource(probe.stream, { metadata: this, inputType: probe.type })),
                        )
                        .catch(onError);
                })
                .catch(onError);
        });
    }
}
