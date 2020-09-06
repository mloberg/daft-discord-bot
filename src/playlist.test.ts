import fs from 'fs';

import { Manager } from './playlist';

describe('Manager', () => {
    const manager = new Manager('test.json');

    afterEach(() => {
        if (fs.existsSync('test.json')) {
            fs.unlinkSync('test.json');
        }
    });

    it('adds a song', async () => {
        await manager.addSong('test.mp3', ['foo', 'bar']);

        const content = fs.readFileSync('test.json').toString();
        expect(content).toMatchSnapshot();
    });

    it('finds songs matching tags', async () => {
        await manager.addSong('test.mp3', ['foo', 'bar']);
        await manager.addSong('foo.mp3', ['foo']);
        await manager.addSong('bar.mp3', ['bar']);

        expect(await manager.findSongs(['foo'])).toEqual(['test.mp3', 'foo.mp3']);
        expect(await manager.findSongs(['bar'])).toEqual(['test.mp3', 'bar.mp3']);
        expect(await manager.findSongs(['foo', 'bar'])).toEqual(['test.mp3']);
        expect(await manager.findSongs(['testing'])).toEqual([]);
    });

    it('clears a playlist', () => {
        manager.create('foo', 'bar', ['test.mp3']);
        manager.clear('foo', 'bar');
        expect(manager.next('foo', 'bar')).toEqual(null);
    });

    it('creates a playlist', () => {
        manager.create('foo', 'bar', ['test.mp3']);
        expect(manager.next('foo', 'bar')).toEqual('test.mp3');
    });

    it('fetches the next song in the playlist', () => {
        manager.create('foo', 'bar', ['one.mp3', 'two.mp3']);

        expect(manager.next('foo', 'bar')).toEqual('one.mp3');
        expect(manager.next('foo', 'bar')).toEqual('two.mp3');
        expect(manager.next('foo', 'bar')).toEqual(null);
    });
});
