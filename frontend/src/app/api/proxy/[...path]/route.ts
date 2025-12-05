import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/env';

const BACKEND_URL = getBackendUrl();

/**
 * Proxy API route to forward requests to the backend
 * This makes all requests appear same-origin, allowing samesite="lax" cookies to work
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'PATCH');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = `/${pathSegments.join('/')}`;
    const url = new URL(path, BACKEND_URL);
    
    // Forward query parameters
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    // Get request body if present
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text();
      } catch {
        // No body
      }
    }

    // Forward request to backend
    const backendResponse = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        // Forward cookies from the incoming request
        Cookie: request.headers.get('Cookie') || '',
      },
      body,
    });

    // Get response body
    const responseBody = await backendResponse.text();
    
    // Create response with same status and headers
    const response = new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
    });

    // Forward Set-Cookie headers from backend (this sets cookies on the frontend domain)
    // Rewrite cookie domain to match frontend domain (localhost:3000)
    const setCookieHeaders = backendResponse.headers.getSetCookie();
    setCookieHeaders.forEach((cookie) => {
      // Remove domain attribute if present (so cookie is set for current domain)
      // Also ensure path is set correctly
      let rewrittenCookie = cookie;
      
      // Remove any domain= attribute (replace domain=localhost:8000 or domain=localhost with nothing)
      rewrittenCookie = rewrittenCookie.replace(/;\s*domain=[^;]*/gi, '');
      
      // Ensure path is / if not already set
      if (!rewrittenCookie.includes('Path=')) {
        rewrittenCookie += '; Path=/';
      }
      
      response.headers.append('Set-Cookie', rewrittenCookie);
    });

    // Forward other important headers
    const contentType = backendResponse.headers.get('Content-Type');
    if (contentType) {
      response.headers.set('Content-Type', contentType);
    }

    return response;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

