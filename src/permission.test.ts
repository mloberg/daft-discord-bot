import { Client, Guild, GuildMember } from 'discord.js';
import { mocked } from 'ts-jest/utils';

import { ensureRole, hasPermission } from './permission';

const { Collection } = jest.requireActual('discord.js');
const roles = new Collection();

jest.mock('discord.js', () => ({
    Guild: jest.fn().mockImplementation(() => ({
        roles: {
            create: jest.fn(),
            cache: roles,
        },
    })),
}));

describe('ensureRole', () => {
    const client = {} as Client;
    const guild = new Guild(client, {});

    beforeEach(() => {
        roles.clear();
        mocked(guild, true).roles.create.mockClear();
    });

    it('creates role in guild', async () => {
        roles.set('foo', { name: 'foo ' });

        await ensureRole(guild);
        expect(guild.roles.create).toHaveBeenCalledWith({ data: { name: 'daft-dj' } });
    });

    it('does not create role if exists', async () => {
        roles.set('daft-dj', { name: 'daft-dj' });

        await ensureRole(guild);
        expect(guild.roles.create).not.toHaveBeenCalled();
    });
});

describe('hasPermission', () => {
    const member = { roles: { cache: roles } } as GuildMember;

    beforeEach(() => {
        roles.clear();
    });

    it('checks if user has dj role', () => {
        roles.set('daft-dj', { name: 'daft-dj' });

        expect(hasPermission(member)).toBe(true);
    });

    it('returns false if member does not have role', () => {
        roles.set('daft-dj', { name: 'foo' });

        expect(hasPermission(member)).toBe(false);
    });
});
