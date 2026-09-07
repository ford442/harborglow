# Ship hull GLBs

Files in this folder are **LOD0** hulls for HarborGlow. Distant ships stay
procedural (`Lod2Impostor`). If a GLB fails to load, the game falls back to the
blueprint mesh — see `ShipModelBoundary`.

## Current files (in-repo generated)

These committed meshes are **not** licensed third-party art. They come from the
repo generators and are placeholders until Blender (or CC-BY) hulls replace them
with the **same** root node, `Empty_HP_*` names, and `attachmentSocketMap`.

| File | Ship type | Generator |
|------|-----------|-----------|
| `cruise_liner.glb` | `cruise` | `npm run models:author` |
| `container_vessel.glb` | `container` | `npm run models:author` |
| `oil_tanker.glb` | `tanker` | `npm run models:author` |
| `fireboat.glb` | `fireboat` | `npm run models:author` |
| `lng_carrier.glb` | `lng` | `npm run models:author` |
| `bulk.glb` | `bulk` | `npm run generate:ship-glb` |
| `roro.glb` | `roro` | `npm run generate:ship-glb` |
| `research.glb` | `research` | `npm run generate:ship-glb` |
| `droneship.glb` | `droneship` | `npm run generate:ship-glb` |
| `ferry.glb` | `ferry` | `npm run generate:ship-glb` |
| `trawler.glb` | `trawler` | `npm run generate:ship-glb` |
| `horizon.glb` | `horizon` | `npm run generate:ship-glb` |
| `icebreaker.glb` | `icebreaker` | **not committed** — procedural Yamal until art lands |

Do **not** add `icebreaker` to `SHIP_MODEL_FILENAMES` until `icebreaker.glb` is
in this folder. `npm run models:verify` exist-gates that pair.

Authoring contract, sockets, and Blender checklist:
[`docs/plans/CONTRIBUTING_SHIPS.md`](../../docs/plans/CONTRIBUTING_SHIPS.md).

Compress with `npm run models:compress` (Draco only). Gzip budgets are enforced
by `npm run models:verify` (hero ≤ 1.5 MB gzip, stretch ≤ 800 kB gzip).

## Third-party meshes (when art lands)

Record CC-BY / similar licenses here. Do not commit a mesh without a credit line.

| File | Source | License | Author | URL / asset id |
|------|--------|---------|--------|----------------|
| — | — | — | — | — |
