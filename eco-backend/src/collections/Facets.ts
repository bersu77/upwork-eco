import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

export const Facets: CollectionConfig = {
  slug: 'facets',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
    group: 'Shop',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Facet Name',
      admin: {
        description: 'The display name of this facet (e.g., "Color", "Size", "Brand")',
      },
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      label: 'Facet Code',
      admin: {
        description: 'A unique code for this facet (e.g., "color", "size", "brand")',
      },
    },
    slugField({
      fieldToUse: 'name',
      position: undefined,
    }),
  ],
}

