'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function AuthHeader() {
  const { data: session, status } = useSession();

  const handleSignIn = () => {
    const callbackUrl = process.env.NODE_ENV === 'production' 
      ? 'https://sliot.de' 
      : 'http://localhost:3000';
      
    signIn('cognito', { 
      callbackUrl,
    });
  };

  const handleSignUp = () => {
    const callbackUrl = process.env.NODE_ENV === 'production' 
      ? 'https://sliot.de' 
      : 'http://localhost:3000';
      
    // Use NextAuth for both - safer and more reliable
    // Cognito login page has a "Sign up" link for new users
    signIn('cognito', { 
      callbackUrl,
    });
  };

  if (status === 'loading') {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">SLIoT CMS</h1>
            <div className="animate-pulse">
              <div className="h-8 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-gray-900">SLIoT CMS</h1>
          
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <p className="text-gray-900 font-medium">
                      Welcome, {session.user?.name || session.user?.email}
                    </p>
                    <p className="text-gray-500">
                      {session.user?.email}
                    </p>
                  </div>
                  {session.user?.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="h-8 w-8 rounded-full"
                      src={session.user.image}
                      alt="Profile"
                    />
                  )}
                </div>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSignIn}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignUp}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}