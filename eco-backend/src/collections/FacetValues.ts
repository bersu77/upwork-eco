import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

export const FacetValues: CollectionConfig = {
  slug: 'facetValues',
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
      label: 'Value Name',
      admin: {
        description: 'The display name of this facet value (e.g., "Red", "Large", "Nike")',
      },
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      label: 'Value Code',
      admin: {
        description: 'A unique code for this value (e.g., "red", "large", "nike")',
      },
    },
    {
      name: 'facet',
      type: 'relationship',
      relationTo: 'facets',
      required: true,
      label: 'Facet',
      admin: {
        description: 'The facet this value belongs to',
      },
    },
    slugField({
      fieldToUse: 'name',
      position: undefined,
    }),
  ],
}

