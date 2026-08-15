import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://api-gateway.salmondune-b6d2a6eb.centralindia.azurecontainerapps.io/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const p = await params;
  const path = p.path.join('/');
  
  // Decide which service to hit based on the path
  let serviceUrl = BACKEND_URL;
  if (path === 'business/register') {
    serviceUrl = `${BACKEND_URL}/business/register`; // Assuming gateway routes it correctly, or we use specific ports
  } else {
    // auth routes: login, register, verify
    serviceUrl = `${BACKEND_URL}/auth/${path}`;
  }

  try {
    const body = await req.json();
    const token = req.headers.get('Authorization');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = token;
    }

    const res = await fetch(serviceUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(data || {}, { status: res.status });
  } catch (error) {
    console.error("API Proxy Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
