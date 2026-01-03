import { GraphQLContext } from '../context'
import { mapCustomer, mapAddress, mapCurrentUser } from '../mappers/customer.mapper'
import { mapOrder } from '../mappers/order.mapper'

export const customerResolvers = {
  Query: {
    async activeCustomer(_: any, __: any, context: GraphQLContext) {
      const { payload, user } = context

      if (!user) {
        return null
      }

      try {
        const fullUser = await payload.findByID({
          collection: 'users',
          id: user.id,
          depth: 2,
        })

        const addressesResult = await payload.find({
          collection: 'addresses',
          where: {
            customer: { equals: user.id },
          },
          depth: 1,
        })

        const customer = mapCustomer(fullUser)
        customer.addresses = addressesResult.docs.map(mapAddress)

        return customer
      } catch (error) {
        console.error('Error fetching active customer:', error)
        return null
      }
    },
  },

  Customer: {
    async orders(parent: any, args: { options?: any }, context: GraphQLContext) {
      const { payload } = context
      const customerId = parent.id // Parent customer ID
      
      try {
        // Build where clause
        const where: any = {
          customer: { equals: customerId },
        }
        
        // Apply filter if provided
        // Frontend sends: filter: { active: { eq: false } }
        // This maps to: status = 'completed' (since active: false means completed)
        if (args.options?.filter?.active?.eq === false) {
          where.status = { equals: 'completed' }
        } else if (args.options?.filter?.active?.eq === true) {
          where.status = { not_equals: 'completed' }
        }
        
        // Convert sort object to Payload format
        // Frontend sends: { createdAt: 'DESC' } → Convert to: '-createdAt'
        let sortString = '-createdAt' // Default
        if (args.options?.sort) {
          const sortKey = Object.keys(args.options.sort)[0]
          const sortDirection = args.options.sort[sortKey]
          sortString = sortDirection === 'DESC' ? `-${sortKey}` : sortKey
        }
        
        console.log('[Customer Orders] Fetching orders:', {
          customerId,
          filter: args.options?.filter,
          sort: args.options?.sort,
          sortString,
          where,
        })
        
        const result = await payload.find({
          collection: 'orders',
          where,
          limit: args.options?.take || 10,
          skip: args.options?.skip || 0,
          sort: sortString,
          depth: 3,
        })
        
        console.log('[Customer Orders] Found orders:', {
          count: result.docs.length,
          totalDocs: result.totalDocs,
          orderIds: result.docs.map((doc: any) => doc.id),
        })
        
        return {
          items: result.docs.map(mapOrder),
          totalItems: result.totalDocs,
        }
      } catch (error) {
        console.error('Error fetching customer orders:', error)
        return { items: [], totalItems: 0 }
      }
    },
  },

  Mutation: {
    async login(
      _: any,
      args: { username: string; password: string; rememberMe?: boolean },
      context: GraphQLContext,
    ) {
      const { payload } = context

      try {
        const result = await payload.login({
          collection: 'users',
          data: {
            email: args.username,
            password: args.password,
          },
        })

        if (result.user && result.token) {
          context.authToken = result.token
          return mapCurrentUser(result.user)
        }

        // No user/token returned - return error object instead of throwing
        return {
          __typename: 'InvalidCredentialsError',
          errorCode: 'INVALID_CREDENTIALS',
          message: 'The email or password provided is incorrect',
        }
      } catch (error) {
        console.error('Error logging in:', error)
        // PayloadCMS threw an authentication error - return error object instead of throwing
        return {
          __typename: 'InvalidCredentialsError',
          errorCode: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials',
        }
      }
    },


    async logout(_: any, __: any, context: GraphQLContext) {
      try {
        // Clearing the auth token ensures the frontend overwrites/deletes it
        context.authToken = ''
      } catch (error) {
        console.error('Error during logout:', error)
      }

      return { success: true }
    },


    async registerCustomerAccount(
      _: any,
      args: { input: any },
      context: GraphQLContext,
    ) {
      const { payload } = context

      try {
        const { emailAddress, password, firstName, lastName, phoneNumber } = args.input

        // Check for duplicate email before attempting creation
        const existingUser = await payload.find({
          collection: 'users',
          where: {
            email: {
              equals: emailAddress,
            },
          },
          limit: 1,
        })

        if (existingUser.totalDocs > 0) {
          // Return error object instead of throwing
          return {
            errorCode: 'EMAIL_ALREADY_EXISTS',
            message: `An account with the email address ${emailAddress} already exists. Please try logging in instead.`,
          }
        }

        await payload.create({
          collection: 'users',
          data: {
            email: emailAddress,
            password,
            firstName,
            lastName,
            phoneNumber,
            roles: ['customer'],
          },
        })

        return { success: true }
      } catch (error: any) {
        console.error('Error registering customer:', error)

        // Extract error message
        let errorMessage = 'Failed to register customer account'
        let errorCode = 'REGISTRATION_FAILED'

        // Handle duplicate email error (in case it wasn't caught above)
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          return {
            errorCode: 'EMAIL_ALREADY_EXISTS',
            message: `An account with this email address already exists. Please try logging in instead.`,
          }
        }

        // Extract detailed error information from Payload's ValidationError
        if (error.name === 'ValidationError' || error.constructor?.name === 'ValidationError' || error.message?.includes('invalid')) {
          const validationData = error.data || {}
          const fieldErrors: string[] = []

          // Extract field-specific error messages
          if (validationData.email) {
            if (Array.isArray(validationData.email)) {
              fieldErrors.push(...validationData.email.map((err: any) => err.message || err))
            } else if (typeof validationData.email === 'string') {
              fieldErrors.push(`Email: ${validationData.email}`)
            } else if (validationData.email.message) {
              fieldErrors.push(`Email: ${validationData.email.message}`)
            }
          }

          // Check for other field errors
          Object.keys(validationData).forEach((field) => {
            if (field !== 'email') {
              const fieldError = validationData[field]
              if (Array.isArray(fieldError)) {
                fieldErrors.push(...fieldError.map((err: any) => `${field}: ${err.message || err}`))
              } else if (typeof fieldError === 'string') {
                fieldErrors.push(`${field}: ${fieldError}`)
              } else if (fieldError?.message) {
                fieldErrors.push(`${field}: ${fieldError.message}`)
              }
            }
          })

          // If we found field-specific errors, use them
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join(', ')
          } else if (error.message) {
            errorMessage = error.message
          }
        } else if (error instanceof Error && error.message) {
          errorMessage = error.message
        }

        // Return error object instead of throwing
        return {
          errorCode,
          message: errorMessage,
        }
      }
    },

    async verifyCustomerAccount(
      _: any,
      args: { token: string; password?: string },
      context: GraphQLContext,
    ) {
      // TODO: Implement email verification logic
      return { success: true }
    },

    async requestPasswordReset(
      _: any,
      args: { emailAddress: string },
      context: GraphQLContext,
    ) {
      // TODO: Implement password reset request logic
      // In production, this would send an email with a reset token
      return { success: true }
    },

    async resetPassword(
      _: any,
      args: { token: string; password: string },
      context: GraphQLContext,
    ) {
      // TODO: Implement password reset logic
      return { success: true }
    },

    async requestUpdateCustomerEmailAddress(
      _: any,
      args: { password: string; newEmailAddress: string },
      context: GraphQLContext,
    ) {
      // TODO: Implement email update request logic
      return { success: true }
    },

    async updateCustomerEmailAddress(
      _: any,
      args: { token: string },
      context: GraphQLContext,
    ) {
      // TODO: Implement email update logic
      return { success: true }
    },

    async updateCustomerPassword(
      _: any,
      args: { currentPassword: string; newPassword: string },
      context: GraphQLContext,
    ) {
      const { payload, user } = context

      if (!user) {
        return {
          __typename: 'GenericError',
          errorCode: 'UNAUTHORIZED',
          message: 'Must be logged in to update password',
        }
      }

      try {
        // Verify current password by attempting to login with it
        try {
          await payload.login({
            collection: 'users',
            data: {
              email: user.email,
              password: args.currentPassword,
            },
          })
        } catch (loginError) {
          console.error('Current password verification failed:', loginError)
          // Return error object instead of throwing
          return {
            __typename: 'GenericError',
            errorCode: 'INVALID_CREDENTIALS',
            message: 'Current password is incorrect',
          }
        }

        // If we get here, current password is correct - proceed with update
        await payload.update({
          collection: 'users',
          id: user.id,
          data: {
            password: args.newPassword,
          } as any,
        })

        return {
          __typename: 'Success',
          success: true,
        }
      } catch (error: any) {
        console.error('Error updating password:', error)
        // Return error object instead of throwing
        return {
          __typename: 'GenericError',
          errorCode: 'PASSWORD_UPDATE_FAILED',
          message: 'Failed to update password',
        }
      }
    },

    async updateCustomer(
      _: any,
      args: { input: any },
      context: GraphQLContext,
    ) {
      const { payload, user } = context

      if (!user) {
        throw new Error('Must be logged in to update profile')
      }

      try {
        const { firstName, lastName, phoneNumber, title } = args.input

        const updateData: any = {}
        if (firstName) updateData.firstName = firstName
        if (lastName) updateData.lastName = lastName
        if (phoneNumber) updateData.phoneNumber = phoneNumber
        if (title !== undefined) updateData.title = title

        const updatedUser = await payload.update({
          collection: 'users',
          id: user.id,
          data: updateData,
        })

        return mapCustomer(updatedUser)
      } catch (error) {
        console.error('Error updating customer:', error)
        throw new Error('Failed to update customer details')
      }
    },


    async createCustomerAddress(
      _: any,
      args: { input: any },
      context: GraphQLContext,
    ) {
      const { payload, user } = context

      if (!user) {
        throw new Error('Must be logged in to create address')
      }

      try {
        console.log('[CREATE ADDRESS] Input data:', args.input)
        console.log('[CREATE ADDRESS] User ID:', user.id)

        const addressData = {
          customer: user.id,
          fullName: args.input.fullName,
          company: args.input.company,
          streetLine1: args.input.streetLine1,
          streetLine2: args.input.streetLine2,
          city: args.input.city,
          province: args.input.province,
          postalCode: args.input.postalCode,
          country: args.input.countryCode,
          phoneNumber: args.input.phoneNumber,
          defaultShippingAddress: args.input.defaultShippingAddress || false,
          defaultBillingAddress: args.input.defaultBillingAddress || false,
        }

        console.log('[CREATE ADDRESS] Address data to create:', addressData)


        if (args.input.defaultShippingAddress) {
          await payload.update({
            collection: 'addresses',
            where: {
              customer: { equals: user.id },
              defaultShippingAddress: { equals: true },
            },
            data: {
              defaultShippingAddress: false,
            },
          })
        }

        if (args.input.defaultBillingAddress) {
          await payload.update({
            collection: 'addresses',
            where: {
              customer: { equals: user.id },
              defaultBillingAddress: { equals: true },
            },
            data: {
              defaultBillingAddress: false,
            },
          })
        }

        const address = await payload.create({
          collection: 'addresses',
          data: addressData,
        })

        console.log('[CREATE ADDRESS] Successfully created address with ID:', address.id)
        return mapAddress(address)
      } catch (error) {
        console.error('Error creating address:', error)
        throw new Error('Failed to create address')
      }
    },


    async updateCustomerAddress(
      _: any,
      args: { input: any },
      context: GraphQLContext,
    ) {
      const { payload, user } = context

      if (!user) {
        throw new Error('Must be logged in to update address')
      }

      try {
        const { id, ...addressData } = args.input

        console.log('[UPDATE ADDRESS] Input data:', { id, addressData })
        console.log('[UPDATE ADDRESS] User ID:', user.id)

        const existingAddress = await payload.findByID({
          collection: 'addresses',
          id,
        })

        // Handle both cases: customer as ID (number) or as populated object
        const customerId = typeof existingAddress.customer === 'object' && existingAddress.customer !== null
          ? existingAddress.customer.id
          : existingAddress.customer

        console.log('[UPDATE ADDRESS] Existing address customer field type:', typeof existingAddress.customer)
        console.log('[UPDATE ADDRESS] Customer ID:', customerId)

        if (!existingAddress || customerId !== user.id) {
          throw new Error('Address not found or unauthorized')
        }


        if (addressData.defaultShippingAddress) {
          await payload.update({
            collection: 'addresses',
            where: {
              customer: { equals: user.id },
              defaultShippingAddress: { equals: true },
              id: { not_equals: id },
            },
            data: {
              defaultShippingAddress: false,
            },
          })
        }

        if (addressData.defaultBillingAddress) {
          await payload.update({
            collection: 'addresses',
            where: {
              customer: { equals: user.id },
              defaultBillingAddress: { equals: true },
              id: { not_equals: id },
            },
            data: {
              defaultBillingAddress: false,
            },
          })
        }

        const updatedAddress = await payload.update({
          collection: 'addresses',
          id,
          data: {
            fullName: addressData.fullName,
            company: addressData.company,
            streetLine1: addressData.streetLine1,
            streetLine2: addressData.streetLine2,
            city: addressData.city,
            province: addressData.province,
            postalCode: addressData.postalCode,
            country: addressData.countryCode,
            phoneNumber: addressData.phoneNumber,
            defaultShippingAddress: addressData.defaultShippingAddress,
            defaultBillingAddress: addressData.defaultBillingAddress,
          },
        })

        console.log('[UPDATE ADDRESS] Successfully updated address:', id)
        return mapAddress(updatedAddress)
      } catch (error) {
        console.error('Error updating address:', error)
        throw new Error('Failed to update address')
      }
    },


    async deleteCustomerAddress(
      _: any,
      args: { id: string },
      context: GraphQLContext,
    ) {
      const { payload, user } = context

      if (!user) {
        throw new Error('Must be logged in to delete address')
      }

      try {
        const address = await payload.findByID({
          collection: 'addresses',
          id: args.id,
        })

        // Handle both cases: customer as ID (number) or as populated object
        const customerId = typeof address.customer === 'object' && address.customer !== null
          ? address.customer.id
          : address.customer

        console.log('[DELETE ADDRESS] Address ID:', args.id)
        console.log('[DELETE ADDRESS] Customer field type:', typeof address.customer)
        console.log('[DELETE ADDRESS] Customer ID:', customerId)
        console.log('[DELETE ADDRESS] User ID:', user.id)

        if (!address || customerId !== user.id) {
          throw new Error('Address not found or unauthorized')
        }

        await payload.delete({
          collection: 'addresses',
          id: args.id,
        })

        console.log('[DELETE ADDRESS] Successfully deleted address:', args.id)
        return { success: true }
      } catch (error) {
        console.error('Error deleting address:', error)
        throw new Error('Failed to delete address')
      }
    },
  },
}

