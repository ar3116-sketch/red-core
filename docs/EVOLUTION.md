# RED CORE: character and evolution revision

## Status
Implemented: revised rigged character assets, twelve visible mutation groups, deterministic per-seed drafts, three safe unlock stages, one equipped part per slot, runtime body changes, and a browser mutation lab with numerical route trials. The crew model is used for multiplayer peers.

Not yet connected to live play: human-controlled specimen role, safe puzzles, monster locomotion and attacks, sensing, hazards, route geometry, server-authoritative mutation state. The lab's route trials are rule calculations, not physical traversal. No live balance claim is made.

## Art direction
Crew: loose olive-green sealed hazmat suit, moderate bulk, gathered cuffs, dark single visor and respirator. Fine low-resolution grain rather than camouflage blocks. Specimen: four hinged radial jaws around a dark throat, ribbed arthropod thorax, jointed limbs and hooked hands. Model silhouettes change with equipped parts. Preserve low polygon facets and nearest-neighbour texture sampling.

## Match variety
12 parts, four in each of three slots. Each match draws two choices per slot without replacement. This permits 216 distinct supplies and 64 complete body builds across matches; a particular supply has eight complete builds. Supplies are revealed early so the monster can plan. There is no permanent unlock grind or rarity power multiplier.

The first safe unlocks senses, the second movement, the third hide. In the lab, solve buttons simulate this progression and swaps are unrestricted for comparison. Proposed live rule: one injection choice at each safe; changing it requires returning to that safe and an exposed six-second procedure. Never reroll supply during a round.

Baseline monster senses must remain usable without a sense mutation. Every part changes an approach, with a visible body cue, a cost, and an action the crew can take in response.

## Parts
| Slot | Part | Reason to equip | Cost / crew response |
|---|---|---|---|
| Movement | Breaker arms | Pry heavy doors in five seconds | Loud, 15% slower; crew can hear it and reposition |
| Movement | Soft tendrils | Flank through vents | Three seconds to enter/exit; cannot attack inside; exit rattles |
| Movement | Ceiling hooks | Traverse rails, ambush from above | Two-second exposed descent; work lamps reveal silhouette |
| Movement | Spring haunches | Cross gaps, close open distance | Loud landing, 1.5-second recovery, ten-second cooldown; corners counter it |
| Senses | Thermal pits | See heat in darkness within eight metres | No wall vision; machinery and steam mask targets |
| Senses | Vibration comb | Track running through a connected floor | Crouching/stillness defeats it; pumps interfere |
| Senses | Echo fans | Brief active geometry/target snapshot | Audible pulse; two-second reveal, twelve-second cooldown |
| Senses | Scent palps | Follow twelve seconds of trail | Delayed information; decontamination washes it away |
| Hide | Layered chitin | Reduce stun duration 35% | 10% slower, shell scraping is louder |
| Hide | Mimetic skin | Conceal a stationary ambush in shadow | Three-second settling; movement breaks it; CCTV reveals it |
| Hide | Mist bladders | Four-second retreat cloud | Also obscures thermal sensing; twenty-second cooldown |
| Hide | Ceramic mantle | Reduce steam damage 70% | Strong IR silhouette; no stun protection |

All numerical values are initial tuning proposals. Combined movement penalties multiply: breaker plus chitin is 76.5% baseline speed. Mist deliberately interferes with thermal sensing; it is an escape tool for that build, not free offensive vision. Armour does not erase vent entry time or rail descent vulnerability. No combination removes all counterplay.

## Map fairness contract for future integration
- The corridor graph remains connected with bounded travel times independently of any mutation. The existing map generator's connectivity checks remain required.
- Escape must be achievable by an ordinary powered-door route. Strength can bypass the power task; it must not be the only extraction solution. This replaces the original design's mandatory Apex Musculature gate.
- Every generated map must have at least two useful doors, vent connections, rails, and gap crossings. A movement draft is invalid if either offered part has no applicable route.
- Distribute these alternatives across sectors; do not place both benefits beside a single safe. No shortcut terminates inside spawn protection or directly behind the extraction threshold.
- Provide ordinary paths around steam and gap hazards. Preserve a warning and escape response at mutation route exits.
- Supply is seeded once by the match server. Do not tailor the draft after seeing a player's choices.

## Meaningful progression, moderate puzzles
Target 20–40 seconds for a first solve, 8–15 with practice. A visible rule and two or three steps per safe. Failure briefly costs time or makes noise; preserve partial progress. Avoid frame-perfect inputs and irreversible lockouts. Reveal a useful clue after repeated errors.

## Balance checks after actual monster gameplay exists
Compare time to reach each objective, chase escape rate, safe acquisition time, pick rate and win rate by build. Watch for one mandatory movement choice and for combinations that make another slot redundant. Adjust route utility before adding raw damage. A sample count of 64 builds does not establish that those builds are balanced.
