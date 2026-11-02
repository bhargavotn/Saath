import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Signed out successfully.",
  });

  response.cookies.delete("saath_session");
  response.cookies.delete("saath_auth_user");
  response.cookies.set("saath_session", "", { path: "/", maxAge: 0 });

  return response;
}

