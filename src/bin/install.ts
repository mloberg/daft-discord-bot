/* eslint-disable no-process-exit */

import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { APIApplicationCommand, APIGuild, APIPartialGuild, Routes } from 'discord-api-types/v9';

import commands from '../commands';
import config from '../config';
import logger from '../logger';

const clientID = config.clientID;
if (!clientID) {
    logger.fatal('CLIENT_ID environment variable is required to install application (/) commands.');
    process.exit(1);
}

class API {
    private rest: REST;

    constructor(token: string, private readonly clientID: string, private readonly guildID?: string) {
        this.rest = new REST({ version: '9' }).setToken(token);
    }

    async list(): Promise<APIApplicationCommand[]> {
        const route = this.guildID
            ? Routes.applicationGuildCommands(this.clientID, this.guildID)
            : Routes.applicationCommands(this.clientID);

        return (await this.rest.get(route)) as APIApplicationCommand[];
    }

    async install(commands: SlashCommandBuilder[]): Promise<APIApplicationCommand[]> {
        const route = this.guildID
            ? Routes.applicationGuildCommands(this.clientID, this.guildID)
            : Routes.applicationCommands(this.clientID);
        const body = commands.map((command) => command.toJSON());

        return (await this.rest.put(route, { body })) as APIApplicationCommand[];
    }

    async uninstall(command: APIApplicationCommand): Promise<void> {
        const route = command.guild_id
            ? Routes.applicationGuildCommand(this.clientID, command.guild_id, command.id)
            : Routes.applicationCommand(this.clientID, command.id);

        await this.rest.delete(route);
    }

    async permission(command: string, guildID: string, user: string, permission = true): Promise<void> {
        const route = Routes.applicationCommandPermissions(this.clientID, guildID, command);
        const body = { permissions: [{ id: user, type: 2, permission }] };

        await this.rest.put(route, { body });
    }

    async guilds(): Promise<string[]> {
        const guilds = (await this.rest.get(Routes.userGuilds())) as APIPartialGuild[];
        return guilds.map((guild) => guild.id);
    }

    async guild(guildID: string): Promise<APIGuild> {
        return (await this.rest.get(Routes.guild(guildID))) as APIGuild;
    }
}

(async () => {
    const api = new API(config.token, clientID, config.guildID);

    try {
        if (process.argv.includes('--uninstall')) {
            for (const command of await api.list()) {
                logger.info(
                    { id: command.id, command: command.name, guild: command.guild_id },
                    'Deleting application (/) command',
                );
                await api.uninstall(command);
            }
            return;
        }

        logger.info({ guild: config.guildID, commands: [...commands.keys()] }, 'Installing application (/) commands');
        const installed = await api.install(commands.map((command) => command.config));

        const guilds = config.guildID ? [config.guildID] : await api.guilds();

        for (const guild of guilds) {
            const info = await api.guild(guild);
            logger.info({ guild: info.name, owner: info.owner_id }, 'Giving permissions to application (/) commands');
            for (const command of installed) {
                await api.permission(command.id, info.id, info.owner_id);
            }
        }
    } catch (error) {
        logger.fatal(error as Error);
        process.exit(1);
    }
})();
