import { env } from './utils';

describe('env', () => {
    it('returns the value of an environment variable', () => {
        expect(env('NODE_ENV', '')).toEqual('test');
    });

    it('returns a default if no environment variable is set', () => {
        expect(env('FOOBARBAZ', 'hello world')).toEqual('hello world');
    });
});
