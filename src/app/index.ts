import express, { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import nunjucks from 'nunjucks';

import config from '../config';
import db from '../db';
import logger from '../logger';

interface Token {
    guild: string;
    member: string;
    name: string;
}

const app = express();

app.use(express.json());

nunjucks.configure(`${__dirname}/../../views`, {
    autoescape: true,
    express: app,
    watch: config.env !== 'production',
});

app.get(
    '/songs',
    asyncHandler(async (req, res) => {
        const token = req.header('Authorization') || '';
        const data = jwt.verify(token, config.secret) as Token;
        const guild = data.guild;

        const results = await db.song.findMany({
            where: { guild },
            include: { tags: true },
        });

        const songs = results.map((song) => ({
            id: song.id,
            title: song.title,
            location: song.location,
            tags: song.tags.map((tag) => tag.tag),
        }));

        res.json({ songs });
    }),
);

app.put(
    '/songs/:id',
    asyncHandler(async (req, res) => {
        const token = req.header('Authorization') || '';
        jwt.verify(token, config.secret);

        const id = Number(req.params.id);
        const song = await db.song.findUnique({
            where: { id },
            include: { tags: true },
        });

        if (!song) {
            return res.status(404).json({ error: 'Not found' });
        }

        const newTags: string[] = req.body.tags;

        const updated = await db.song.update({
            where: { id },
            data: {
                title: req.body.title,
                tags: {
                    deleteMany: song.tags
                        .map((tag) => tag.tag)
                        .filter((tag) => !newTags.includes(tag))
                        .map((tag) => ({ songId: id, tag })),
                    upsert: newTags.map((tag) => ({
                        create: { tag },
                        update: { tag },
                        where: { song_tag: { songId: id, tag } },
                    })),
                },
            },
            include: { tags: true },
        });

        res.json({
            id: updated.id,
            title: updated.title,
            location: updated.location,
            tags: updated.tags.map((tag) => tag.tag),
        });
    }),
);

app.delete(
    '/songs/:id',
    asyncHandler(async (req, res) => {
        const token = req.header('Authorization') || '';
        jwt.verify(token, config.secret);

        const id = Number(req.params.id);
        await db.tag.deleteMany({ where: { songId: id } });
        await db.song.delete({ where: { id } });

        res.status(204).send();
    }),
);

app.get('/', (req, res) => {
    const token = req.query.token || '';
    const data = jwt.verify(token.toString(), config.secret) as Token;

    res.render('index.html', { guild: data.name });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(500).json({ error: err.name, message: err.message });
});

app.listen(config.port, () => {
    logger.info(`Application ready at ${config.port}`);
});
