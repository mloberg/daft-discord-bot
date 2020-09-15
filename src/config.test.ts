import { schema } from './config';

describe('env.NODE_ENV', () => {
    it('defaults to production', () => {
        const { error, value } = schema.validate({});

        expect(error).toBeFalsy();
        expect(value.NODE_ENV).toEqual('production');
    });

    it('allows valid values', () => {
        expect(schema.validate({ NODE_ENV: 'development' }).error).toBeFalsy();
        expect(schema.validate({ NODE_ENV: 'test' }).error).toBeFalsy();
        expect(schema.validate({ NODE_ENV: 'production' }).error).toBeFalsy();
        expect(schema.validate({ NODE_ENV: 'PRODUCTION' }).error).toBeFalsy();
    });

    it('returns an error on invalid env', () => {
        expect(schema.validate({ NODE_ENV: 'foo' }).error?.message).toEqual(
            '"NODE_ENV" must be one of [development, test, production]',
        );
    });
});

describe('env.LOG_LEVEL', () => {
    it('defaults to info', () => {
        const { error, value } = schema.validate({});

        expect(error).toBeFalsy();
        expect(value.LOG_LEVEL).toEqual('info');
    });

    it('allows valid values', () => {
        expect(schema.validate({ LOG_LEVEL: 'error' }).error).toBeFalsy();
        expect(schema.validate({ LOG_LEVEL: 'debug' }).error).toBeFalsy();
        expect(schema.validate({ LOG_LEVEL: 'silent' }).error).toBeFalsy();
        expect(schema.validate({ LOG_LEVEL: 'INFO' }).error).toBeFalsy();
    });

    it('returns an error on invalid level', () => {
        expect(schema.validate({ LOG_LEVEL: 'foo' }).error?.message).toEqual(
            '"LOG_LEVEL" must be one of [fatal, error, warn, info, debug, trace, silent]',
        );
    });
});

describe('env.DEBUG', () => {
    it('defaults to false', () => {
        const { error, value } = schema.validate({});

        expect(error).toBeFalsy();
        expect(value.APP_DEBUG).toEqual(false);
    });

    it('allows valid values', () => {
        expect(schema.validate({ APP_DEBUG: 'true' }).error).toBeFalsy();
        expect(schema.validate({ APP_DEBUG: 'false' }).error).toBeFalsy();
        expect(schema.validate({ APP_DEBUG: 'TRUE' }).error).toBeFalsy();
        expect(schema.validate({ APP_DEBUG: 'FALSE' }).error).toBeFalsy();
    });

    it('returns an error on invalid level', () => {
        expect(schema.validate({ APP_DEBUG: 'foo' }).error?.message).toEqual('"APP_DEBUG" must be a boolean');
    });
});

describe('env.BOT_PREFIX', () => {
    it('defaults to _', () => {
        const { error, value } = schema.validate({});

        expect(error).toBeFalsy();
        expect(value.BOT_PREFIX).toEqual('_');
    });

    it('can not be @', () => {
        expect(schema.validate({ BOT_PREFIX: '@' }).error?.message).toEqual('"BOT_PREFIX" contains an invalid value');
    });
});
