import { Message, MessageReaction, StreamDispatcher, StreamOptions, VoiceConnection } from 'discord.js';
import { Arguments } from 'yargs';

export interface Dictionary<T> {
    [key: string]: T;
}

export interface Command {
    name: string;
    description: string;
    alias?: string[];
    usage?: string;
    examples?: string[];
    run(message: Message, args: Arguments): Promise<Message | Message[] | MessageReaction | void>;
}

export interface Player {
    play(location: string, connection: VoiceConnection, options?: StreamOptions): Promise<StreamDispatcher>;
    getTitle(location: string): Promise<string | null>;
    supports(location: string): boolean;
}
