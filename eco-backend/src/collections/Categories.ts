import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'categories',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'categories',
        req,
      }),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Category description for display on collection pages',
      },
    },
    {
      name: 'featuredAsset',
      type: 'upload',
      relationTo: 'media',
      label: 'Featured Image',
      admin: {
        description: 'Featured image displayed on collection cards and pages',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Parent Category',
      admin: {
        description: 'Select a parent category to create a nested structure',
      },
      filterOptions: ({ id }) => {
        // Prevent selecting itself as parent
        if (id) {
          return {
            id: {
              not_equals: id,
            },
          }
        }
        return true
      },
    },
    {
      name: 'breadcrumbs',
      type: 'array',
      label: 'Breadcrumbs',
      admin: {
        readOnly: true,
        description: 'Auto-generated breadcrumb trail',
      },
      fields: [
        {
          name: 'doc',
          type: 'relationship',
          relationTo: 'categories',
        },
        {
          name: 'label',
          type: 'text',
        },
      ],
    },
    slugField({
      position: undefined,
    }),
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Generate breadcrumbs based on parent hierarchy
        if (data.parent) {
          const breadcrumbs: any[] = []
          let currentParentId = data.parent

          // Traverse up the parent chain
          while (currentParentId) {
            const parent = await req.payload.findByID({
              collection: 'categories',
              id: typeof currentParentId === 'object' ? currentParentId.id : currentParentId,
            })

            if (parent) {
              breadcrumbs.unshift({
                doc: parent.id,
                label: parent.title,
              })
              currentParentId = parent.parent
            } else {
              break
            }
          }

          data.breadcrumbs = breadcrumbs
        } else {
          data.breadcrumbs = []
        }

        return data
      },
    ],
  },
}
