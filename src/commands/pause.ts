import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember } from 'discord.js';

import { FriendlyError } from '../error';
import playlists from '../playlist';

export default {
    config: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the song currently playing')
        .setDefaultPermission(false),
    async handle(command: CommandInteraction): Promise<void> {
        if (!(command.member instanceof GuildMember)) {
            throw new FriendlyError('You do not have permission to do that.');
        }

        const channel = command.member.voice.channel;
        if (!channel) {
            throw new FriendlyError('Join a voice channel and then try that again!');
        }

        const playlist = playlists.get(channel);
        if (!playlist) {
            throw new FriendlyError('Nothing playing in this guild.');
        }

        playlist.player.pause();
        await command.reply({ content: 'Paused', ephemeral: true });
    },
};
