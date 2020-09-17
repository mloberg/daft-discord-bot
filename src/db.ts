import { PrismaClient } from '@prisma/client';

import logger from './logger';

const client = new PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'info',
        },
        {
            emit: 'event',
            level: 'warn',
        },
        {
            emit: 'event',
            level: 'error',
        },
    ],
});

client.$on('query', (query) => logger.debug(query));
client.$on('info', (log) => logger.info(log));
client.$on('warn', (log) => logger.warn(log));
client.$on('error', (log) => logger.error(log));

export default client;
