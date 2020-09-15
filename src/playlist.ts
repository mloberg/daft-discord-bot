import { Dictionary } from './types';

export class Manager {
    private playing: Dictionary<string | null> = {};
    private playlists: Dictionary<string[]> = {};

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

    nowPlaying(guild: string, room: string): string | null {
        return this.playing[`${guild}_${room}`] || null;
    }

    queue(guild: string, room: string): string[] {
        return this.playlists[`${guild}_${room}`] || [];
    }
}

export default new Manager();
