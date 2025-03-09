import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { auth } from '@http/middlewares/auth'

const requestPasswordRecoverBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
})

type RequestPasswordBody = z.infer<typeof requestPasswordRecoverBodySchema>

export async function requestPasswordRecover(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post<{ Body: RequestPasswordBody }>(
    '/password/recover',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Get authenticated user profile',
        body: requestPasswordRecoverBodySchema,
        response: {
          201: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body

      const userFromEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!userFromEmail) {
        // We don't want to leak information about the existence of the user
        return reply.status(201).send()
      }

      const { id: code } = await prisma.token.create({
        data: {
          type: 'password-recover',
          userId: userFromEmail.id,
        },
      })

      // Send e-mail with the code

      return reply.status(201).send()
    }
  )
}
