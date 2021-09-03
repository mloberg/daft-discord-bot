import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import { FriendlyError } from '../error';

export default {
    config: new SlashCommandBuilder()
        .setName('dj')
        .setDescription('Allow a user to control the music for a guild')
        .setDefaultPermission(false)
        .addUserOption((option) =>
            option.setName('user').setDescription('User to give (or remove) DJ access to').setRequired(true),
        )
        .addBooleanOption((option) => option.setName('remove').setDescription('Remove DJ access from the user')),
    async handle(command: CommandInteraction): Promise<void> {
        const guild = command.guild;
        if (!guild) {
            throw new FriendlyError('This command can only be ran in a guild.');
        }

        const commands = await command.client.application?.commands.fetch();
        if (!commands) {
            throw new FriendlyError('Unable to fetch application commands.');
        }

        const user = command.options.getUser('user', true);
        if (user.id === guild.ownerId) {
            throw new FriendlyError('You cannot modify your own permissions.');
        }

        const permission = !command.options.getBoolean('remove');
        commands
            .filter((command) => !command.defaultPermission)
            .filter((command) => command.name !== 'dj')
            .each(async (command) => {
                await command.permissions.add({
                    guild: guild.id,
                    permissions: [
                        {
                            id: user.id,
                            type: 'USER',
                            permission,
                        },
                    ],
                });
            });

        await command.reply({ content: `${user.username} can now control the music for this guild`, ephemeral: true });
    },
};
