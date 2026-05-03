import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const res = await fetch(`${API_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    let err: { detail?: string } = {};
    try {
      err = await res.json();
    } catch (_) {
      // no JSON body
    }
    return NextResponse.json(
      { error: err.detail ?? "Credenciales inválidas" },
      { status: res.status }
    );
  }

  const { access_token } = (await res.json()) as { access_token: string };

  const response = NextResponse.json({ ok: true });
  response.cookies.set("token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 h
  });

  return response;
}
