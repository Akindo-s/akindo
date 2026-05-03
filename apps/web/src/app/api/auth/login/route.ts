import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.akindapi || "http://127.0.0.1:8000";

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
      // no JSON body... que otra vez, no deberia pero por si acaso  hay que poner algo
    }
    return NextResponse.json(
      { error: err.detail ?? "Credenciales inválidas" },
      { status: res.status }
    );
  }

  const { access_token, tipo_usuario } = (await res.json()) as { access_token: string, tipo_usuario: string };

  const response = NextResponse.json({ ok: true, tipo_usuario });
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24, // 24 h
  };
  
  response.cookies.set("token", access_token, cookieOptions);
  response.cookies.set("tipo_usuario", tipo_usuario, cookieOptions);

  return response;
}
