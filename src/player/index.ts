import { StreamDispatcher, StreamOptions, VoiceConnection } from 'discord.js';

import { Player as PlayerInterface } from '../types';
import LocalFile from './local';

export class Player implements PlayerInterface {
    private players: PlayerInterface[];

    constructor(...players: PlayerInterface[]) {
        this.players = players;
    }

    play(location: string, connection: VoiceConnection, options: StreamOptions = {}): Promise<StreamDispatcher> {
        const player = this.players.find((player) => player.supports(location));
        if (!player) {
            throw new Error(`Could not find player for ${location}`);
        }

        return player.play(location, connection, options);
    }

    getTitle(location: string): Promise<string | null> {
        const player = this.players.find((player) => player.supports(location));
        if (!player) {
            throw new Error(`Could not find player for ${location}`);
        }

        return player.getTitle(location);
    }

    supports(location: string): boolean {
        for (const player of this.players) {
            if (player.supports(location)) {
                return true;
            }
        }

        return false;
    }
}

export default new Player(new LocalFile());
