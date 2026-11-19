# gta6-cover-art-entry

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/abogobo-ai/gta6-cover-art-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/abogobo-ai/gta6-cover-art-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Sunset Vice Studio** — a GTA-style cover maker for the fictional city of
Vice Shores. It composes a five-panel photo collage (one hero panel plus
four smaller panels, thin white borders) over a sunset-gradient banner
with a city pill, a giant condensed title, a tagline and a procedural
skyline silhouette, finished with an "EST. 2026" starburst, a "NEW"
sticker and HEAT wanted stars.

Three layouts — Hero Side (16:9, 1920×1080), Hero Top (1:1, 1600×1600)
and Poster (4:5, 1440×1800). Every panel takes a bundled sample photo or
an upload, one of four colour grades (Global, Golden, Neon, Dusk), and
its own zoom and pan (slider, drag and mouse wheel). Title, tagline and
city are editable, and the finished cover exports as a full-resolution
PNG. The editor is a dark navy UI with neon pink/orange accents. The app
is plain static files — no libraries, no network requests, fully
offline.

The screenshots are real captures of the app: `1-cover.jpg` is the Hero
Side cover "SUNSET GETAWAY" (supercar hero), `2-editor.jpg` is the
filled editor, `3-cover.jpg` is the Hero Top cover "NEON HEAT", and
`4-cover.jpg` is the Poster cover "VICE SHORES".

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Serve the app locally with `node serve.ts`, then open
http://localhost:8080.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
