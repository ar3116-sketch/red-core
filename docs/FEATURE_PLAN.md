# RED CORE — gameplay and map rules

This extends the original master design. It records the requested direction; only the items marked "prototype" currently exist in the game.

## Sensory layer

- Procedural gas-mask breathing, twin-beat heartbeat, 50 Hz transformer hum, and Geiger clicks: **prototype**. Sound starts after a player presses AUDIO. Movement and reactor/pressure danger raise heartbeat and breathing rate.
- Hold breath with C or the touch button: **audio prototype**. Later, the server should track a bounded breath reserve and broadcast noise to nearby players and Specimen-09 without exposing identity.
- Mobile haptics follow the heartbeat where `navigator.vibrate` is available: **prototype**. The visual/audio cues remain sufficient when vibration is unavailable.
- No stock audio assets. Compose any later score and machinery sounds in-house.

## Task design

- Replace repeated instant reactor actions with short analog challenges. Candidate stations: valve seal timing, breaker wheel friction, vacuum tube alignment, dual control rods, and steam leak tape repair.
- Use distinct skill tests: timing, spatial alignment, coordinated input, and diagnosis. Rhythm should matter for breakout and selected safes; it should not make every station feel identical.
- Each station needs clear local feedback, a bounded duration, server-owned success/state, a sabotage alternative, and a touch control equivalent. A failed attempt should create pressure without trapping the player in a modal screen.
- The duct-tape breakout should synchronize seam-peeling and snap timing with the character's audible pulse. A skilled player should escape faster; spectators must still see the physical restraint.
- The three Specimen-09 safes remain distinct puzzles, with rhythmic timing layered into the chess, minesweeper, and oscilloscope interactions where it improves tactile feedback.
- Difficulty target: an unfamiliar player should usually finish one station in about 20–40 seconds; a practiced player should do it in 8–15 seconds. Mistakes cost time or raise local danger, but do not erase all progress. After repeated misses, offer an in-world clue such as a flickering dial marker or marked notebook page. Tune these ranges in playtests.

## Map generation laws

Use a seed and authored room modules. Every client in a room must receive the same seed from the server; the server must validate objective positions and movement. Current modular corridor geometry is a visual prototype, not yet a generated playable map.

`shared/map.js` now generates a deterministic 4×4 room graph with the eight critical landmarks fixed. It varies three to five passages and the positions of eight side-room types, then rejects layouts with unreachable rooms, one-passage cutoffs, or objective routes outside bounded lengths. The graph still needs to be rendered as explorable 3D rooms and synchronized as match state.

1. Keep the reactor, SCIF, Specimen-09's three safes, crew spawn, monster vent spawn, and surface lift as recognizable landmarks.
2. Generate corridors, maintenance side rooms, doors, vents, and hazards between landmarks. Preserve two routes around any major chokepoint so one locked door does not end the match.
3. Guarantee reachability for every faction, and require the monster's three safes before it can access the lift. Reject seeds with impossible paths or trivially short objective routes.
4. Give each sector at least one recognizable color, sound, or silhouette cue. Players should learn the facility even when a route changes.
5. Keep objective travel times within a tested range and avoid spawning the saboteur or monster directly beside an early objective or another player.
6. Cameras, power circuits, steam pipes, and valves must connect to the rooms they actually affect. A disaster must have a readable physical source and a countermeasure.
7. Save the seed in the match state for replay and debugging. Test many seeds automatically for connectivity, pacing, and bottlenecks.

### Side rooms and signature tasks

| Room | Task or risk | Why it belongs |
| --- | --- | --- |
| Pump station | Two operators balance inlet and outlet pressure wheels; saboteur can reverse one wheel | Creates cooperation and plausible covert tampering |
| Filter room | Diagnose contaminated air from a gauge and sound, then seat a cartridge precisely | Uses observation and alignment rather than rapid button presses |
| Cable tunnel | Trace a dead circuit and splice the correct line while exposed in a narrow passage | Rewards information from the SCIF and creates ambush risk |
| Vent junction | Specimen-09 travels quickly through ducts but makes audible metal impacts | Gives the monster mobility with a readable warning |
| Observation room | View a distorted silhouette and specimen records through damaged glass | Adds clues without showing a live name tag |
| Substation | Reclose a breaker by alternating torque and timing an arc-safe window | Restores power while forcing someone to stay in danger |
| Storage | Search lockers for the one pair of IR goggles and limited repair supplies | Gives exploration a useful reward |
| Barracks | Temporary concealment and an emergency air supply, but poor sightlines | Offers a risky refuge rather than a guaranteed safe room |

All eight side-room types appear once per generated graph; their positions vary. Only a small subset should be active match objectives at once so crews have meaningful choices without a long checklist.

## Input and accessibility

- Detect capabilities rather than device names: fine pointer and keyboard use drag/pointer-lock look plus keys; coarse pointer uses dual thumb pads and tactile controls. This layout is a **prototype**.
- Rhythm cues need synchronized visual markers so players can complete tasks without sound or vibration. Haptics should be optional and short.

## Commercial proposal

The proposed Steam price is $2.99, replacing the earlier $0.99 idea. Treat this as a positioning hypothesis to evaluate against the finished game, competition rules, platform policies, and playtest feedback before launch.
