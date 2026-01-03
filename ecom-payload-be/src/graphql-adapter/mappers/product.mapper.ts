import type { Product as PayloadProduct } from '@/payload-types'

/**
 * Converts a relative URL to an absolute URL by prepending the server URL
 * @param url - The URL to convert (can be relative or absolute)
 * @returns Absolute URL string
 */
function getAbsoluteUrl(url: string | null | undefined): string {
  if (!url) return ''
  
  // If already absolute, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // Get server URL from environment, default to localhost:3000
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  
  // Remove trailing slash from serverUrl if present
  const baseUrl = serverUrl.replace(/\/$/, '')
  
  // Ensure url starts with /
  const path = url.startsWith('/') ? url : `/${url}`
  
  return `${baseUrl}${path}`
}

export function mapProduct(product: any): any {
  if (!product) return null

  const assets = product.gallery?.map((item: any) => mapAsset(item.image)).filter(Boolean) || []
  
  if (assets.length === 0) {
    assets.push({
      id: 'placeholder',
      preview: '/asset_placeholder.webp',
      source: '/asset_placeholder.webp',
      name: 'placeholder',
      width: 800,
      height: 800,
    })
  }

  return {
    id: product.id,
    name: product.title,
    slug: product.slug,
    description: extractTextFromRichText(product.description),
    featuredAsset: assets[0],
    assets,
    variants: mapVariants(product),
    facetValues: product.facetValues?.map((fv: any) => mapFacetValue(fv)) || [],
    collections: product.categories?.map((cat: any) => mapCollection(cat)) || [],
  }
}

export function mapAsset(media: any): any {
  if (!media) return null
  
  const mediaData = typeof media === 'object' ? media : media

  // Get the URL, fallback to constructing from filename if url is not available
  let url = mediaData.url || ''
  
  // If url is missing but filename exists, construct the path
  if (!url && mediaData.filename) {
    url = `/media/${mediaData.filename}`
  }
  
  // Convert to absolute URL for frontend consumption
  const absoluteUrl = getAbsoluteUrl(url)

  return {
    id: mediaData.id,
    name: mediaData.filename || mediaData.alt || 'product-image',
    preview: absoluteUrl,
    source: absoluteUrl,
    width: mediaData.width,
    height: mediaData.height,
  }
}


export function mapVariants(product: any): any[] {
  const variants = []

  // Debug logging
  console.log('[mapVariants] Product ID:', product.id, 'EnableVariants:', product.enableVariants)
  console.log('[mapVariants] Variants structure:', {
    hasVariants: !!product.variants,
    hasDocs: !!product.variants?.docs,
    docsLength: product.variants?.docs?.length || 0,
    variantsType: typeof product.variants,
  })

  if (product.enableVariants && product.variants?.docs?.length > 0) {
    // Filter only published variants
    const publishedVariants = product.variants.docs.filter((variant: any) => {
      const variantData = typeof variant === 'object' ? variant : variant
      const isPublished = variantData._status === 'published' || variantData._status === undefined
      console.log('[mapVariants] Variant:', variantData.id, 'Status:', variantData._status, 'Published:', isPublished)
      return isPublished
    })

    console.log('[mapVariants] Published variants count:', publishedVariants.length, 'out of', product.variants.docs.length)

    for (const variant of publishedVariants) {
      // Handle variant that might be an ID or object
      const variantData = typeof variant === 'object' ? variant : variant
      
      const variantId = `${product.id}-${variantData.id}`
      console.log('[PRODUCT MAPPER DEBUG] Creating variant:', {
        productId: product.id,
        variantId: variantData.id,
        combinedId: variantId,
        variantTitle: variantData.title,
        productTitle: product.title,
      })
      
      variants.push({
        id: variantId,
        name: variantData.title || product.title,
        sku: variantData.sku || `${product.id}-${variantData.id}`,
        priceWithTax: variantData.priceInUSD || product.priceInUSD || 0,
        currencyCode: 'USD',
        stockLevel: getStockLevel(variantData.inventory),
        featuredAsset: variantData.gallery?.[0]?.image 
          ? mapAsset(variantData.gallery[0].image) 
          : (product.gallery?.[0]?.image ? mapAsset(product.gallery[0].image) : null),
      })
    }

    console.log('[mapVariants] Mapped variants count:', variants.length)
  } else {
    console.log('[mapVariants] No variants found, creating default variant')
    const defaultVariantId = `${product.id}-default`
    console.log('[PRODUCT MAPPER DEBUG] Creating default variant:', {
      productId: product.id,
      defaultVariantId,
      productTitle: product.title,
    })
    
    variants.push({
      id: defaultVariantId,
      name: product.title,
      sku: product.sku || `PROD-${product.id}`,
      priceWithTax: product.priceInUSD || 0,
      currencyCode: 'USD',
      stockLevel: getStockLevel(product.inventory),
      featuredAsset: product.gallery?.[0]?.image ? mapAsset(product.gallery[0].image) : null,
    })
  }

  console.log('[mapVariants] Final variants array length:', variants.length)
  return variants
}


function extractTextFromRichText(richText: any): string {
  if (!richText) return ''
  
  if (typeof richText === 'string') return richText

  if (richText.root?.children) {
    return richText.root.children
      .map((node: any) => {
        if (node.children) {
          return node.children.map((child: any) => child.text || '').join('')
        }
        return node.text || ''
      })
      .join('\n')
  }

  return JSON.stringify(richText)
}

function getStockLevel(inventory: any): string {
  if (!inventory) return 'OUT_OF_STOCK'
  
  const stock = typeof inventory === 'number' ? inventory : inventory.stock || 0

  if (stock > 10) return 'IN_STOCK'
  if (stock > 0) return 'LOW_STOCK'
  return 'OUT_OF_STOCK'
}

function mapFacetValue(facetValue: any): any {
  if (!facetValue) return null

  const fvData = typeof facetValue === 'object' ? facetValue : facetValue

  return {
    id: fvData.id,
    name: fvData.name,
    code: fvData.code,
    facet: fvData.facet ? {
      id: fvData.facet.id,
      name: fvData.facet.name,
      code: fvData.facet.code,
    } : null,
  }
}

function mapCollection(category: any): any {
  if (!category) return null

  const catData = typeof category === 'object' ? category : category

  return {
    id: catData.id,
    name: catData.title,
    slug: catData.slug,
    breadcrumbs: catData.breadcrumbs?.map((bc: any) => ({
      id: bc.doc?.id || bc.doc,
      name: bc.label,
      slug: bc.doc?.slug || '',
    })) || [],
  }
}

export function mapSearchResult(product: any): any {
  if (!product) return null

  const variants = mapVariants(product)
  const prices = variants.map(v => v.priceWithTax)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  const productAsset = product.gallery?.[0]?.image 
    ? mapAsset(product.gallery[0].image) 
    : {
        id: 'placeholder',
        preview: '/asset_placeholder.webp',
        source: '/asset_placeholder.webp',
        name: 'placeholder',
        width: 800,
        height: 800,
      }

  return {
    productId: product.id,
    productName: product.title,
    slug: product.slug,
    productAsset,
    priceWithTax: prices.length === 1 
      ? { __typename: 'SinglePrice', value: minPrice }
      : { __typename: 'PriceRange', min: minPrice, max: maxPrice },
    currencyCode: 'USD',
  }
}

