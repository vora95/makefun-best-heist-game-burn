[![best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/vora95/makefun-best-heist-game-burn/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/vora95/makefun-best-heist-game-burn/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# HIGH ROLLER HEIST

A casino caper in three rooms. You are the thief: cross the casino
floor hidden in the crowd, lift the keycard, crack the vault's code
panel, grab the Grand Chip, and reach the limo while the alarm is
already screaming.

- **The Casino Floor** — patrons to blend with, chip stacks to pocket,
  guards with sweeping vision cones, wall cameras, and a VIP lounge
  door that only opens once you hold $300 in chips.
- **The Vault** — a keycard with the code, a code panel, a laser grid
  on a rhythm, and the Grand Chip ($1000) behind the vault door.
- **The Getaway** — the alarm starts at 45%, guards are already
  hunting, and the limo is the only way out.

Tools cost: toss a coin to pull a guard away, smoke to go unseen, EMP
to kill cameras and lasers. Sneak slow, dash fast, and never let the
alarm hit 100%. A room finished without ever being spotted pays a $500
ghost bonus.

## Run

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to `$MAKEFUN_OUTPUT_DIR` and writes `dossier.json`.
Run it twice and both runs write the same bytes:

    mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

Play it locally with `node serve.ts`, then open http://localhost:8080.
