# RED CORE — how a shift plays

An 8-minute match in a dying 1986 Soviet reactor bunker. Up to 8 players join from phones or laptops with a room code. Every number below is the value the server uses today.

## 1. Flow of a session

```
HOME ──► LOBBY ──► BRIEFING (7 s) ──► SHIFT (8 min) ──► SHIFT REPORT ──► (host) NEW SHIFT, SAME ROOM
          room code, QR,      secret role card,       the game          roles revealed,
          invite link,        goal, three tips,                         stats per player
          host presses START  your radio line
```

- **Host a shift** creates a 4-letter room. Friends join with the code, the QR or the invite link.
- **Play solo** pits you against the AI stalker.
- **Training** is a guided 3-minute shift on a private server room. It covers look, walk, the reactor harness, tools, leaks, going over a lip, the monster's shadow, the saboteur and the SCIF.
- **Roles are hidden.** The server never sends anyone else's role to your client until the shift report.

## 2. Roles

| Players | Engineers | Saboteur | Specimen-09 |
|---|---|---|---|
| 1 | you | — | AI stalker |
| 2–3 | rest | — | 1 player |
| 4–8 | rest | 1 | 1 player |

Everyone human wears the same suit. There are no names over heads. Each human has a radio callsign (LINE 1 VIKTOR, LINE 2 ELENA…) that only the SCIF radio uses.

## 3. How a shift ends

| Ending | Trigger | Winners |
|---|---|---|
| **Quarantine lockdown** | The 8:00 clock runs out | Engineers |
| **Core meltdown** | Core temperature or pressure hits 100% | Saboteur (the specimen dies too) |
| **Specimen escaped** | The specimen pries open the surface lift after opening all three safes | Specimen |
| **No survivors** | Every human is dead | Specimen |

Nobody is killed by a weapon. People die by **falling into the shafts**.

## 4. The reactor: the pressure everyone shares

- The core starts at **50%** and climbs **0.2% per second** on its own. Left alone it melts down in about **4 minutes**, so engineers have to keep working.
- A reversed coolant valve makes that drift **3×** faster for 60 s.
- At **85%**, a reactor surge fills the ducts with steam. For 4.5 s the specimen shows as a cyan outline, unless it has the Ceramic Mantle mutation.
- The MAINFRAME-86 director picks an event every 18 s:
  - a valve failure (+4%)
  - a tripped breaker (8 s blackout)
  - a steam bypass (+10 pressure)
  - an emergency coolant flush (−5%)

  If 3 or more people huddle together for over 10 s, it vents steam on them. With an OpenAI key in the server environment the model chooses the event (strict JSON, 1.2 s timeout); otherwise a deterministic rule set picks it.
- **Cyan always means danger.** It only appears when the core runs hot, when the monster is close, or on CCTV.

## 5. Engineer loop

Walk to a job, lean in, work it with your hands, cool the core, move on. Tasks are spread across the whole map, so the crew has to split up, and splitting up is dangerous.

### Tactile machines (press E, the camera leans in, drag the real parts)

| Machine | Where | What you do | Effect | Cooldown |
|---|---|---|---|---|
| Cable harness | Beside the reactor console | Drag pegs until no cable crosses another; crossed cables glow red | Core −6% | 25 s |
| Pump manifold | Pump room | 3 handwheels, each moving several gauges; get all three needles into the green | Pressure −8, core −3% | 70 s |
| Duty telephone | Control | Find REACTOR DUTY in the directory, then dial each digit by dragging the finger hole to the stop | Core −4% | 60 s |
| Shortwave radio | Barracks | Coarse and fine knobs until the static clears | Core −2% **and the camera-room PIN** | 80 s |
| Centrifuge | Containment | Load 4 tubes balanced around a cracked slot, then spin the speed knob up | Core −3% | 65 s |
| Lathe | Workshop | Crank (mm) and brass knob (tenths) to the job ticket's reading, then pull the feed lever | Pressure −6 | 70 s |
| Generator sync | Substation | Turn the knob until the synchroscope needle creeps, then throw the breaker as it crosses the green wedge | Core −4% | 75 s |
| Control rods | Reactor core | Two levers that creep back; hold both in their bands for 2 s | Core −7% | 90 s |
| Fuel transfer | Hangar floor (8 m down) | Open valves А/Б/В in the placard's order, two turns each | Pressure −6, core −2% | 75 s |
| Air defence radar | Control | Four surface nodes drift out of phase on a green PPI scope; turn each knob until its blip sits on the sweep, before they drift further | Core −3%, pressure −3 | 70 s |
| Gantry crane | Pendant at the hangar's north gallery lip | Drive the real overhead crane (WASD, R/F hoist, SPACE latch) through the bridge camera, fly the APU crate to the pad on the work order, hoist high to clear the catwalk, and kill the pendulum swing before set-down. Everyone in the hangar sees it move | Pressure −5, core −4% | 80 s |
| Buran chronometer | Inside the orbiter's flight deck (stair truck to the port hatch) | Wind the АЧС-1 clock's crown to the next full minute on the МСК readout, then press ПУСК on the long sixth pip of the time signal | Core −3%, pressure −3 | 60 s |

