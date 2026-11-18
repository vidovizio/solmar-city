# SOLMAR CITY

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/vidovizio/solmar-city/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/vidovizio/solmar-city/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

SOLMAR CITY is an original open-world crime adventure built for the make.fun "Make GTA 6" bounty (gta6-01). In a sun-soaked coastal city of marinas, beaches and syndicate docks, you play Mara Voss, a wheelwoman fresh out of prison, who works through five story jobs to settle her debt with the Harbor Syndicate. The whole game runs offline in the browser: no build step, no network connection, no accounts.

## Run

From the repository root, start the static game server and open the local address it prints:

```sh
node serve.ts
```

Then open [http://localhost:8080](http://localhost:8080). The game uses static ES modules and the locally vendored Three.js runtime, so it works fully offline once the repository is cloned.

## Controls

- **WASD** — move on foot / steer and accelerate in a car
- **Mouse** — orbit the third-person camera; click to fire when armed
- **Shift** — sprint
- **Space** — jump on foot / brake in a car
- **E** — enter or exit the nearest car
- **F** — melee
- **R** — reload
- **M** — show or hide the mission list
- **P** — save
- **Esc** — pause

## Features

- Five original missions with objectives, dialogue, cash rewards, and a story finale
- A procedural coastal city with distinct neighborhoods, traffic, pedestrians, a marina, beach, and pier
- Wanted levels from 0 to 5, police pursuit, line-of-sight escapes, roadblocks, health, and busted respawns
- Procedural WebAudio effects, persistent local saves, a minimap, and deterministic screenshot scenes
- Screenshot URLs: `?shot=start|play|chase|end&seed=1`

## How it is put together

The game code lives in `game/` as plain ES modules (city generation, traffic, pedestrians, police AI, missions, combat, HUD and saves under `game/src/`), with Three.js vendored under `game/vendor/` so nothing is fetched at runtime. `main.ts` at the root is the entrypoint the bounty harness runs, and `serve.ts` is the small static server used for local play.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ynfr7a93&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
