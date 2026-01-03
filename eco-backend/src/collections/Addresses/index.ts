import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

/**
 * Extends the Address collection from the ecommerce plugin
 * Adds Vendure-compatible fields for storefront integration
 */
export const AddressesCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  fields: [
    ...defaultCollection.fields,
    {
      name: 'fullName',
      type: 'text',
      label: 'Full Name',
      admin: {
        description: 'Full name for the address (alternative to firstName + lastName)',
      },
    },
    {
      name: 'streetLine1',
      type: 'text',
      label: 'Street Address Line 1',
    },
    {
      name: 'streetLine2',
      type: 'text',
      label: 'Street Address Line 2',
    },
    {
      name: 'province',
      type: 'text',
      label: 'Province/State',
    },
    {
      name: 'phoneNumber',
      type: 'text',
      label: 'Phone Number',
    },
    {
      name: 'defaultShippingAddress',
      type: 'checkbox',
      label: 'Default Shipping Address',
      defaultValue: false,
    },
    {
      name: 'defaultBillingAddress',
      type: 'checkbox',
      label: 'Default Billing Address',
      defaultValue: false,
    },
  ],
})

