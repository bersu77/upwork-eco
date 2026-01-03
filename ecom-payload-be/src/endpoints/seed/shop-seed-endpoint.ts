import type { PayloadHandler } from 'payload'
import { seedShopData } from './shop-seed'


export const seedShopEndpoint: PayloadHandler = async (req) => {
  const { payload } = req

  try {
    await seedShopData(payload)

    return Response.json({
      success: true,
      message: 'Shop data seeded successfully',
    })
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

