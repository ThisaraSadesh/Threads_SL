import { NextRequest, NextResponse } from "next/server";
import * as Ably from "ably";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  return NextResponse.json({ message: "Ably token endpoint is working" });
}

export async function POST(request: NextRequest) {
  console.log("Ably token request received");

  if (!process.env.ABLY_API_KEY) {
    console.error("ABLY_API_KEY environment variable is not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const client = new Ably.Rest({ key: process.env.ABLY_API_KEY });
  const user = await currentUser();

  if (!user) {
    console.log("No authenticated user found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("Creating token for user:", user.id);

  try {
   const token = await client.auth.createTokenRequest({
      clientId: user.id,
      capability: {
        "*": ["presence", "subscribe", "publish"], // Add presence capability
      },
    });

    console.log("Token created successfully");
    return NextResponse.json(token);
  } catch (error) {
    console.error("Ably token creation error:", error);
    return NextResponse.json(
      { error: "Token creation failed" },
      { status: 500 }
    );
  }
}
