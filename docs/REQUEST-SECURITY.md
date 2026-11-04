# Pre-auth request protection (v67)

The game uses authenticated `POST /api/presence`. Anonymous `GET` snapshots are closed with HTTP 405, `Allow: POST`, `Cache-Control: no-store`, and no database work. Toss CORS preflight allows POST only.

All seven mutation endpoints now call `guardSeaRequest` after the origin check and before reading/parsing the body, hashing a session token or querying its owner. The existing session, visitor-proof, expiry, per-visitor rate and seating ownership checks remain required.

The pre-auth allowance is shared per Cloudflare-supplied `CF-Connecting-IP` across session, presence, seats, fire-seats, campfire, fishing and boat. User-controlled visitor IDs, tokens, X-Forwarded-For and X-Real-IP do not select the network bucket. Network keys are hashed, as in existing session issuance. Missing edge IPs share a conservative development fallback bucket.

The allowance is at most 1,800 admitted requests per fixed minute per network. Each Worker isolate reserves 20 admissions from D1 atomically, then spends them in memory. Unused leases may reduce usable capacity; a new isolate does not get a fresh global budget. This avoids adding a database write on every normal heartbeat. Once denied, the isolate rejects that network locally until the next window, with HTTP 429 and Retry-After. Reservation failure returns 503 and backs off five seconds, without entering gameplay authentication. Older windows cannot reset a newer database bucket. Local state is bounded to 4,096 network keys; active budgets are not evicted to make room for rotating keys.

Existing stricter authenticated limits (150 presence requests/minute/visitor; 40 actions/minute/visitor; issuance/new-visitor/network budgets) still apply. The 1,800 pre-auth cap leaves headroom for normal polling by eight same-network visitors; it is a ceiling, not an entitlement or a cost guarantee. A fixed-window boundary can admit bursts across adjacent windows.

This is application/DB protection, not an upstream DDoS firewall. Every HTTP request still reaches the Worker; distributed attacks and isolate churn can still incur platform work and admission checks. No Sites tool available in this session configures a Cloudflare-native Rate Limiting binding or WAF rule, so no such protection is claimed. Add upstream protection when hosting controls allow it. This patch does not resolve server-authoritative positions, reward ownership or scripted valid-session bots.

Checks:
- `node tests/sea-ingress.test.mjs`: public reads without DB, credential/header rotation, shared multi-isolate budget, concurrent reservations, window reset, DB failure, web/Toss CORS.
- `node tests/sea-session.test.mjs` and `node tests/sea-presence.test.mjs`: existing ownership, expiry, seating and polling regression tests.
- Web/Toss builds and native adapter tests.
