# Collab WebSocket — single-connection-per-user policy is too restrictive

**Audience:** backend team (collab WS service).
**Owner (frontend side):** CollaborationToolPage migration phase, see [CONTEXT.md](./CONTEXT.md).
**Status:** open — frontend has a placeholder mitigation; backend fix needed for proper multi-device co-editing.

---

## What's happening today

When a user opens the same document in two browser tabs (or two devices, e.g. laptop + tablet) under the same JWT, the second connection causes the server to close the first with:

```
WebSocket close code 4000
reason: "Replaced by new connection"
```

The collab gateway treats `(user, room)` as the unique connection slot — only one WebSocket may exist per user per room. A new connection arrives, the older one is evicted.

## Why this is wrong for a collaborative editor

A document review tool has to handle these real-world scenarios:

1. **Same user, two devices.** A reviewer opens a contract on their laptop, then continues from their tablet during a meeting. Today: the laptop is kicked the moment the tablet connects.
2. **Same user, two tabs.** A reviewer has the document open in one tab and opens a side-by-side comparison view in another tab of the same browser. Today: one tab is constantly kicking the other.
3. **Re-authentication / token refresh.** If a JWT is refreshed and a new WS is opened before the old one is torn down, the new connection kicks the old one. Most refresh flows are fine, but any flow that does "open new, then close old" trips the policy.
4. **Stale connections after a network blip.** Browser puts the laptop to sleep → WS goes silent (server doesn't know it's dead yet) → user reopens on phone. The new one wins, but the laptop side experiences a kick-on-reconnect storm when it wakes up.

In every case, the user perception is "the document keeps disconnecting" with no recovery without a manual refresh.

## What we want

The connection slot should be keyed by a **per-connection identity**, not a per-user identity. Multiple simultaneous WS connections from the same user to the same room should be allowed and should each receive their own awareness state.

Concretely: replace the existing dedup logic so that the server keys connections by `(user, connectionId)` where `connectionId` is either:

- a random `uuid` generated server-side when the connection is accepted, **or**
- a `device-id` sent by the client during the handshake (e.g. as a second subprotocol or query param)

Option A (server-generated random id) is the simpler change and is what Hocuspocus / official y-websocket servers do out of the box.

## Why the fix is small

The Yjs sync + awareness protocols already handle multiple connections per user. The only thing y-websocket cares about per connection is the room name and the doc payload. Allowing N connections per user per room is the **default y-websocket behavior** — the single-slot policy is an opinionated layer that was added on top.

Removing it should be a delete, not a rewrite.

If there's a reason for the single-slot enforcement (avoiding "ghost" connections, license counting, etc.), let's discuss. Both can be solved without limiting active sessions to one:

- **Ghost cleanup:** rely on WebSocket ping/pong timeouts (y-websocket handles this) rather than evicting on new connections.
- **License counting:** count unique users in the room over a rolling window, not concurrent WS connections.

## Acceptance criteria

A backend ticket can be considered done when **all** of the following pass:

1. Open the same document in two tabs of the same browser profile (same JWT). Both tabs receive Yjs sync updates from each other. Neither receives a 4000 close.
2. Open the same document on a laptop and a phone, signed in as the same user. Both can type. Edits propagate between them in real time. Neither device gets kicked.
3. Refresh one of the two tabs in scenario 1. The refreshed tab reconnects cleanly. The other tab stays connected through the refresh. No 4000 close.
4. Disconnect one device's network for 10 seconds, then reconnect. The device resumes sync. The other connected device is unaffected.
5. In the awareness state for the room (`provider.awareness.getStates()`), each tab/device shows up as a distinct entry. The presence avatar stack on the frontend shows N distinct entries for N connections, even when they belong to the same user.

## Frontend mitigation already in place

We've shipped a workaround so the frontend doesn't thrash when the BE kicks us. Implementation lives in `src/pages/CollaborationToolPage/collab/useCollabProvider.ts`:

- On WS close with `code === 4000`, the frontend calls `provider.disconnect()` instead of reconnecting. This stops the kick-loop between two tabs of the same user.
- The kicked tab renders a red **"Open in another tab"** badge in the presence bar with a tooltip explaining that the user has to close the other tab and refresh to take over.
- A `subscribeSyncState` callback emits `{ status: "kicked", synced: false }` to subscribers so the UI can branch on the kicked state independently of normal disconnects.

**The frontend mitigation is intentionally a placeholder.** It avoids the thrash but it also means users can't actually use a second device until they manually refresh. The proper fix is the backend change above — once that ships, we can remove this special-case handling on our side.

## Related context

- **WS URL pattern:** `wss://api.swiftpro.tech/api/v1/dev/contract/collab?doc=<docName>`
- **Auth:** JWT via `Sec-WebSocket-Protocol: ['access_token', '<jwt>']`. (Browser can't set `Authorization` header on WS, so subprotocol is the only practical channel.)
- **Custom server message type 2:** the collab server emits a `[varuint msgType=2][varuint count]` frame on each join/leave with the total device count. Frontend uses this for the "N devices connected" fallback when awareness data isn't available. This is fine as-is and not affected by the slot policy change.
- **Separate suspicion to NOT conflate with this ticket:** we have a separate hypothesis that Yjs **sync frames (msg type 0)** may not be forwarded between clients in the same room — symptom would be presence avatars working but text edits not propagating. That's a separate investigation; needs verification with the message-type histogram diagnostic before filing. **The 4000-kick bug documented here is independently confirmed and tracked separately.**

## How to reproduce (for the BE engineer working the ticket)

1. Sign into the app on the same browser profile.
2. Navigate to any contract document's collaboration tool.
3. Duplicate the browser tab (Ctrl+Shift+T or middle-click the tab).
4. Open DevTools → Console in both tabs.
5. You'll see a flood of `[collab] WS close { code: 4000, reason: 'Replaced by new connection', room: '<docName>' }` messages alternating between the two tabs.
6. The presence bar in each tab will flip between "Saved" and "Open in another tab" as they kick each other.

After the fix, step 5 should produce **no 4000 closes**, and step 6 should show both tabs in a stable "Saved" state with each other's presence avatar visible.
