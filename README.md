# RED CORE (Объект-86)

Early playable prototype of the Object-86 multiplayer horror game. The current slice has a multi-room bunker, a reactor hall, layered sewer routes, room-code multiplayer, crew and saboteur roles, machinery puzzles, cameras, an AI director, and pickup tools. The human-controlled monster round and restraint/rescue system remain design targets.

## Run locally

```sh
npm install
npm run dev
npm run party
```

Run `npm run dev` and `npm run party` in separate terminals, then open the Vite URL (normally http://localhost:5173/) in two browser tabs. Enter the same room code in both tabs and click JOIN. The first player is an engineer, the second is the saboteur. Additional players are engineers. The match clock begins on the first join.

Click SOLO SHIFT to start or restart a local demo. Its clock and interactions are local only. The page stays idle until you start a solo shift or join a room.

## Controls

- WASD: move; drag the scene to look; double-click the scene for pointer lock when supported.
- Walk to the green reactor console and press E to use it. Complete its wiring and breaker puzzle. Engineers lower heat; the saboteur raises it.
- On touch screens, use the left thumb pad to move, the right thumb pad to look, and tap ACTION at the console.
- Press AUDIO OFF to enable the procedural suit and bunker audio. Hold C on desktop or HOLD BREATH on touch screens to quiet the mask breathing. A supported mobile browser vibrates with the heartbeat.
- The crew wins if the 8-minute clock expires below 100% heat. The saboteur wins if heat reaches 100% first.

The PartyKit server at `localhost:1999` owns the timer, temperature, player roles, and actions. Room codes are local development rooms; deployed hosting is not configured yet.

## MAINFRAME-86 director

Every 18 seconds, the PartyKit room server chooses one bunker event. With an API key, it calls OpenAI's Responses API using `gpt-6-luna` and a strict one-action JSON schema. Without a key, or if the request fails or exceeds 1.2 seconds, the server uses a deterministic fallback. Events can affect core heat, pressure, and lighting. The key is never sent to browsers.

To enable the model locally:

1. Copy `.env.example` to `.env` in this folder.
2. Add your key after `OPENAI_API_KEY=` in `.env`. This file is ignored by Git. Do not paste the key into chat, browser code, or `partykit.json`.
3. Restart `npm run party`. PartyKit reads `.env` into `room.env` for local development.

The director's event choices are server-side and bounded. The model does not receive player names, chat, or secrets. The current cluster check is a simple proximity count and the events are a prototype of the planned disasters.

## Physical props and tool interactions

Room dressing now includes shared collision footprints for parts shelves, specimen carts, filters, instruments, rescue storage and archive racks. Moveable tools are distinct objects, separate from decorative clutter. Look at a wrench or rope within reach and press E. One tool can be carried; G sets it down. Equipping takes 650 ms. Wrench repairs require three separate held turns; installed ropes become shared, reusable routes between levels. The local menu includes a workshop pickup practice spawn. Multiplayer validates item ownership, distance, equipment, elapsed use time and single completion.

## Planned hidden shotgun side story — developer notes

This is an unlisted discovery chain, not a player-facing quest. No HUD counter, objective marker, tutorial, menu practice option or upfront message should reveal that a shotgun can be built. Seeded maintenance journals on ordinary bulletin boards contain archival codes. Cross-referencing multiple journals at a dedicated mainframe room reveals specific storage locations through an in-world records lookup. This room and story chain are still to be implemented.

Randomize journal placements, record codes and part caches together from one round seed. Validate every clue chain as solvable and every required location as reachable without the gun or an optional monster mutation. The challenge is noticing and connecting evidence, never guessing arbitrary PINs. Keep ordinary records mixed in, but use consistent dates, initials and ledger formats as fair hints.

A single authoritative receiver object limits assembly to one shotgun per round. Players may collaborate on parts, and the workbench consumes the unique receiver on assembly; do not give a privileged assembly permission to a particular player. Part drops and disconnects must preserve a recoverable trail. Integrate final weapon use with the future human-controlled monster rounds rather than presenting an assembled prop as working combat.
