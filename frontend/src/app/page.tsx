'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { session } from '@/lib/session';

export default function Home() {
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    setIsAuthenticated(session.isAuthenticated());

    // Fetch API message
    fetch('http://localhost:8000/api/hello')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error(err));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-900 mb-2">Welcome</h1>
          <h2 className="text-2xl text-gray-600 mb-8">Next.js + FastAPI + JWT Auth</h2>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <p className="text-lg text-gray-700 mb-4">{message}</p>
            <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
        </div>

        <div className="space-y-4">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
                <Link
                  href="/generate"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-lg hover:shadow-xl text-center"
                >
                  🤖 Generate Content
                </Link>
                <Link
                  href="/voice-context"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-lg hover:shadow-xl text-center"
                >
                  🎤 Voice Context
                </Link>
              </div>
              <Link
                href="/me"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
              >
                Go to Profile
              </Link>
              <button
                onClick={() => {
                  session.clear();
                  setIsAuthenticated(false);
                }}
                className="block mx-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                href="/login"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-500 mt-8">
          <p>Built with Next.js, FastAPI, and JWT Authentication</p>
        </div>
      </div>
    </main>
  );
}
