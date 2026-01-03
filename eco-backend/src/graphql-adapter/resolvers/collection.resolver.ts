import { GraphQLContext } from '../context'
import { mapCollection, mapCollectionList } from '../mappers/collection.mapper'

export const collectionResolvers = {
  Query: {
    async collection(_: any, args: { slug?: string; id?: string }, context: GraphQLContext) {
      const { payload } = context

      try {
        let category

        if (args.id) {
          category = await payload.findByID({
            collection: 'categories',
            id: args.id,
            depth: 3,
          })
        } else if (args.slug) {
          const result = await payload.find({
            collection: 'categories',
            where: {
              slug: {
                equals: args.slug,
              },
            },
            depth: 3,
            limit: 1,
          })
          category = result.docs[0]
        }

        if (!category) {
          return null
        }

        const mapped = mapCollection(category)

        const childrenResult = await payload.find({
          collection: 'categories',
          where: {
            parent: {
              equals: category.id,
            },
          },
          depth: 3,
        })

        mapped.children = childrenResult.docs.map(mapCollection)

        return mapped
      } catch (error) {
        console.error('Error fetching collection:', error)
        return null
      }
    },

    async collections(_: any, __: any, context: GraphQLContext) {
      const { payload } = context

      try {
        const result = await payload.find({
          collection: 'categories',
          depth: 2,
          limit: 100,
        })

        return mapCollectionList(result.docs)
      } catch (error) {
        console.error('Error fetching collections:', error)
        return {
          items: [],
          totalItems: 0,
        }
      }
    },
  },
}

