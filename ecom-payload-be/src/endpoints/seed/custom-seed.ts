import type { Payload, PayloadRequest } from 'payload'
import type { Category, Media, Product, VariantOption, VariantType, Variant, Facet, FacetValue } from '@/payload-types'

// Helper function to fetch images from URLs
async function fetchFileByURL(url: string): Promise<{ name: string; data: Buffer; mimetype: string; size: number }> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()
  const extension = url.split('.').pop() || 'jpg'
  
  return {
    name: url.split('/').pop() || `file-${Date.now()}.${extension}`,
    data: Buffer.from(data),
    mimetype: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
    size: data.byteLength,
  }
}

// Simple rich text description helper
function createDescription(text: string) {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
          textFormat: 0,
          textStyle: '',
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

export async function customSeed({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  payload.logger.info('Starting custom seed with nested categories and products...')

  // Clear existing data
  // Order matters: delete dependent collections first to avoid foreign key constraints
  const collections: Array<'categories' | 'media' | 'products' | 'variants' | 'variantOptions' | 'variantTypes' | 'facets' | 'facetValues'> = [
    'variantOptions', // Depends on variants/variantTypes
    'variants', // Depends on products
    'products', // Depends on categories, facetValues
    'facetValues', // Must be deleted before facets (facet_id foreign key)
    'facets',
    'variantTypes',
    'categories',
    'media',
  ]

  payload.logger.info('Clearing existing data...')
  for (const collection of collections) {
    await payload.db.deleteMany({ collection, req, where: {} })
  }

  // Fetch images from Unsplash (free stock photos)
  payload.logger.info('Fetching images...')
  const imageUrls = {
    // Clothing category images
    mensClothing: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    womensClothing: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
    kidsClothing: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800',
    // Electronics category images
    smartphones: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    laptops: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
    headphones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    // Product images
    tshirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    jeans: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
    sneakers: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    dress: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
    hoodie: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
    phone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    laptop: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
    wirelessHeadphones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
  }

  const imageBuffers = await Promise.all(
    Object.entries(imageUrls).map(([key, url]) =>
      fetchFileByURL(url).then(buffer => ({ key, buffer }))
    )
  )

  const images: Record<string, Media> = {}

  // Create media entries
  for (const { key, buffer } of imageBuffers) {
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: `${key} image`,
      },
      file: buffer,
    })
    images[key] = media
  }

  payload.logger.info('Creating facets and facet values...')

  // Create facets (slugField will auto-generate slug from 'name' field)
  const colorFacet = await payload.create({
    collection: 'facets',
    data: {
      name: 'Color',
      code: 'color',
    },
  })

  const sizeFacet = await payload.create({
    collection: 'facets',
    data: {
      name: 'Size',
      code: 'size',
    },
  })

  const brandFacet = await payload.create({
    collection: 'facets',
    data: {
      name: 'Brand',
      code: 'brand',
    },
  })

  // Create facet values for colors
  const colorFacetValues: Record<string, FacetValue> = {}
  const colorFacetValueMap: Record<string, FacetValue> = {}
  
  const colorFacetValueData = [
    { name: 'Black', code: 'black' },
    { name: 'White', code: 'white' },
    { name: 'Navy Blue', code: 'navy' },
    { name: 'Red', code: 'red' },
    { name: 'Gray', code: 'gray' },
    { name: 'Green', code: 'green' },
  ]

  for (const colorData of colorFacetValueData) {
    const facetValue = await payload.create({
      collection: 'facetValues',
      data: {
        name: colorData.name,
        code: colorData.code,
        facet: colorFacet.id,
      },
    })
    colorFacetValues[colorData.code] = facetValue
    colorFacetValueMap[colorData.name.toLowerCase()] = facetValue
  }

  // Create facet values for sizes
  const sizeFacetValues: Record<string, FacetValue> = {}
  const sizeFacetValueMap: Record<string, FacetValue> = {}
  
  const sizeFacetValueData = [
    { name: 'Extra Small', code: 'xs' },
    { name: 'Small', code: 'small' },
    { name: 'Medium', code: 'medium' },
    { name: 'Large', code: 'large' },
    { name: 'Extra Large', code: 'xlarge' },
    { name: '2X Large', code: 'xxlarge' },
  ]

  for (const sizeData of sizeFacetValueData) {
    const facetValue = await payload.create({
      collection: 'facetValues',
      data: {
        name: sizeData.name,
        code: sizeData.code,
        facet: sizeFacet.id,
      },
    })
    sizeFacetValues[sizeData.code] = facetValue
    sizeFacetValueMap[sizeData.name.toLowerCase()] = facetValue
  }

  payload.logger.info('Creating variant types and options...')

  // Create variant types
  const sizeType = await payload.create({
    collection: 'variantTypes',
    data: {
      name: 'size',
      label: 'Size',
    },
  })

  const colorType = await payload.create({
    collection: 'variantTypes',
    data: {
      name: 'color',
      label: 'Color',
    },
  })

  // Create size options
  const sizeOptions: VariantOption[] = []
  const sizes = [
    { label: 'XS', value: 'xs' },
    { label: 'S', value: 'small' },
    { label: 'M', value: 'medium' },
    { label: 'L', value: 'large' },
    { label: 'XL', value: 'xlarge' },
    { label: 'XXL', value: 'xxlarge' },
  ]

  for (const size of sizes) {
    const option = await payload.create({
      collection: 'variantOptions',
      data: {
        ...size,
        variantType: sizeType.id,
      },
    })
    sizeOptions.push(option)
  }

  // Create color options
  const colorOptions: VariantOption[] = []
  const colors = [
    { label: 'Black', value: 'black' },
    { label: 'White', value: 'white' },
    { label: 'Navy Blue', value: 'navy' },
    { label: 'Red', value: 'red' },
    { label: 'Gray', value: 'gray' },
    { label: 'Green', value: 'green' },
  ]

  for (const color of colors) {
    const option = await payload.create({
      collection: 'variantOptions',
      data: {
        ...color,
        variantType: colorType.id,
      },
    })
    colorOptions.push(option)
  }

  payload.logger.info('Creating nested categories...')

  // Create top-level categories
  const clothingCategory = await payload.create({
    collection: 'categories',
    data: {
      title: 'Clothing',
      slug: 'clothing',
      description: 'Discover our wide range of clothing for all ages and styles.',
      featuredAsset: images.mensClothing?.id,
    },
  })

  const electronicsCategory = await payload.create({
    collection: 'categories',
    data: {
      title: 'Electronics',
      slug: 'electronics',
      description: 'Latest technology and gadgets for your everyday needs.',
      featuredAsset: images.smartphones?.id,
    },
  })

  // Create nested categories under Clothing
  const mensCategory = await payload.create({
    collection: 'categories',
    data: {
      title: "Men's Clothing",
      slug: 'mens-clothing',
      description: 'Stylish and comfortable clothing for men.',
      parent: clothingCategory.id,
      featuredAsset: images.mensClothing?.id,
    },
  })

  const womensCategory = await payload.create({
    collection: 'categories',
    data: {
      title: "Women's Clothing",
      slug: 'womens-clothing',
      description: 'Fashion-forward clothing for women.',
      parent: clothingCategory.id,
      featuredAsset: images.womensClothing?.id,
    },
  })

  const kidsCategory = await payload.create({
    collection: 'categories',
    data: {
      title: "Kids' Clothing",
      slug: 'kids-clothing',
      description: 'Fun and comfortable clothing for kids.',
      parent: clothingCategory.id,
      featuredAsset: images.kidsClothing?.id,
    },
  })

  // Create nested categories under Electronics
  const smartphonesCategory = await payload.create({
    collection: 'categories',
    data: {
      title: 'Smartphones',
      slug: 'smartphones',
      description: 'Latest smartphones and mobile devices.',
      parent: electronicsCategory.id,
      featuredAsset: images.smartphones?.id,
    },
  })

  const laptopsCategory = await payload.create({
    collection: 'categories',
    data: {
      title: 'Laptops',
      slug: 'laptops',
      description: 'Powerful laptops for work and play.',
      parent: electronicsCategory.id,
      featuredAsset: images.laptops?.id,
    },
  })

  const headphonesCategory = await payload.create({
    collection: 'categories',
    data: {
      title: 'Headphones',
      slug: 'headphones',
      description: 'High-quality audio headphones.',
      parent: electronicsCategory.id,
      featuredAsset: images.headphones?.id,
    },
  })

  payload.logger.info('Creating products with variants...')

  // Product 1: Classic T-Shirt (Men's)
  const tshirtProduct = await payload.create({
    collection: 'products',
    depth: 0,
    data: {
      title: 'Classic Cotton T-Shirt',
      slug: 'classic-cotton-tshirt',
      description: createDescription(
        'A timeless classic t-shirt made from 100% premium cotton. Comfortable, breathable, and perfect for everyday wear. Available in multiple colors and sizes.'
      ),
      enableVariants: true,
      variantTypes: [colorType.id, sizeType.id],
      categories: [mensCategory.id, clothingCategory.id],
      gallery: [{ image: images.tshirt?.id }],
      meta: {
        title: 'Classic Cotton T-Shirt | Premium Quality',
        description: 'Premium cotton t-shirt available in multiple colors and sizes.',
        image: images.tshirt?.id,
      },
      priceInUSDEnabled: true,
      priceInUSD: 2499, // $24.99
      inventory: 0, // Variants have their own inventory
      facetValues: [
        colorFacetValues.black.id,
        colorFacetValues.white.id,
        colorFacetValues.navy.id,
        sizeFacetValues.small.id,
        sizeFacetValues.medium.id,
        sizeFacetValues.large.id,
        sizeFacetValues.xlarge.id,
      ],
      _status: 'published',
    },
  })

  // Create variants for T-Shirt (all size/color combinations)
  const tshirtVariants: Variant[] = []
  for (const size of [sizeOptions[1], sizeOptions[2], sizeOptions[3], sizeOptions[4]]) { // S, M, L, XL
    for (const color of [colorOptions[0], colorOptions[1], colorOptions[2]]) { // Black, White, Navy
      const variant = await payload.create({
        collection: 'variants',
        depth: 0,
        data: {
          product: tshirtProduct.id,
          title: `Classic T-Shirt - ${color.label} - ${size.label}`,
          options: [color.id, size.id],
          inventory: Math.floor(Math.random() * 50) + 10, // Random inventory 10-60
          priceInUSDEnabled: true,
          priceInUSD: 2499,
          _status: 'published',
        },
      })
      tshirtVariants.push(variant)
    }
  }

  // Product 2: Slim Fit Jeans (Men's)
  const jeansProduct = await payload.create({
    collection: 'products',
    depth: 0,
    data: {
      title: 'Slim Fit Denim Jeans',
      slug: 'slim-fit-denim-jeans',
      description: createDescription(
        'Premium slim-fit jeans crafted from high-quality denim. Perfect fit with stretch comfort. Available in multiple sizes and washes.'
      ),
      enableVariants: true,
      variantTypes: [colorType.id, sizeType.id],
      categories: [mensCategory.id, clothingCategory.id],
      gallery: [{ image: images.jeans?.id }],
      meta: {
        title: 'Slim Fit Denim Jeans | Premium Quality',
        description: 'Premium slim-fit jeans available in multiple sizes.',
        image: images.jeans?.id,
      },
      priceInUSDEnabled: true,
      priceInUSD: 7999, // $79.99
      inventory: 0,
      facetValues: [
        colorFacetValues.black.id,
        colorFacetValues.navy.id,
        colorFacetValues.gray.id,
        sizeFacetValues.small.id,
        sizeFacetValues.medium.id,
        sizeFacetValues.large.id,
        sizeFacetValues.xlarge.id,
      ],
      _status: 'published',
    },
  })

  // Create variants for Jeans
  const jeansVariants: Variant[] = []
  for (const size of sizeOptions.slice(1, 5)) { // S, M, L, XL
    for (const color of [colorOptions[0], colorOptions[2], colorOptions[3]]) { // Black, Navy, Gray
      const variant = await payload.create({
        collection: 'variants',
        depth: 0,
        data: {
          product: jeansProduct.id,
          title: `Slim Fit Jeans - ${color.label} - ${size.label}`,
          options: [color.id, size.id],
          inventory: Math.floor(Math.random() * 30) + 5,
          priceInUSDEnabled: true,
          priceInUSD: 7999,
          _status: 'published',
        },
      })
      jeansVariants.push(variant)
    }
  }

  // Product 3: Running Sneakers (Men's)
  const sneakersProduct = await payload.create({
    collection: 'products',
    depth: 0,
    data: {
      title: 'Premium Running Sneakers',
      slug: 'premium-running-sneakers',
      description: createDescription(
        'High-performance running sneakers with advanced cushioning and breathable mesh upper. Perfect for daily runs and workouts.'
      ),
      enableVariants: true,
      variantTypes: [colorType.id, sizeType.id],
      categories: [mensCategory.id, clothingCategory.id],
      gallery: [{ image: images.sneakers?.id }],
      meta: {
        title: 'Premium Running Sneakers | High Performance',
        description: 'High-performance running sneakers for athletes.',
        image: images.sneakers?.id,
      },
      priceInUSDEnabled: true,
      priceInUSD: 12999, // $129.99
      inventory: 0,
      facetValues: [
        colorFacetValues.black.id,
        colorFacetValues.white.id,
        sizeFacetValues.small.id,
        sizeFacetValues.medium.id,
        sizeFacetValues.large.id,
        sizeFacetValues.xlarge.id,
        sizeFacetValues.xxlarge.id,
      ],
      _status: 'published',
    },
  })

  // Create variants for Sneakers (sizes only, limited colors)
  const sneakersVariants: Variant[] = []
  for (const size of sizeOptions.slice(1, 6)) { // S through XXL (shoe sizes)
    for (const color of [colorOptions[0], colorOptions[1]]) { // Black, White
      const variant = await payload.create({
        collection: 'variants',
        depth: 0,
        data: {
          product: sneakersProduct.id,
          title: `Running Sneakers - ${color.label} - ${size.label}`,
          options: [color.id, size.id],
          inventory: Math.floor(Math.random() * 20) + 5,
          priceInUSDEnabled: true,
          priceInUSD: 12999,
          _status: 'published',
        },
      })
      sneakersVariants.push(variant)
    }
  }

  // Product 4: Summer Dress (Women's)
  const dressProduct = await payload.create({
    collection: 'products',
    depth: 0,
    data: {
      title: 'Elegant Summer Dress',
      slug: 'elegant-summer-dress',
      description: createDescription(
        'Beautiful summer dress made from lightweight, flowy fabric. Perfect for warm weather occasions. Available in multiple colors and sizes.'
      ),
      enableVariants: true,
      variantTypes: [colorType.id, sizeType.id],
      categories: [womensCategory.id, clothingCategory.id],
      gallery: [{ image: images.dress?.id }],
      meta: {
        title: 'Elegant Summer Dress | Fashion Forward',
        description: 'Beautiful summer dress for warm weather.',
        image: images.dress?.id,
      },
      priceInUSDEnabled: true,
      priceInUSD: 5999, // $59.99
      inventory: 0,
      facetValues: [
        colorFacetValues.white.id,
        colorFacetValues.red.id,
        colorFacetValues.green.id,
        sizeFacetValues.xs.id,
        sizeFacetValues.small.id,
        sizeFacetValues.medium.id,
        sizeFacetValues.large.id,
        sizeFacetValues.xlarge.id,
      ],
      _status: 'published',
    },
  })

  // Create variants for Dress
  const dressVariants: Variant[] = []
  for (const size of [sizeOptions[0], sizeOptions[1], sizeOptions[2], sizeOptions[3], sizeOptions[4]]) { // XS through XL
    for (const color of [colorOptions[1], colorOptions[3], colorOptions[5]]) { // White, Red, Green
      const variant = await payload.create({
        collection: 'variants',
        depth: 0,
        data: {
          product: dressProduct.id,
          title: `Summer Dress - ${color.label} - ${size.label}`,
          options: [color.id, size.id],
          inventory: Math.floor(Math.random() * 25) + 5,
          priceInUSDEnabled: true,
          priceInUSD: 5999,
          _status: 'published',
        },
      })
      dressVariants.push(variant)
    }
  }

  // Product 5: Hooded Sweatshirt (Unisex)
  const hoodieProduct = await payload.create({
    collection: 'products',
    depth: 0,
    data: {
      title: 'Comfortable Hooded Sweatshirt',
      slug: 'comfortable-hooded-sweatshirt',
      description: createDescription(
        'Cozy and comfortable hooded sweatshirt perfect for casual wear. Made from soft, warm fabric with a spacious hood and front pocket.'
      ),
      enableVariants: true,
      variantTypes: [colorType.id, sizeType.id],
      categories: [mensCategory.id, womensCategory.id, clothingCategory.id],
      gallery: [{ image: images.hoodie?.id }],
      meta: {
        title: 'Comfortable Hooded Sweatshirt | Cozy & Warm',
        description: 'Cozy hooded sweatshirt for casual comfort.',
        image: images.hoodie?.id,
      },
      priceInUSDEnabled: true,
      priceInUSD: 4999, // $49.99
      inventory: 0,
      facetValues: [
        colorFacetValues.black.id,
        colorFacetValues.white.id,
        colorFacetValues.gray.id,
        sizeFacetValues.small.id,
        sizeFacetValues.medium.id,
        sizeFacetValues.large.id,
        sizeFacetValues.xlarge.id,
        sizeFacetValues.xxlarge.id,
      ],
      _status: 'published',
    },
  })

  // Create variants for Hoodie
  const hoodieVariants: Variant[] = []
  for (const size of sizeOptions.slice(1, 6)) { // S through XXL
    for (const color of [colorOptions[0], colorOptions[1], colorOptions[4]]) { // Black, White, Gray
      const variant = await payload.create({
        collection: 'variants',
        depth: 0,
        data: {
          product: hoodieProduct.id,
          title: `Hooded Sweatshirt - ${color.label} - ${size.label}`,
          options: [color.id, size.id],
          inventory: Math.floor(Math.random() * 40) + 10,
          priceInUSDEnabled: true,
          priceInUSD: 4999,
          _status: 'published',
        },
      })
      hoodieVariants.push(variant)
    }
  }

  // Product 6: Smartphone (Electronics - no variants, just one model)
  const smartphoneProduct = await payload.create({
    collection: 'products',
    depth: 0,
    data: {
      title: 'Premium Smartphone Pro',
      slug: 'premium-smartphone-pro',
      description: createDescription(
        'Latest generation smartphone with advanced camera system, powerful processor, and all-day battery life. Available in multiple storage options.'
      ),
      enableVariants: false,
      categories: [smartphonesCategory.id, electronicsCategory.id],
      gallery: [{ image: images.phone?.id }],
      meta: {
        title: 'Premium Smartphone Pro | Latest Technology',
        description: 'Latest generation smartphone with advanced features.',
        image: images.phone?.id,
      },
      priceInUSDEnabled: true,
      priceInUSD: 89999, // $899.99
      inventory: 25,
      facetValues: [], // Electronics products don't need color/size filters
      _status: 'published',
    },
  })

  // Product 7: Laptop (Electronics - no variants)
  const laptopProduct = await payload.create({
    collection: 'products',
    depth: 0,
    data: {
      title: 'Ultrabook Laptop 15"',
      slug: 'ultrabook-laptop-15',
      description: createDescription(
        'Sleek and powerful ultrabook laptop with high-resolution display, fast SSD storage, and long battery life. Perfect for work and creativity.'
      ),
      enableVariants: false,
      categories: [laptopsCategory.id, electronicsCategory.id],
      gallery: [{ image: images.laptop?.id }],
      meta: {
        title: 'Ultrabook Laptop 15" | Powerful & Portable',
        description: 'Sleek and powerful ultrabook laptop.',
        image: images.laptop?.id,
      },
      priceInUSDEnabled: true,
      priceInUSD: 129999, // $1299.99
      inventory: 15,
      facetValues: [], // Electronics products don't need color/size filters
      _status: 'published',
    },
  })

  // Product 8: Wireless Headphones (Electronics - color variants only)
  const headphonesProduct = await payload.create({
    collection: 'products',
    depth: 0,
    data: {
      title: 'Premium Wireless Headphones',
      slug: 'premium-wireless-headphones',
      description: createDescription(
        'High-quality wireless headphones with noise cancellation, premium sound quality, and comfortable over-ear design. Available in multiple colors.'
      ),
      enableVariants: true,
      variantTypes: [colorType.id],
      categories: [headphonesCategory.id, electronicsCategory.id],
      gallery: [{ image: images.wirelessHeadphones?.id }],
      meta: {
        title: 'Premium Wireless Headphones | Superior Sound',
        description: 'High-quality wireless headphones with noise cancellation.',
        image: images.wirelessHeadphones?.id,
      },
      priceInUSDEnabled: true,
      priceInUSD: 19999, // $199.99
      inventory: 0,
      facetValues: [
        colorFacetValues.black.id,
        colorFacetValues.white.id,
        colorFacetValues.gray.id,
      ],
      _status: 'published',
    },
  })

  // Create variants for Headphones (color only)
  const headphonesVariants: Variant[] = []
  for (const color of [colorOptions[0], colorOptions[1], colorOptions[4]]) { // Black, White, Gray
    const variant = await payload.create({
      collection: 'variants',
      depth: 0,
      data: {
        product: headphonesProduct.id,
        title: `Wireless Headphones - ${color.label}`,
        options: [color.id],
        inventory: Math.floor(Math.random() * 30) + 10,
        priceInUSDEnabled: true,
        priceInUSD: 19999,
        _status: 'published',
      },
    })
    headphonesVariants.push(variant)
  }

  payload.logger.info('✅ Custom seed completed successfully!')
  payload.logger.info(`Created:`)
  payload.logger.info(`- ${Object.keys(images).length} media files`)
  payload.logger.info(`- 3 facets (Color, Size, Brand)`)
  payload.logger.info(`- ${Object.keys(colorFacetValues).length + Object.keys(sizeFacetValues).length} facet values`)
  payload.logger.info(`- 2 top-level categories (Clothing, Electronics)`)
  payload.logger.info(`- 6 nested categories`)
  payload.logger.info(`- 8 products (5 with variants, 3 without)`)
  payload.logger.info(`- Multiple variants for each product with variants`)
  payload.logger.info(`- All products with appropriate facetValues for filtering`)
}

