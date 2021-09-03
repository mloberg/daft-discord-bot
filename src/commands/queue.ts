import { SlashCommandBuilder } from '@discordjs/builders';
import { AudioPlayerStatus, AudioResource } from '@discordjs/voice';
import { CommandInteraction, GuildMember } from 'discord.js';

import { FriendlyError } from '../error';
import playlists from '../playlist';
import { Track } from '../types';

export default {
    config: new SlashCommandBuilder().setName('queue').setDescription('See song queue'),
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

        const current =
            playlist.player.state.status === AudioPlayerStatus.Idle
                ? 'Nothing is currently playing.'
                : `Playing **${await (playlist.player.state.resource as AudioResource<Track>).metadata.getTitle()}**`;

        const queue = (
            await Promise.all(
                playlist.queue.slice(0, 5).map(async (track, index) => `${index + 1}) ${await track.getTitle()}`),
            )
        ).join('\n');

        await command.reply(`${current}\n\n${queue}`);
    },
};
