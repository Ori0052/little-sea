# Presence optimization

- Moving, fishing, cooking, occupied boats or active peers: one-second refresh.
- Quiet resting: five-second refresh. Starting/stopping movement or changing an avatar is sent within one second.
- Hidden documents do not poll; visibility restoration refreshes immediately. Existing server leases expire naturally (boat 15 seconds, beach/fire seat 90 seconds); resume trusts the server response and cannot revive expired membership. Page closure still releases resources and revokes the session.
- Failed calls back off for 5/10/20/30 seconds; presence HTTP 429 waits at least 60 seconds.
- Expired presence/beach/fire rows are swept at most once per minute per Worker isolate, opportunistically on a heartbeat. Claims and snapshots independently enforce expiry. A restart may cause an additional harmless sweep.
- Boat snapshots filter expired passengers instead of deleting on every read. Boarding prunes expired rows before claiming a seat. Empty boats with no captain no longer issue a redundant UPDATE.
- Authentication, origin restrictions, rate limits, concurrent seat guards and ownership checks remain server-side on every mutation.

Checks: `node tests/sea-presence.test.mjs`, `node tests/sea-session.test.mjs`, web/Toss builds and `node apps-in-toss/tests/platform.test.mjs`. Quiet idle polling falls from 60 to 12 requests per minute; total savings depend on activity, peers and actions. No hosting-bill reduction percentage is guaranteed.