Each machine generates a new puzzle every cycle, and the server checks the answer.

### Other engineer jobs
- **Filters → coolant:** feed 3 filters at the incinerator while the needle is in the amber band. That unblocks the lower-basin coolant valves; balance flow and pressure for 3 s. Core −8%, pressure −6, 45 s cooldown.
- **Wrench leaks:** pick up a wrench (one tool at a time; G drops it). Hold E for 3 bolt turns per leak. Pressure −4.
- **Shaft-edge leaks:** six fittings sit **just past broken rails**, in both hall shafts, on the hangar bridge and at the crane. You work them leaning over the drop with your back to the room. They re-open about 50 s after sealing (core −3% each time).
- **Camera room:** order four instrument readings into a PIN (or get it from the radio), then seat three vacuum tubes until they glow steadily. That powers 6 CCTV feeds and the SCIF radio.
- **Repairs:** a reversed valve, an open breaker or a cut camera cable each take a held-E repair at the spot.

## 6. Saboteur loop

Look like an engineer, push the core toward 100%, and never get caught in the act.

- **Machines:** a saboteur can work any machine to look busy, but it does nothing for the core. Their cable-harness cycles **add 5%** instead of removing 6, and the console CRT shows `LAST CYCLE +5%` for 20 s, which anyone looking can see.
- **Sabotage minigames:** each is harder than a crew task, makes noise within 14 m, and leaves physical evidence.

| Sabotage | Minigame | When it goes off |
|---|---|---|
| Coolant valve (pump room) | Spin the wheel **backwards** 5 full turns while it fights back | Core drift ×3 for 60 s |
| Main breaker (substation) | Pull 3 fuses in the card's isolation order; touching the live one shocks you (1.6 s stun, everyone near hears it) | Blackout for 35 s, cameras dark |
| Tunnel blast doors (control) | Dial the 3-digit override code only the saboteur's HUD shows, then pull the lever | Both tunnels sealed for 22 s |
| Camera cables (6 boxes) | Cut the one wire the card describes (colour plus stripe count); the wrong wire logs a **TAMPER ALERT** | That CCTV feed dies until spliced |

- **Crisis arrows:** like Among Us, every live emergency (armed sabotage, reversed valve, blackout, cut camera, someone hanging off a lip) gets a cyan marker over the spot, or an arrow on the screen edge with the distance in metres. ▲/▼ means it's on another level.
- **Never a blindside:** a completed sabotage **arms for 8 s** first. Every engineer gets a flashing warning with the location and a siren. Anyone who reaches it and holds E for 1.8 s stops it, and the CCTV log records the interrupted tampering.
- **Cooldown:** 25 s between sabotages.
- **Evidence:** a powered, uncut camera in the same room logs `CAM 06 / FIGURE AT COOLANT VALVE / 03:14` in the SCIF.

## 7. Specimen-09 loop

Evolve, then escape. Kill when it pays. Save the reactor when you must.

- **Hidden:** fully invisible after standing still for a second. Moving, it shows only a smeared shadow and a floor blot that grow clearer with each stage. Heavy wet footsteps, a sub-bass growl and Geiger clicks rise as it closes in. CCTV always shows it in cyan.
- **Vents:** 18 floor grates. Hold E to enter, pick any exit on the duct map, and arrive after about 1 s per 7 m. Both grates rattle for anyone nearby. Too big for vents from stage 2, unless it has Soft Tendrils.
- **Lunge** (click or F, 16 s cooldown, 1.9 m reach): throws an engineer 3.2 m and stuns them for 1.4 s. Near a broken rail that throw ends at a lip. On someone already hanging, it rips away 50% of their grip. A lunge reveals the specimen for 1.6 s.
- **Three mutagen safes, any order:**
  - chess mate-in-one (containment)
  - Hot Grid, a logic puzzle with Geiger counts (archive, far west)
  - Lissajous oscilloscope sync (substation, far east)

  Each opened safe offers **two of four** mutations for the next slot, drawn per match: senses, then movement, then hide. That makes 12 parts and many builds, and each part shows on the model. Examples:
  - Breaker Arms: pry doors open, escape in 3 s
  - Ceiling Hooks: 2.7 m lunge reach
  - Echo Fans: Q pulse that reveals everyone within 16 m
  - Mist Bladders: R smoke cloud
