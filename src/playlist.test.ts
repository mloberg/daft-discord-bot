import { Manager } from './playlist';

describe('Manager', () => {
    it('clears a playlist', () => {
        const manager = new Manager();
        manager.create('foo', 'bar', ['test.mp3']);
        manager.clear('foo', 'bar');

        expect(manager.next('foo', 'bar')).toEqual(null);
    });

    it('creates a playlist', () => {
        const manager = new Manager();
        manager.create('foo', 'bar', ['test.mp3']);

        expect(manager.queue('foo', 'bar')).toEqual(['test.mp3']);
    });

    it('fetches the next song in the playlist', () => {
        const manager = new Manager();
        manager.create('foo', 'bar', ['one.mp3', 'two.mp3']);

        expect(manager.next('foo', 'bar')).toEqual('one.mp3');
        expect(manager.next('foo', 'bar')).toEqual('two.mp3');
        expect(manager.next('foo', 'bar')).toEqual(null);
    });

    it('returns the currently playing track', () => {
        const manager = new Manager();

        expect(manager.nowPlaying('foo', 'bar')).toBeNull();
        manager.create('foo', 'bar', ['one.mp3', 'two.mp3']);
        expect(manager.nowPlaying('foo', 'bar')).toBeNull();
        manager.next('foo', 'bar');
        expect(manager.nowPlaying('foo', 'bar')).toEqual('one.mp3');
        manager.next('foo', 'bar');
        expect(manager.nowPlaying('foo', 'bar')).toEqual('two.mp3');
        manager.next('foo', 'bar');
        expect(manager.nowPlaying('foo', 'bar')).toBeNull();
    });

    it('returns the queue', () => {
        const manager = new Manager();

        expect(manager.queue('foo', 'bar')).toEqual([]);
        manager.create('foo', 'bar', ['test.mp3']);
        expect(manager.queue('foo', 'bar')).toEqual(['test.mp3']);
        manager.next('foo', 'bar');
        expect(manager.queue('foo', 'bar')).toEqual([]);
    });
});
