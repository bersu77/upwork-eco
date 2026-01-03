import type { FieldHook } from 'payload'

export const populateFullName: FieldHook = ({ data, operation, value }) => {
  if (value) {
    return value
  }
  if (operation === 'create' || operation === 'update') {
    const firstName = data?.firstName || ''
    const lastName = data?.lastName || ''
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim()
    }
  }

  return value
}

