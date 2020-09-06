import fs from 'fs-extra';
import { difference } from 'lodash';

import { Dictionary } from './types';
import { env } from './utils';

interface Song {
    file: string;
    tags: string[];
}

export class Manager {
    private playlists: Dictionary<string[]> = {};

    constructor(private readonly file: string) {}

    async addSong(file: string, tags: string[]): Promise<void> {
        const songs = await this.getSongs();
        songs.push({ file, tags });
        await this.saveSongs(songs);
    }

    async findSongs(tags: string[]): Promise<string[]> {
        const songs = await this.getSongs();

        return songs.filter((s) => difference(tags, s.tags).length === 0).map((s) => s.file);
    }

    clear(guild: string, room: string): void {
        delete this.playlists[`${guild}_${room}`];
    }

    create(guild: string, room: string, songs: string[]): void {
        this.playlists[`${guild}_${room}`] = songs;
    }

    next(guild: string, room: string): string | null {
        const playlist = this.playlists[`${guild}_${room}`];
        if (!playlist) {
            return null;
        }

        return playlist.shift() || null;
    }

    private async getSongs(): Promise<Song[]> {
        return fs.existsSync(this.file) ? await fs.readJSON(this.file) : [];
    }

    private async saveSongs(songs: Song[]) {
        await fs.writeJSON(this.file, songs);
    }
}

export default new Manager(env('SONGS_FILE', 'songs.json'));
