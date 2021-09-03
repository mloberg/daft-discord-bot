import { SlashCommandBuilder } from '@discordjs/builders';
import { entersState, VoiceConnectionStatus } from '@discordjs/voice';
import { CommandInteraction, GuildMember } from 'discord.js';

import { FriendlyError } from '../error';
import playlists from '../playlist';
import track from '../track';

export default {
    config: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Start a playlist in your current voice channel')
        .setDefaultPermission(false)
        .addStringOption((option) =>
            option.setName('songs').setDescription('List of songs to play seperated by spaces').setRequired(true),
        ),
    async handle(command: CommandInteraction): Promise<void> {
        if (!(command.member instanceof GuildMember)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        const channel = command.member.voice.channel;
        if (!channel) {
            throw new FriendlyError('Join a voice channel and then try that again!');
        }

        const playlist = playlists.connect(channel);
        try {
            await entersState(playlist.connection, VoiceConnectionStatus.Ready, 20_000);
        } catch (error) {
            throw new FriendlyError('Failed to join voice channel.');
        }

        command.options
            .getString('songs', true)
            .split(' ')
            .map(track)
            .forEach((track) => playlist.enqueue(track));

        await command.reply('Playing');
    },
};
