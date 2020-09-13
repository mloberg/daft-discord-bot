import fs from 'fs-extra';
import { difference } from 'lodash';

import config from './config';
import { Dictionary } from './types';

interface Song {
    title?: string;
    file: string;
    tags: string[];
}

export class Manager {
    private playing: Dictionary<string | null> = {};
    private playlists: Dictionary<string[]> = {};

    constructor(private readonly file: string) {}

    async addSong(file: string, tags: string[], title?: string): Promise<void> {
        const songs = await this.getSongs();
        songs.push({ title, file, tags });
        await this.saveSongs(songs);
    }

    async findSongs(tags: string[]): Promise<string[]> {
        const songs = await this.getSongs();

        return songs.filter((s) => difference(tags, s.tags).length === 0).map((s) => s.file);
    }

    async updateSong(file: string, tags: string[], title?: string): Promise<void> {
        const songs = await this.getSongs();
        const index = songs.findIndex((s) => file === s.file);
        if (-1 === index) {
            throw new Error(`Could not find song for "${file}"`);
        }

        songs[index].title = title;
        songs[index].tags = tags;

        await this.saveSongs(songs);
    }

    clear(guild: string, room: string): void {
        const key = `${guild}_${room}`;
        delete this.playlists[key];
        delete this.playing[key];
    }

    create(guild: string, room: string, songs: string[]): void {
        this.playlists[`${guild}_${room}`] = songs;
    }

    next(guild: string, room: string): string | null {
        const key = `${guild}_${room}`;
        const playlist = this.playlists[key];
        if (!playlist) {
            return null;
        }

        return (this.playing[key] = playlist.shift() || null);
    }

    async nowPlaying(guild: string, room: string): Promise<Song | null> {
        const playing = this.playing[`${guild}_${room}`];
        if (!playing) {
            return null;
        }

        return (await this.getSongs()).find((s) => playing === s.file) || null;
    }

    async getSongs(): Promise<Song[]> {
        return fs.existsSync(this.file) ? await fs.readJSON(this.file) : [];
    }

    private async saveSongs(songs: Song[]) {
        await fs.writeJSON(this.file, songs);
    }
}

export default new Manager(config.dataFile);
