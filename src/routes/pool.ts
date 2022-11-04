import { FastifyInstance } from 'fastify';
import ShortUniqueId from 'short-unique-id';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function poolRoutes(fastify: FastifyInstance) {
  fastify.get('/pools/count', async () => {
    const count = await prisma.pool.count();

    return { count };
  });

  fastify.post('/pools', async (request, reply) => {
    const createPoolBody = z.object({
      title: z.string()
    });

    const { title } = createPoolBody.parse(request.body);
    const generateCode = new ShortUniqueId({ length: 6 });
    const code = String(generateCode()).toUpperCase();

    let ownerId = null;
    try {
      await request.jwtVerify();

      await prisma.pool.create({
        data: {
          code,
          title,
          ownerId: request.user.sub,
          participants: {
            create: {
              userId: request.user.sub
            }
          }
        }
      });
    } catch {
      await prisma.pool.create({
        data: {
          code,
          title
        }
      });
    }

    return reply.status(201).send({ code });
  });
}
