import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'

import { UnauthorizedError } from '../_errors/unauthorized-error'
import { hash } from 'bcryptjs'

const resetPasswordRecoverBodySchema = z.object({
  code: z.string(),
  newPassword: z.string().min(6),
})

type ResetPasswordBody = z.infer<typeof resetPasswordRecoverBodySchema>

export async function resetPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post<{ Body: ResetPasswordBody }>(
    '/password/reset',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Reset password',
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { code, newPassword } = request.body

      const tokenFromCode = await prisma.token.findUnique({
        where: {
          id: code,
        },
      })

      if (!tokenFromCode) {
        throw new UnauthorizedError('Invalid code')
      }

      const passwordHash = await hash(newPassword, 6)

      await prisma.user.update({
        where: {
          id: tokenFromCode.userId,
        },
        data: {
          passwordHash,
        },
      })

      return reply.status(204).send()
    }
  )
}
