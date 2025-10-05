import { NextAuthOptions } from 'next-auth'
import CognitoProvider from 'next-auth/providers/cognito'

export const authOptions: NextAuthOptions = {
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER!,
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.cognitoSub = account.providerAccountId
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.cognitoSub = token.cognitoSub
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === 'cognito') {
        try {
          // Use CMS URL based on environment
          const cmsUrl = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:4000';
          const response = await fetch(`${cmsUrl}/api/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cognitoSub: account.providerAccountId,
              email: user.email,
              name: user.name,
            }),
          })
          
          if (!response.ok) {
            console.error('Failed to create user in database')
          }
        } catch (error) {
          console.error('Error creating user:', error)
        }
      }
      return true
    },
  },
  session: {
    strategy: 'jwt',
  },
}