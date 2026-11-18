# SOLMAR CITY

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/vidovizio/solmar-city/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/vidovizio/solmar-city/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An original, offline-ready open-world crime adventure in a sun-soaked coastal city. Play Mara Voss, a wheelwoman fresh out of prison, as she works through five story jobs to settle her debt with the Harbor Syndicate.

## Run

From the repository root, start the static game server and open the local address:

```sh
node serve.ts
```

Open [http://localhost:8080](http://localhost:8080). The game uses static ES modules and the locally vendored Three.js runtime; no build step or network connection is needed.

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
- Wanted levels, police pursuit, line-of-sight escapes, roadblocks, health, and busted respawns
- Procedural WebAudio effects, persistent local saves, a minimap, and deterministic screenshot scenes
- Screenshot URLs: `?shot=start|play|chase|end&seed=1`

---

<sub>Entered on [make.fun](https://make.fun/?ref=ynfr7a93&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
