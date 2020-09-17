import { Client, ClientVoiceManager, Guild, VoiceChannel, VoiceConnection } from 'discord.js';

import { Player } from './index';

jest.mock('discord.js', () => ({
    Client: jest.fn(),
    Guild: jest.fn(),
    ClientVoiceManager: jest.fn(),
    VoiceChannel: jest.fn(),
    VoiceConnection: jest.fn(),
}));

const one = {
    play: jest.fn(),
    getTitle: jest.fn(),
    supports: jest.fn(),
};
const two = {
    play: jest.fn(),
    getTitle: jest.fn(),
    supports: jest.fn(),
};

describe('Player', () => {
    const player = new Player(one, two);
    const client = new Client();
    const manager = new ClientVoiceManager(client);
    const guild = new Guild(client, {});
    const channel = new VoiceChannel(guild);
    const connection = new VoiceConnection(manager, channel);

    beforeEach(() => {
        one.play.mockClear();
        one.getTitle.mockClear();
        one.supports.mockClear();
        two.play.mockClear();
        two.getTitle.mockClear();
        two.supports.mockClear();
    });

    it('will call play from a supported player', () => {
        one.supports.mockReturnValue(false);
        two.supports.mockReturnValue(true);

        player.play('test.mp3', connection, { volume: 0.5 });

        expect(one.play).toHaveBeenCalledTimes(0);
        expect(two.play).toHaveBeenCalledTimes(1);
        expect(two.play).toHaveBeenCalledWith('test.mp3', connection, { volume: 0.5 });
    });

    it('will throw an error if no supported players can play', () => {
        one.supports.mockReturnValue(false);
        two.supports.mockReturnValue(false);

        try {
            player.play('test.mp3', connection);
            fail('expected error to be thrown');
        } catch (err) {
            expect(err.message).toEqual('Could not find player for test.mp3');
        }
    });

    it('will call getTitle from a supported player', () => {
        one.supports.mockReturnValue(true);
        two.supports.mockReturnValue(false);

        player.getTitle('test.mp3');

        expect(one.getTitle).toHaveBeenCalledTimes(1);
        expect(one.getTitle).toHaveBeenCalledWith('test.mp3');
        expect(two.getTitle).toHaveBeenCalledTimes(0);
    });

    it('will throw an error if no supported players can get title', () => {
        one.supports.mockReturnValue(false);
        two.supports.mockReturnValue(false);

        try {
            player.getTitle('test.mp3');
            fail('expected error to be thrown');
        } catch (err) {
            expect(err.message).toEqual('Could not find player for test.mp3');
        }
    });

    it('will return true if one player has support', () => {
        one.supports.mockReturnValue(false);
        two.supports.mockReturnValue(true);

        expect(player.supports('test.mp3')).toBe(true);
    });

    it('will return false if no supported players', () => {
        one.supports.mockReturnValue(false);
        two.supports.mockReturnValue(false);

        expect(player.supports('test.mp3')).toBe(false);
    });
});
