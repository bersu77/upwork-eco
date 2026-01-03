import type { Payload } from 'payload'

export async function seedShopData(payload: Payload): Promise<void> {
  console.log('Starting shop data seed...')

  try {
    console.log('Creating facets...')
    const colorFacet = await payload.create({
      collection: 'facets',
      data: {
        name: 'Color',
        code: 'color',
        slug: 'color',
      },
    })

    const sizeFacet = await payload.create({
      collection: 'facets',
      data: {
        name: 'Size',
        code: 'size',
        slug: 'size',
      },
    })

    const brandFacet = await payload.create({
      collection: 'facets',
      data: {
        name: 'Brand',
        code: 'brand',
        slug: 'brand',
      },
    })

    console.log('Creating facet values...')
    const redValue = await payload.create({
      collection: 'facetValues',
      data: {
        name: 'Red',
        code: 'red',
        slug: 'red',
        facet: colorFacet.id,
      },
    })

    const blueValue = await payload.create({
      collection: 'facetValues',
      data: {
        name: 'Blue',
        code: 'blue',
        slug: 'blue',
        facet: colorFacet.id,
      },
    })

    const blackValue = await payload.create({
      collection: 'facetValues',
      data: {
        name: 'Black',
        code: 'black',
        slug: 'black',
        facet: colorFacet.id,
      },
    })

    const smallValue = await payload.create({
      collection: 'facetValues',
      data: {
        name: 'Small',
        code: 'small',
        slug: 'small',
        facet: sizeFacet.id,
      },
    })

    const mediumValue = await payload.create({
      collection: 'facetValues',
      data: {
        name: 'Medium',
        code: 'medium',
        slug: 'medium',
        facet: sizeFacet.id,
      },
    })

    const largeValue = await payload.create({
      collection: 'facetValues',
      data: {
        name: 'Large',
        code: 'large',
        slug: 'large',
        facet: sizeFacet.id,
      },
    })

    console.log('Creating categories...')
    const clothingCategory = await payload.create({
      collection: 'categories',
      data: {
        title: 'Clothing',
        slug: 'clothing',
      },
    })

    const electronicsCategory = await payload.create({
      collection: 'categories',
      data: {
        title: 'Electronics',
        slug: 'electronics',
      },
    })

    const accessoriesCategory = await payload.create({
      collection: 'categories',
      data: {
        title: 'Accessories',
        slug: 'accessories',
      },
    })

    // Create nested categories
    const menCategory = await payload.create({
      collection: 'categories',
      data: {
        title: 'Men',
        slug: 'men',
        parent: clothingCategory.id,
      },
    })

    const womenCategory = await payload.create({
      collection: 'categories',
      data: {
        title: 'Women',
        slug: 'women',
        parent: clothingCategory.id,
      },
    })

    console.log('Creating shipping methods...')
    await payload.create({
      collection: 'shippingMethods',
      data: {
        name: 'Standard Shipping',
        code: 'standard',
        slug: 'standard',
        description: 'Delivery in 5-7 business days',
        price: 5.99,
        estimatedDays: 6,
        enabled: true,
      },
    })

    await payload.create({
      collection: 'shippingMethods',
      data: {
        name: 'Express Shipping',
        code: 'express',
        slug: 'express',
        description: 'Delivery in 2-3 business days',
        price: 14.99,
        estimatedDays: 2,
        enabled: true,
      },
    })

    await payload.create({
      collection: 'shippingMethods',
      data: {
        name: 'Overnight Shipping',
        code: 'overnight',
        slug: 'overnight',
        description: 'Next day delivery',
        price: 24.99,
        estimatedDays: 1,
        enabled: true,
      },
    })


    console.log('Creating sample products...')
    
    await payload.create({
      collection: 'products',
      data: {
        title: 'Classic Cotton T-Shirt',
        slug: 'classic-cotton-tshirt',
        description: {
          root: {
            type: 'root',
            version: 1,
            direction: null,
            format: '',
            indent: 0,
            children: [
              {
                type: 'paragraph',
                version: 1,
                children: [
                  {
                    type: 'text',
                    text: 'A comfortable and stylish cotton t-shirt perfect for everyday wear.',
                  },
                ],
              },
            ],
          },
        },
        priceInUSD: 29.99,
        inventory: 100,
        categories: [menCategory.id, womenCategory.id],
        facetValues: [redValue.id, blueValue.id, blackValue.id, smallValue.id, mediumValue.id, largeValue.id],
        _status: 'published',
      },
    })

    // Product 2: Laptop
    await payload.create({
      collection: 'products',
      data: {
        title: 'Professional Laptop',
        slug: 'professional-laptop',
        description: {
          root: {
            type: 'root',
            version: 1,
            direction: null,
            format: '',
            indent: 0,
            children: [
              {
                type: 'paragraph',
                version: 1,
                children: [
                  {
                    type: 'text',
                    text: 'High-performance laptop for professionals and creators.',
                  },
                ],
              },
            ],
          },
        },
        priceInUSD: 1299.99,
        inventory: 25,
        categories: [electronicsCategory.id],
        facetValues: [blackValue.id],
        _status: 'published',
      },
    })

    // Product 3: Backpack
    await payload.create({
      collection: 'products',
      data: {
        title: 'Travel Backpack',
        slug: 'travel-backpack',
        description: {
          root: {
            type: 'root',
            version: 1,
            direction: null,
            format: '',
            indent: 0,
            children: [
              {
                type: 'paragraph',
                version: 1,
                children: [
                  {
                    type: 'text',
                    text: 'Durable backpack perfect for travel and daily commute.',
                  },
                ],
              },
            ],
          },
        },
        priceInUSD: 79.99,
        inventory: 50,
        categories: [accessoriesCategory.id],
        facetValues: [blackValue.id, blueValue.id],
        _status: 'published',
      },
    })

    // Product 4: Sneakers
    await payload.create({
      collection: 'products',
      data: {
        title: 'Athletic Sneakers',
        slug: 'athletic-sneakers',
        description: {
          root: {
            type: 'root',
            version: 1,
            direction: null,
            format: '',
            indent: 0,
            children: [
              {
                type: 'paragraph',
                version: 1,
                children: [
                  {
                    type: 'text',
                    text: 'Comfortable sneakers for running and casual wear.',
                  },
                ],
              },
            ],
          },
        },
        priceInUSD: 89.99,
        inventory: 75,
        categories: [clothingCategory.id],
        facetValues: [blackValue.id, redValue.id, smallValue.id, mediumValue.id, largeValue.id],
        _status: 'published',
      },
    })

    // Product 5: Wireless Headphones
    await payload.create({
      collection: 'products',
      data: {
        title: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: {
          root: {
            type: 'root',
            version: 1,
            direction: null,
            format: '',
            indent: 0,
            children: [
              {
                type: 'paragraph',
                version: 1,
                children: [
                  {
                    type: 'text',
                    text: 'Premium wireless headphones with noise cancellation.',
                  },
                ],
              },
            ],
          },
        },
        priceInUSD: 199.99,
        inventory: 40,
        categories: [electronicsCategory.id, accessoriesCategory.id],
        facetValues: [blackValue.id, blueValue.id],
        _status: 'published',
      },
    })

    console.log('✅ Shop data seeded successfully!')
    console.log('Created:')
    console.log('- 3 Facets (Color, Size, Brand)')
    console.log('- 6 Facet Values')
    console.log('- 5 Categories (including 2 nested)')
    console.log('- 3 Shipping Methods')
    console.log('- 5 Sample Products')
  } catch (error) {
    console.error('Error seeding shop data:', error)
    throw error
  }
}

