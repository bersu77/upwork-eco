import { productResolvers } from './product.resolver'
import { collectionResolvers } from './collection.resolver'
import { cartResolvers } from './cart.resolver'
import { checkoutResolvers } from './checkout.resolver'
import { customerResolvers } from './customer.resolver'


export const resolvers = {
  Query: {
    ...productResolvers.Query,
    ...collectionResolvers.Query,
    ...cartResolvers.Query,
    ...customerResolvers.Query,
    ...checkoutResolvers.Query,
  },
  Mutation: {
    ...cartResolvers.Mutation,
    ...checkoutResolvers.Mutation,
    ...customerResolvers.Mutation,
  },
  Customer: customerResolvers.Customer,
  PriceSearchResult: productResolvers.PriceSearchResult,

  LoginResult: {
    __resolveType(obj: any) {
      if (obj.identifier) return 'CurrentUser'
      if (obj.errorCode) return 'InvalidCredentialsError'
      return null
    },
  },
  RegisterResult: {
    __resolveType(obj: any) {
      if (obj.success !== undefined) return 'Success'
      if (obj.errorCode) return 'GenericError'
      return null
    },
  },
  VerifyResult: {
    __resolveType(obj: any) {
      if (obj.identifier) return 'CurrentUser'
      if (obj.success !== undefined) return 'Success'
      if (obj.errorCode) return 'GenericError'
      return null
    },
  },
  ResetPasswordResult: {
    __resolveType(obj: any) {
      if (obj.identifier) return 'CurrentUser'
      if (obj.success !== undefined) return 'Success'
      if (obj.errorCode) return 'GenericError'
      return null
    },
  },
  RequestPasswordResetResult: {
    __resolveType(obj: any) {
      if (obj.success !== undefined) return 'Success'
      if (obj.errorCode) return 'GenericError'
      return null
    },
  },
  UpdateEmailResult: {
    __resolveType(obj: any) {
      if (obj.success !== undefined) return 'Success'
      if (obj.errorCode) return 'GenericError'
      return null
    },
  },
  UpdateCustomerResult: {
    __resolveType(obj: any) {
      if (obj.emailAddress) return 'Customer'
      if (obj.errorCode) return 'GenericError'
      return null
    },
  },
  UpdatePasswordResult: {
    __resolveType(obj: any) {
      if (obj.success !== undefined) return 'Success'
      if (obj.errorCode) return 'GenericError'
      return null
    },
  },
  OrderResult: {
    __resolveType(obj: any) {
      if (obj.code) return 'Order'
      if (obj.errorCode === 'NOT_FOUND') return 'NotFoundError'
      if (obj.errorCode) return 'GenericError'
      return null
    },
  },
  AddressResult: {
    __resolveType(obj: any) {
      if (obj.streetLine1 || obj.city) return 'Address'
      if (obj.errorCode) return 'GenericError'
      return null
    },
  },
  DeleteResult: {
    __resolveType(obj: any) {
      if (obj.success !== undefined) return 'Success'
      if (obj.errorCode) return 'GenericError'
      return null
    },
  },
}

