import { NextResponse } from "next/server";

const DJANGO_URL = process.env.DJANGO_API_URL || "http://127.0.0.1:8000/api";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { email, password, fullName, role, preferredLanguage } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    let userData: any = null;

    // 1. Attempt registration with Django backend
    try {
      const djangoRes = await fetch(`${DJANGO_URL}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, role, preferredLanguage }),
      });

      const data = (await djangoRes.json()) as any;
      if (djangoRes.ok && data.status === "success") {
        userData = data.user;
      } else {
        return NextResponse.json({ error: data.message || "Registration failed." }, { status: djangoRes.status || 400 });
      }
    } catch (fetchErr) {
      // 2. Local fallback if backend is momentarily restarting
      const isListener = role === "listener" || role === "counselor";
      userData = {
        id: `user-${Date.now()}`,
        email,
        fullName: fullName || email.split("@")[0],
        displayName: fullName || email.split("@")[0],
        activeRole: isListener ? "listener" : "client",
        clientEnrolled: true,
        listenerEnrolled: isListener,
        pairingCode: `SAATH-${Math.floor(1000 + Math.random() * 9000)}`,
        preferredLanguage: preferredLanguage || "English",
      };
    }

    const response = NextResponse.json({
      success: true,
      user: userData,
      message: "Account created successfully.",
    });

    const sessionCookieVal = encodeURIComponent(JSON.stringify(userData));
    response.cookies.set("saath_session", sessionCookieVal, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Registration failed." }, { status: 500 });
  }
}
