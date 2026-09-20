import { NextRequest, NextResponse } from "next/server";
import { safeFetch } from "@/lib/resilience";
import { guardProxyRequest } from "@/lib/resilience/proxyGuard";

const METACOMP_BASE = "https://www.metacomp.ai";
const METACOMP_API_KEY = process.env.METACOMP_API_KEY ?? "";

export async function POST(request: NextRequest) {
  const denied = guardProxyRequest(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { network, transactionDetails } = body;

    if (!network || !transactionDetails || !Array.isArray(transactionDetails)) {
      return NextResponse.json(
        { error: "Missing required fields: network and transactionDetails" },
        { status: 400 }
      );
    }

    const response = await safeFetch(`${METACOMP_BASE}/api/v1/transactionCheck`, {
      method: "POST",
      timeoutMs: 15_000,
      allowlist: ["www.metacomp.ai"],
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${METACOMP_API_KEY}`,
      },
      body: JSON.stringify({ network, transactionDetails }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`MetaComp upstream error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `MetaComp API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Transaction check error:", error);
    return NextResponse.json(
      { error: "Internal server error while checking transaction" },
      { status: 500 }
    );
  }
}
