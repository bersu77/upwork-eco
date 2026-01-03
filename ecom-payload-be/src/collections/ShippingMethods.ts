import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

export const ShippingMethods: CollectionConfig = {
  slug: 'shippingMethods',
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
      label: 'Shipping Method Name',
      admin: {
        description: 'The display name (e.g., "Standard Shipping", "Express Delivery")',
      },
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      label: 'Method Code',
      admin: {
        description: 'A unique code for this shipping method (e.g., "standard", "express")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Description of the shipping method',
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      label: 'Price (USD)',
      admin: {
        description: 'The cost of this shipping method in USD',
      },
    },
    {
      name: 'estimatedDays',
      type: 'number',
      label: 'Estimated Delivery Days',
      admin: {
        description: 'Number of days for delivery (optional)',
      },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enabled',
      admin: {
        description: 'Whether this shipping method is available for customers',
      },
    },
    slugField({
      position: undefined,
    }),
  ],
}

