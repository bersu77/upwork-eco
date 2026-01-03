import type { PayloadHandler } from 'payload'
import { createLocalReq } from 'payload'
import { customSeed } from './custom-seed'

export const customSeedEndpoint: PayloadHandler = async (req) => {
  const { payload } = req

  try {
    const payloadReq = await createLocalReq({}, payload)
    await customSeed({ payload, req: payloadReq })

    return Response.json({
      success: true,
      message: 'Custom seed data created successfully',
    })
  } catch (error: any) {
    payload.logger.error({ err: error, message: 'Error seeding custom data' })
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

