'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  const handleGoBack = () => {
    if (typeof window === 'undefined') return;
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.assign('/');
    }
  };

  return (
    <div className="not-found-page">
      <div className="not-found-content centered">
        <div className="not-found-digits">
          <span className="not-found-digit">4</span>
          <div className="not-found-illustration">
            <Image src="/404.png" width={220} height={220} alt="Lost astronaut" priority />
            <p className="not-found-subtext">
              This Page Is Under Construction.
              <br />
              <span>Come Back Soon!</span>
            </p>
          </div>
          <span className="not-found-digit">4</span>
        </div>
      </div>

      <div className="not-found-floating-actions">
        <button
          type="button"
          onClick={handleGoBack}
          aria-label="Go Back"
          className="not-found-icon-button"
        >
          ↩
        </button>
        <Link href="/" aria-label="Go Home" className="not-found-icon-button">
          <svg viewBox="0 0 48 48" className="not-found-home-icon" aria-hidden="true">
            <path
              d="M8 21L24 8l16 13v17H8V21Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}