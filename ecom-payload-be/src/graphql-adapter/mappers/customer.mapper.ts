export function mapCustomer(user: any): any {
  if (!user) return null

  return {
    id: user.id,
    title: '',
    firstName: user.firstName || user.name?.split(' ')[0] || '',
    lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
    emailAddress: user.email,
    phoneNumber: user.phoneNumber,
    addresses: [],
    orders: null,
  }
}

export function mapAddress(address: any): any {
  if (!address) return null

  return {
    id: address.id,
    fullName: address.fullName,
    company: address.company,
    streetLine1: address.streetLine1,
    streetLine2: address.streetLine2,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    country: {
      id: 'US',
      code: address.country || 'US',
      name: getCountryName(address.country || 'US'),
    },
    phoneNumber: address.phoneNumber,
    defaultShippingAddress: address.defaultShippingAddress || false,
    defaultBillingAddress: address.defaultBillingAddress || false,
  }
}

function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    US: 'United States',
    CA: 'Canada',
    GB: 'United Kingdom',
    AU: 'Australia',
  }
  return countries[code] || code
}


export function mapCurrentUser(user: any): any {
  if (!user) return null

  return {
    id: user.id,
    identifier: user.email,
    channels: ['default'],
  }
}

