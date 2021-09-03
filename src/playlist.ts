import {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    entersState,
    joinVoiceChannel,
    VoiceConnection,
    VoiceConnectionDisconnectReason,
    VoiceConnectionStatus,
} from '@discordjs/voice';
import { Collection, Snowflake, StageChannel, VoiceChannel } from 'discord.js';
import { promisify } from 'util';

import { Track } from './types';

const wait = promisify(setTimeout);

type Channel = VoiceChannel | StageChannel;

export class Playlist {
    public readonly connection: VoiceConnection;
    public readonly player: AudioPlayer;
    public queue: Track[];
    private queueLock = false;
    private readyLock = false;

    constructor(channel: Channel) {
        this.connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });
        this.player = createAudioPlayer();
        this.queue = [];

        this.connection.on('stateChange', async (_, state) => {
            if (state.status === VoiceConnectionStatus.Disconnected) {
                if (state.reason === VoiceConnectionDisconnectReason.WebSocketClose && state.closeCode === 4014) {
                    try {
                        // It may have moved voice channel, which will resolve in a little bit
                        await entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000);
                    } catch {
                        // Otherwise it was probably removed from voice channel
                        this.connection.destroy();
                    }
                } else if (this.connection.rejoinAttempts < 5) {
                    await wait((this.connection.rejoinAttempts + 1) * 5_000);
                    this.connection.rejoin();
                } else {
                    this.connection.destroy();
                }
            } else if (state.status === VoiceConnectionStatus.Destroyed) {
                this.stop();
            } else if (
                !this.readyLock &&
                (state.status === VoiceConnectionStatus.Connecting || state.status === VoiceConnectionStatus.Signalling)
            ) {
                // wait for connection to become ready, timeout after 20 seconds
                this.readyLock = true;
                try {
                    await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000);
                } catch {
                    this.connection.destroy();
                } finally {
                    this.readyLock = false;
                }
            }
        });

        this.player.on('stateChange', async (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                await this.processQueue();
            } else if (newState.status === AudioPlayerStatus.Playing) {
                // If the Playing state has been entered, then a new track has started playback.
                // (newState.resource as AudioResource<Track>).metadata.onStart();
            }
        });

        this.connection.subscribe(this.player);
    }

    enqueue(track: Track): void {
        this.queue.push(track);
        void this.processQueue();
    }

    stop(): void {
        this.queueLock = true;
        this.queue = [];
        this.player.stop(true);
    }

    private async processQueue(): Promise<void> {
        if (this.queueLock || this.player.state.status !== AudioPlayerStatus.Idle) {
            return;
        }
        this.queueLock = true;

        const next = this.queue.shift();
        if (!next) {
            return this.connection.destroy();
        }

        try {
            const resource = await next.createAudioResource();
            this.player.play(resource);
            this.queueLock = false;
        } catch {
            this.queueLock = false;
            return this.processQueue();
        }
    }
}

const collection = new Collection<Snowflake, Playlist>();

export default {
    ...collection,
    get(channel: Channel): Playlist | undefined {
        const playlist = collection.get(channel.guild.id);
        if (playlist?.connection.state.status === VoiceConnectionStatus.Destroyed) {
            collection.delete(channel.id);
            return undefined;
        }

        return playlist;
    },
    connect(channel: Channel): Playlist {
        const existing = this.get(channel);
        if (existing) {
            return existing;
        }

        const playlist = new Playlist(channel);
        collection.set(channel.guild.id, playlist);
        return playlist;
    },
};
