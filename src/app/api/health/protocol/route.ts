import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "crypto";
import { safeFetch } from "@/lib/resilience";

// Row 19 — protocol-level health probe with reason-code standardization.
// Contract (mirrors incident-commander PR #5 discipline):
// - Liveness is 200-always; dependency failures are encoded in the body.
// - The unauthenticated surface is CONFIG-ONLY: it never calls upstream.
// - The deep probe requires a timing-safe bearer match on
//   PROTOCOL_HEALTH_TOKEN; when unset, probing is refused (fail-closed).
// - Probes are cached for PROBE_TTL_MS and classified to reason codes;
//   raw upstream response text is never included in any response.

const METACOMP_BASE = "https://www.metacomp.ai";
const METACOMP_ALLOWLIST = ["www.metacomp.ai"];
const PROBE_TIMEOUT_MS = 5_000;
const PROBE_TTL_MS = 60_000;

let cachedProbe: { at: number; payload: ProtocolProbe } | null = null;

interface ProtocolProbe {
  probed: boolean;
  reason: string;
  upstream_status?: number;
  protocol_fingerprint?: string;
}

function tokenMatches(candidate: string | null, secret: string): boolean {
  if (!candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function probeUpstream(): Promise<ProtocolProbe> {
  try {
    const response = await safeFetch(METACOMP_BASE, {
      method: "GET",
      timeoutMs: PROBE_TIMEOUT_MS,
      allowlist: METACOMP_ALLOWLIST,
    });
    // Schema fingerprint over the protocol's observable shape: status class
    // and content type — never the body. Drift between fingerprints across
    // calls is the schema-drift alarm.
    const fingerprint = createHash("sha256")
      .update(`${Math.floor(response.status / 100)}xx:${response.headers.get("content-type") ?? "none"}`)
      .digest("hex")
      .slice(0, 16);
    if (response.status >= 500) {
      return { probed: true, reason: "UPSTREAM_DEGRADED", upstream_status: response.status, protocol_fingerprint: fingerprint };
    }
    return { probed: true, reason: "UPSTREAM_REACHABLE", upstream_status: response.status, protocol_fingerprint: fingerprint };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { probed: true, reason: "UPSTREAM_TIMEOUT" };
    }
    return { probed: true, reason: "UPSTREAM_UNREACHABLE" };
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.PROTOCOL_HEALTH_TOKEN ?? "";
  const authorized = secret.length > 0 && tokenMatches(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null, secret);

  const protocol = {
    // Configuration facts only — no secrets, no values. The proxy guard
    // contract: PROXY_API_SECRET is fail-closed (unset => 503 on proxy
    // routes); client IPs follow the canonical trusted-hop rule
    // (trustedProxyCount default 1).
    proxy_guard: {
      caller_secret_configured: Boolean(process.env.PROXY_API_SECRET),
      fail_closed_when_unset: true,
      trusted_hop_default: 1,
      upstream_allowlist: METACOMP_ALLOWLIST,
    },
    metacomp_api_key_configured: Boolean(process.env.METACOMP_API_KEY),
  };

  if (!authorized) {
    // 200-always liveness; probing refused with a reason code (fail-closed).
    return NextResponse.json({
      status: "ok",
      protocol,
      probe: { probed: false, reason: secret ? "PROBE_AUTH_REQUIRED" : "PROBE_DISABLED_TOKEN_UNCONFIGURED" },
    });
  }

  const now = Date.now();
  if (cachedProbe && now - cachedProbe.at < PROBE_TTL_MS) {
    return NextResponse.json({
      status: "ok",
      protocol,
      probe: cachedProbe.payload,
      cached: true,
    });
  }

  const probe = await probeUpstream();
  cachedProbe = { at: now, payload: probe };
  return NextResponse.json({ status: "ok", protocol, probe, cached: false });
}
