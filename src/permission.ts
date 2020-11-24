import { Guild, GuildMember } from 'discord.js';

import config from './config';

export const ensureRole = async (guild: Guild): Promise<void> => {
    const role = guild.roles.cache.find((role) => role.name === config.djRole);
    if (role) {
        return;
    }

    await guild.roles.create({ data: { name: config.djRole } });
};

export const hasPermission = (member: GuildMember): boolean => {
    return member.roles.cache.find((role) => role.name === config.djRole) !== undefined;
};
