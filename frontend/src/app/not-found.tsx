'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 bg-brand-blue rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-white">404</span>
          </div>

          <h1 className="text-3xl font-bold text-brand-dark mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted,
            or doesn't exist.
          </p>

          <div className="space-y-4">
            <Link
              href="/"
              className="inline-block w-full bg-brand-blue hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
            >
              Go Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full bg-brand-dark hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
