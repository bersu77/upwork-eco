import { GraphQLContext } from '../context'
import { mapProduct, mapSearchResult } from '../mappers/product.mapper'

export const productResolvers = {
  Query: {
    async product(_: any, args: { slug?: string; id?: string }, context: GraphQLContext) {
      const { payload } = context

      try {
        let product

        if (args.id) {
          product = await payload.findByID({
            collection: 'products',
            id: args.id,
            depth: 3,
            populate: {
              variants: {
                title: true,
                priceInUSD: true,
                inventory: true,
                options: true,
                _status: true,
              },
            },
          })
        } else if (args.slug) {
          const result = await payload.find({
            collection: 'products',
            where: {
              slug: {
                equals: args.slug,
              },
            },
            depth: 3,
            limit: 1,
            populate: {
              variants: {
                title: true,
                priceInUSD: true,
                inventory: true,
                options: true,
                _status: true,
              },
            },
          })
          product = result.docs[0]
        }

        return product ? mapProduct(product) : null
      } catch (error) {
        console.error('Error fetching product:', error)
        return null
      }
    },

    
    async search(_: any, args: { input: any }, context: GraphQLContext) {
      const { payload } = context
      const { input } = args

      try {
        const where: any = {
          _status: { equals: 'published' },
        }

        if (input.collectionSlug) {
          const categoryResult = await payload.find({
            collection: 'categories',
            where: {
              slug: { equals: input.collectionSlug },
            },
            limit: 1,
          })

          if (categoryResult.docs[0]) {
            where.categories = {
              contains: categoryResult.docs[0].id,
            }
          }
        }

        if (input.term) {
          where.or = [
            {
              title: {
                contains: input.term,
              },
            },
            {
              description: {
                contains: input.term,
              },
            },
          ]
        }

        if (input.facetValueFilters && input.facetValueFilters.length > 0) {
          const facetValueIds: string[] = []
          
          input.facetValueFilters.forEach((filter: any) => {
            if (filter.or) {
              facetValueIds.push(...filter.or)
            }
            if (filter.and) {
              facetValueIds.push(...filter.and)
            }
          })

          if (facetValueIds.length > 0) {
            where.facetValues = {
              in: facetValueIds,
            }
          }
        }

        const result = await payload.find({
          collection: 'products',
          where,
          depth: 3,
          limit: input.take || 24,
          page: input.skip ? Math.floor(input.skip / (input.take || 24)) + 1 : 1,
          populate: {
            facetValues: {
              name: true,
              code: true,
              facet: true,
            },
          },
        })

        const facetValues = await calculateFacetValues(result.docs, payload)

        return {
          items: result.docs.map(mapSearchResult),
          totalItems: result.totalDocs,
          facetValues,
        }
      } catch (error) {
        console.error('Error searching products:', error)
        return {
          items: [],
          totalItems: 0,
          facetValues: [],
        }
      }
    },
  },

  PriceSearchResult: {
    __resolveType(obj: any) {
      return obj.__typename
    },
  },
}

async function calculateFacetValues(products: any[], payload: any): Promise<any[]> {
  const facetValueCounts = new Map<string, number>()
  const facetValueData = new Map<string, any>()

  for (const product of products) {
    if (product.facetValues && Array.isArray(product.facetValues)) {
      for (const fvId of product.facetValues) {
        const id = typeof fvId === 'object' ? fvId.id : fvId
        facetValueCounts.set(id, (facetValueCounts.get(id) || 0) + 1)
      }
    }
  }

  if (facetValueCounts.size > 0) {
    const facetValueIds = Array.from(facetValueCounts.keys())
    const facetValuesResult = await payload.find({
      collection: 'facetValues',
      where: {
        id: {
          in: facetValueIds,
        },
      },
      depth: 2,
      limit: 100,
    })

    for (const fv of facetValuesResult.docs) {
      facetValueData.set(fv.id, fv)
    }
  }

  const result: any[] = []
  for (const [id, count] of facetValueCounts.entries()) {
    const fv = facetValueData.get(id)
    if (fv) {
      result.push({
        count,
        facetValue: {
          id: fv.id,
          name: fv.name,
          code: fv.code,
          facet: fv.facet
            ? {
                id: fv.facet.id,
                name: fv.facet.name,
                code: fv.facet.code,
              }
            : null,
        },
      })
    }
  }

  return result
}

