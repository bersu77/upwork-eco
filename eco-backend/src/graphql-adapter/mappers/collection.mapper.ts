import { mapAsset } from './product.mapper'

export function mapCollection(category: any): any {
  if (!category) return null

  return {
    id: category.id,
    name: category.title,
    slug: category.slug,
    description: category.description || '',
    featuredAsset: category.featuredAsset ? mapAsset(category.featuredAsset) : null,
    parent: category.parent ? {
      id: typeof category.parent === 'object' ? category.parent.id : category.parent,
      name: typeof category.parent === 'object' ? (category.parent.title || category.parent) : null,
    } : { name: '__root_collection__' },
    breadcrumbs: [
      ...(category.breadcrumbs?.map((bc: any) => {
        // Handle breadcrumb doc - it can be an object (populated) or just an ID
        const doc = bc.doc
        const docId = typeof doc === 'object' ? doc.id : doc
        // If doc is populated, use its slug; otherwise we'll need to resolve it
        // Since resolver uses depth: 3, breadcrumbs should be populated
        const docSlug = typeof doc === 'object' && doc.slug ? doc.slug : ''

        return {
          id: String(docId),
          name: bc.label || '',
          slug: docSlug,
        }
      }) || []),
      {
        id: String(category.id),
        name: category.title,
        slug: category.slug,
      }
    ],
    children: [],
  }
}


export function mapCollectionList(categories: any[]): any {
  return {
    items: categories.map(mapCollection),
    totalItems: categories.length,
  }
}

