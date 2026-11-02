import { NextResponse } from "next/server";

const DJANGO_URL = process.env.DJANGO_API_URL || "http://127.0.0.1:8000/api";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { email, password } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    let userData: any = null;

    // 1. Attempt authentication with Django backend
    try {
      const djangoRes = await fetch(`${DJANGO_URL}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await djangoRes.json()) as any;
      if (djangoRes.ok && data.status === "success") {
        userData = data.user;
      } else {
        return NextResponse.json({ error: data.message || "Invalid credentials." }, { status: djangoRes.status || 401 });
      }
    } catch (fetchErr) {
      // 2. If Django is unreachable, check demo credential fallback
      if (email.toLowerCase().includes("client") || email.toLowerCase().includes("aarav") || email.toLowerCase() === "demo@saath.org") {
        userData = {
          id: "aarav-local-id",
          email,
          fullName: "Aarav Sharma",
          displayName: "Aarav Sharma",
          activeRole: "client",
          clientEnrolled: true,
          listenerEnrolled: false,
          pairingCode: "SAATH-7749",
        };
      } else if (email.toLowerCase().includes("listener") || email.toLowerCase().includes("meera")) {
        userData = {
          id: "meera-listener-id",
          email,
          fullName: "Meera Patel",
          displayName: "Meera Patel",
          activeRole: "listener",
          clientEnrolled: true,
          listenerEnrolled: true,
          pairingCode: "MEERA-9912",
        };
      } else {
        return NextResponse.json({ error: "Could not reach authentication service. Please ensure the backend is running." }, { status: 503 });
      }
    }

    const response = NextResponse.json({
      success: true,
      user: userData,
      message: `Signed in as ${userData.fullName || userData.displayName}`,
    });

    // Set cookie for Next.js SSR and client
    const sessionCookieVal = encodeURIComponent(JSON.stringify(userData));
    response.cookies.set("saath_session", sessionCookieVal, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Login failed." }, { status: 500 });
  }
}
