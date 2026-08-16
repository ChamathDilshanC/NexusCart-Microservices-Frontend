import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api";

async function proxyRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }, method: string) {
  const p = await params;
  const path = p.path.join('/');
  
  // The API Gateway routes are: /api/auth, /api/business, /api/products, etc.
  // Our frontend calls /api/business/register, which hits this proxy with path="business/register"
  const serviceUrl = `${BACKEND_URL}/${path}`;

  try {
    const token = req.headers.get('Authorization');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = token;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method !== 'GET' && method !== 'HEAD') {
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const body = await req.json().catch(() => null);
        if (body) {
          fetchOptions.body = JSON.stringify(body);
          headers['Content-Type'] = 'application/json';
        }
      }
    }

    const res = await fetch(serviceUrl, fetchOptions);
    const data = await res.json().catch(() => null);

    return NextResponse.json(data || {}, { status: res.status });
  } catch (error) {
    console.error(`API Proxy Error [${method} /${path}]:`, error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, props, 'GET'); }
export async function POST(req: NextRequest, props: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, props, 'POST'); }
export async function PUT(req: NextRequest, props: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, props, 'PUT'); }
export async function PATCH(req: NextRequest, props: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, props, 'PATCH'); }
export async function DELETE(req: NextRequest, props: { params: Promise<{ path: string[] }> }) { return proxyRequest(req, props, 'DELETE'); }
