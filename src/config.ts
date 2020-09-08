import joi from 'joi';
import { LevelWithSilent } from 'pino';

export const schema = joi
    .object({
        NODE_ENV: joi.string().lowercase().valid('development', 'test', 'production').default('production'),
        LOG_LEVEL: joi
            .string()
            .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
            .lowercase()
            .default('info'),
        DEBUG: joi.boolean().default(false),
        SONG_FILE: joi
            .string()
            .regex(/\.json$/)
            .default('songs.json'),
        BOT_PREFIX: joi.string().invalid('@').default('_'),
        BOT_TOKEN: joi.string().presence(process.env.NODE_ENV === 'test' ? 'optional' : 'required'),
    })
    .unknown()
    .required();

const { error, value: env } = schema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

export default {
    env: env.NODE_ENV as 'development' | 'test' | 'production',
    logLevel: env.LOG_LEVEL as LevelWithSilent,
    debug: env.DEBUG as boolean,
    dataFile: env.SONG_FILE as string,
    prefix: env.BOT_PREFIX as string,
    token: env.BOT_TOKEN as string,
};
