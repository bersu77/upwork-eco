import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'


export const CartsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  fields: [
    // Filter out the default 'status' field if it exists, then add our custom one
    ...defaultCollection.fields.filter((field: any) => field.name !== 'status'),
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Payment Authorized', value: 'PaymentAuthorized' },
        { label: 'Purchased', value: 'purchased' },
        { label: 'Abandoned', value: 'abandoned' },
        { label: 'Completed', value: 'completed' },
      ],
      defaultValue: 'active',
    },
    {
      name: 'shippingAddress',
      type: 'relationship',
      relationTo: 'addresses',
      label: 'Shipping Address',
    },
    {
      name: 'billingAddress',
      type: 'relationship',
      relationTo: 'addresses',
      label: 'Billing Address',
    },
    {
      name: 'shippingMethod',
      type: 'relationship',
      relationTo: 'shippingMethods',
      label: 'Shipping Method',
    },
    {
      name: 'payments',
      type: 'array',
      label: 'Payments',
      admin: {
        description: 'Payment records for this cart',
      },
      fields: [
        {
          name: 'method',
          type: 'text',
          required: true,
          label: 'Payment Method',
        },
        {
          name: 'amount',
          type: 'number',
          required: true,
          label: 'Amount',
        },
        {
          name: 'state',
          type: 'select',
          required: true,
          options: [
            { label: 'Pending', value: 'Pending' },
            { label: 'Authorized', value: 'Authorized' },
            { label: 'Settled', value: 'Settled' },
            { label: 'Failed', value: 'Failed' },
          ],
          defaultValue: 'Pending',
        },
        {
          name: 'transactionId',
          type: 'text',
          label: 'Transaction ID',
        },
        {
          name: 'metadata',
          type: 'json',
          label: 'Payment Metadata',
        },
      ],
    },
    {
      name: 'couponCodes',
      type: 'array',
      label: 'Coupon Codes',
      admin: {
        description: 'List of applied coupon codes',
      },
      fields: [
        {
          name: 'code',
          type: 'text',
          required: true,
          label: 'Coupon Code',
        },
      ],
    },
  ],
})

