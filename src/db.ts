import { PrismaClient } from '@prisma/client';

const client = new PrismaClient({
    // TODO: setup logging
});

export default client;