- **Self-preservation:** at the reactor console it can **tear the coolant bypass** (core −12%, 40 s cooldown). A meltdown kills it too, so it sometimes has to save the crew.
- **Escape:** after three safes, hold E at the surface lift door (far east) for 6 s (3 s with Breaker Arms).

## 8. Confrontation without meetings

- **Shove (F):** 1.6 m push with a 4 s cooldown. On flat floor it's a nuisance; at a broken rail it can kill.
- **Going over the lip:** step or get pushed off an edge above a drop of 4.5 m or more and you **catch the lip**. The grip bar runs in time with your heartbeat:

| | Two hands | One hand (below 50%) |
|---|---|---|
| Beat | 620 ms | 480 ms |
| Hit window | 17% | 12% |
| Drain | 6%/s | 10%/s |
| Hit | +13% | +9% |
| Miss | −9% | −9% |

  At 0% you fall 9 m and die, and become a ghost who can drift and watch. **Anyone can hold E for 2 s to pull you up.** A shove on a hanging player takes 35% of their grip.
- **Duct tape (T):** two people holding T on the same person for 4 s tape them to a pipe. The taped player tears free by hitting 8 beats (a miss loses one), or is freed automatically after 60 s. Breaking free gives 9 s of adrenaline at ×2.1 speed. Anyone can cut the tape in 2 s.
- **SCIF radio:** in the powered camera room, the operator patches **one line** at a time and sends a callout ("SPECIMEN SEEN / EAST HALL") or a short typed message. It arrives on that player's HUD **10 seconds later**, so callouts have to predict where things will be.

## 9. The map

- **Core:** six core rooms (workshop, control, extraction, pump room, reactor hall, containment), the reactor core, the camera room and the incinerator.
- **Below:** a two-level sewer with the coolant basin.
- **East wing:** tunnel, hall with an open cooling shaft, substation, barracks, lift passage and surface lift.
- **West wing:** tunnel, hall with a shaft, storage and archive.
- **Hangar 2:** galleries round an 8 m drop to the Buran orbiter, a catwalk bridge over its spine, and a stair to the floor. A stair truck on the port side leads through the open hatch into the orbiter's flight deck.
- **Camera room (the SCIF):** west of the workshop, behind a keypad door. The code comes from the clue note beside the keypad or the barracks shortwave radio. Seat 3 vacuum tubes inside to power the 6 CCTV feeds and the SCIF radio desk.

Crossing the map end to end takes about 34 s at walking speed. Lethal edges cluster where the work is, so tasks pull people to the drops.

## 10. A typical 5-player shift

```
0:00  Briefing ends. 3 engineers, 1 saboteur, 1 specimen (in the core vents). Core 50%.
0:40  Engineer A untangles the harness (core 47%). B heads west for the pump manifold.
1:10  The specimen vents to the archive and starts the Hot Grid safe.
1:45  The saboteur drifts to the substation alone, pulls fuses B-A-N. Sparks are heard in
      the east hall. "WARNING / MAIN BREAKER / 8 SECONDS". C sprints from barracks, too late:
      blackout, cameras dark.
2:30  A, working the shaft-edge leak in the west hall, is shoved over the broken rail by the
      saboteur in the dark. A hits the beats down to one hand; B arrives and pulls them up.
      Now A and B both distrust whoever was in the hall.
3:40  Core 86%: reactor surge. Steam outlines the specimen in cyan on the hangar bridge.
5:10  The specimen opens its third safe (the oscilloscope) and grafts Ceiling Hooks. The core is 92%,
      too hot, so it tears the coolant bypass (−12%) to stay alive.
6:30  A and B tape the saboteur to a pipe after the console shows LAST CYCLE +5%.
7:40  The specimen reaches the lift. C works the lift room... the clock hits 0:00 first.
      QUARANTINE LOCKDOWN. Engineers win.
```

## 11. Where it lives in the code

- `server/room.ts`: the authoritative rules for everything above.
- `shared/`: rules both sides run:
  - `match.js`: roles, timings, win conditions
  - `machines.js`: machine puzzles and sabotage minigames
  - `safes.js`: the specimen's three safes
  - `world.js`: collision and ledge grab
  - `stations.js`, `wings.js`, `hangar.js`: interaction points and map layout
- `src/main.js`: client flow and input.
- `src/machines.js`: 3D machines.
- `src/ps1.js`: the PS1 look.
- `src/audio.js`: all sound, synthesised.
