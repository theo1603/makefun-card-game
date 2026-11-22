# makefun-card-game

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/theo1603/makefun-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/theo1603/makefun-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Ember Court is an original duel card game: you face the Warden of Cinders
across three lanes with a 30-card deck of Ember, Frost, Thorn and Stone
cards. Spend mana that grows each turn, play creatures into lanes, chain
Kindle bonuses, freeze the foe's attackers, and reduce the Warden to 0 life
before your own hero falls. Keyboard and mouse, no build step, no network —
open `game/index.html` from any static server and play.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Or serve `game/` with any static server.

`main.ts` copies `game/` and `screenshots/` to `$MAKEFUN_OUTPUT_DIR` (or
`/output`) and writes `$MAKEFUN_OUTPUT_DIR/dossier.json`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
