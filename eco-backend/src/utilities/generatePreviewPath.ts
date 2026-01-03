import { PayloadRequest, CollectionSlug } from 'payload'

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  products: '/products',
  pages: '/test-preview',
  categories: '/collections',
}

// Qwik frontend URL - can be overridden via environment variable
const QWIK_FRONTEND_URL = process.env.QWIK_FRONTEND_URL || 'http://localhost:8080'

type Props = {
  collection: keyof typeof collectionPrefixMap
  slug: string
  req: PayloadRequest
}

export const generatePreviewPath = ({ collection, slug }: Props) => {
  // Allow empty strings, e.g. for the homepage
  if (slug === undefined || slug === null) {
    return null
  }

  // For pages collection, point to Qwik frontend test-preview route
  if (collection === 'pages') {
    const prefix = collectionPrefixMap[collection] || ''
    return `${QWIK_FRONTEND_URL}${prefix}/${slug}`
  }

  // For categories and products, point directly to Qwik frontend routes
  if (collection === 'categories' || collection === 'products') {
    const prefix = collectionPrefixMap[collection] || ''
    return `${QWIK_FRONTEND_URL}${prefix}/${slug}`
  }

  // For other collections, keep existing behavior (can be updated later)
  const encodedParams = new URLSearchParams({
    slug,
    collection,
    path: `${collectionPrefixMap[collection]}/${slug}`,
    previewSecret: process.env.PREVIEW_SECRET || '',
  })

  const url = `/next/preview?${encodedParams.toString()}`

  return url
}
