import { SlashCommandBuilder } from '@discordjs/builders';
import { AudioResource } from '@discordjs/voice';
import { CommandInteraction } from 'discord.js';

export interface SlashCommand {
    config: SlashCommandBuilder;
    handle: (command: CommandInteraction) => Promise<void>;
}

export interface Track {
    url: string;
    getTitle(): Promise<string | undefined>;
    createAudioResource(): Promise<AudioResource<Track>>;
}
