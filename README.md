# RED CORE (Объект-86)

An 8-minute shift in a dying 1986 Soviet reactor bunker. Browser multiplayer horror for 1–8 players on phones and laptops: join with a room code, no accounts, no installs.

- **Engineers** keep the core under 100% until the lockdown clock runs out.
- **The saboteur** (4+ players) wears the same suit. Their reactor services add heat. They can reverse valves, cut breakers, seal the tunnel blast doors and cut camera cables. Every act takes time and can be caught on CCTV.
- **Specimen-09** (2+ players, or an AI stalker solo) is invisible standing still and a shadow when moving. It cracks three mutagen safes (chess, hot grid, Lissajous sync), grafts one of two random mutations per safe, then pries open the surface lift. If the core melts, it dies too.

There is no voting and no weapon. People die in the shafts: a shove at a broken rail sends someone over the lip, where they hang on a heartbeat grip bar until someone pulls them up or they fall. Two people holding T on a third tape them to a pipe. The SCIF operator in the camera room radios one line at a time, ten seconds late.

## Run locally

```sh
npm install
npm run party   # PartyKit room server on :1999
npm run dev     # Vite on :5173
```

Open http://localhost:5173. **Host a shift** creates a room and shows the code, a QR and an invite link. **Play solo** pits you against the stalker. **Training** is a 3-minute guided shift.

## Deploy (one public URL)

PartyKit serves both the built page (`dist/`) and the rooms:

```sh
npx partykit login   # once, opens GitHub sign-in
npm run deploy       # vite build + partykit deploy
```

The page then connects to its own host. To use the OpenAI director in production: `npx partykit env add OPENAI_API_KEY`.

## Controls

WASD move · click to capture the mouse · E use / hold to work · F shove (specimen: lunge, also left click) · T tape (two people) · SPACE grip / break tape · TAB map · C hold breath · ESC menu. Specimen extras unlock with mutations: Q echo pulse, R mist, SHIFT spring. Phones get thumb pads and action buttons.

## Layout

| | |
|---|---|
| `server/room.ts` | Authoritative room: lobby → briefing → shift → results, hidden roles, collisions, ledge hang, tape, sabotage + CCTV log, radio delay, specimen safes/mutations/vents, solo stalker AI, tutorial events, director |
| `shared/` | Rules both sides run: `world.js` (collision, ledge grab), `wings.js`, `hangar.js`, `stations.js` (vents, cameras, sabotage, nav graph), `safes.js`, `match.js` (roles, timings, win conditions), task logic |
| `src/main.js` | Client: screens, input, prediction, interactions, HUD |
| `src/ps1.js` | PS1 pipeline: vertex snap, 4×4 Bayer dither, 5-bit colour, sodium grade; Cherenkov cyan is reserved for danger |
| `src/diegetic.js` | Machine panels mounted in 3D on the machines |
| `src/wings.js`, `src/hangar.js`, `src/decor.js`, `src/stations-view.js` | East/west wings, Buran hangar, posters/materials/rugs/mural, vents, cameras, valves, doors |

## Checks

```sh
npm run check                 # offline: collision, routes, stations, safes, movement axes, ...
node tools/check-match.mjs    # live 4-player match against `npm run party`
```

`docs/shots/` holds in-game screenshots captured from the canvas (dev only: set `window.__photo` and `window.__capture`).
