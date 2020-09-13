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

    it('updates an existing song', async () => {
        await manager.addSong('test.mp3', ['foo', 'bar']);
        await manager.addSong('foo.mp3', ['foo']);

        await manager.updateSong('test.mp3', ['test'], 'Testing');
        expect(await (await manager.getSongs()).find((s) => 'test.mp3' === s.file)).toEqual({
            file: 'test.mp3',
            tags: ['test'],
            title: 'Testing',
        });
    });

    it('throws an error when updating a song that does not exist', async () => {
        try {
            await manager.updateSong('test.mp3', ['test'], 'Testing');
        } catch (err) {
            expect(err.message).toEqual('Could not find song for "test.mp3"');
        }
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

    it('returns the currently playing track', async () => {
        await manager.addSong('one.mp3', ['foo'], 'One');
        manager.create('foo', 'bar', ['one.mp3', 'two.mp3']);

        expect(await manager.nowPlaying('foo', 'bar')).toBeNull();
        manager.next('foo', 'bar');
        expect(await manager.nowPlaying('foo', 'bar')).toEqual({ file: 'one.mp3', tags: ['foo'], title: 'One' });
        manager.next('foo', 'bar');
        expect(await manager.nowPlaying('foo', 'bar')).toBeNull();
    });
});
