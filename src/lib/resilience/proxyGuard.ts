import {
  guardProxyRequest as guardProxyRequestCore,
  SlidingWindowRateLimiter,
} from "@cubiczan/resilience";

/**
 * Shared guard for the MetaComp proxy routes — thin adapter over the canonical
 * `@cubiczan/resilience` proxy guard: fail-closed caller-secret header check
 * plus per-IP sliding-window rate limiting, so anonymous clients cannot
 * exhaust the upstream API quota.
 *
 * One shared limiter across all proxy routes (single-process): 30 req / 60s
 * per IP. The expected secret comes from PROXY_API_SECRET, read at call time
 * (the vendored copy frozen it at module load). If it is unset the guard
 * FAILS CLOSED (503) — it never degrades to allowing the request. The
 * fail-closed check itself lives in the package core (`checkProxyRequest`):
 * an unset/empty secret short-circuits to `503 Server misconfigured` before
 * any header comparison, enforced for every caller of this adapter and
 * covered by the canonical test suite (fail-closed cases in
 * test/proxyGuard.test.ts). Client IPs follow the canonical trusted-hop rule
 * (`trustedProxyCount`, default 1) — spoofed leftmost x-forwarded-for
 * entries are ignored.
 */
const limiter = new SlidingWindowRateLimiter({ limit: 30, windowMs: 60_000 });

/**
 * Returns a `Response` to send when the request is rejected (503 / 401 / 429),
 * or `null` when the caller is authorized and within rate limits. Accepts any
 * `Request`, including Next.js `NextRequest`.
 */
export function guardProxyRequest(request: Request): Response | null {
  return guardProxyRequestCore(request, { limiter });
}
