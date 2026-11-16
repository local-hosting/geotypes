# @doppler-group/geotypes

Open POI taxonomy registry for Twinfile place units — slugs, 3-letter acronyms, vendor crosswalks, and maintenance CLI.

**Repository:** [github.com/twinfile/geotypes](https://github.com/twinfile/geotypes)  
**npm:** `@doppler-group/geotypes` on GitHub Packages

## Layout

```text
data/venue/features.yml     Places a person can be in, at, or travel along
data/resource/features.yml  Equipment and conveyance (stop signs, cables, pipelines)
data/category/              Category YAML (`extent` on each root)
data/place-archetype-rules.yml  Authoring-scale defaults + slug overrides
proto/                geospatial.proto + tags.proto
generated/            protoc output (`yarn generate`)
cli/                  Taxonomy maintenance CLI
scripts/              sync helpers (slugs, acronyms, providers, place archetypes)
src/                  Runtime (slugs, acronyms, provider crosswalk, archetype resolver, venue)
```

## Commands

```bash
yarn install
yarn generate          # proto → generated/
yarn sync              # slugs + acronyms + provider + format mappings + place archetypes
yarn sync:slugs        # data/venue + data/resource → src/slugs.ts
yarn sync:acronyms     # id + name → src/generated/acronyms.ts
yarn sync:providers    # Foursquare/Google/OSM/HERE → provider-categories.ts
yarn sync:place-archetypes  # → src/generated/place-archetype-data.ts
yarn category          # category tooling
yarn check             # vendor-neutral guard + typecheck + tests
```

## Taxonomy visualization (isocanvas)

Local iso diagram of registry slugs on the extent × vertical grid. The **Venues / Resources** toggle shows one catalog at a time (`data/venue/features.yml`, `data/resource/features.yml`). Requires a sibling checkout of [`@westlane/isocanvas`](https://github.com/westlane/isocanvas) at `../../westlane/isocanvas` (or set `TF_ISOCANVAS_ROOT`).

```bash
yarn viz   # http://localhost:5175
```

Runtime helper (no canvas dependency):

```typescript
import { buildGeotypeTaxonomyDiagramArtboards } from '@doppler-group/geotypes';
```

## Exports

| Subpath | Purpose |
| --- | --- |
| `@doppler-group/geotypes` | Slugs, acronyms, normalization, provider maps, `placeScaffoldForSlug`, venue helpers |
| `@doppler-group/geotypes/geokit` | Optional `PlaceTaxonomyResolver` factory for map hosts (no map SDK dependency here) |
| `@doppler-group/geotypes/generated/*` | Protobuf modules |

## Twinfile

Reference slugs from place manifests (e.g. `geotype.primary`) against this registry at a pinned semver — documented in `@doppler-group/twinfile-spec`; the full catalog is not embedded in spec or core.

Point assets with no interior (`stop_sign`, `fire_hydrant`, `utility_pole`, …) are not places: `isAssetGeotype` returns true and they have no scaffold (`GEOTYPE_ASSET_SLUGS`). Every other slug has a **place scaffold**: suggested `archetype` and `authoring_scale` (map-first; see Twinfile spec [`doc/place/place.md`](https://github.com/twinfile/spec/blob/main/doc/place/place.md)). Resolve with `placeScaffoldForSlug('shopping_mall')`. Each slug also materializes three axes — **extent**, **vertical**, **movement** — via `placeAxesForSlug('hotel')`, plus suggested decorators (situations + layer files) via `placeDecorationsForSlug('stadium')`; the archetype is a lookup on those axes (`archetypeForAxes`, spec [`doc/place/place-archetypes.md`](https://github.com/twinfile/spec/blob/main/doc/place/place-archetypes.md)). **`suggestBuildingImportForSlug('airport')`** is true when `data/place-archetype-rules.yml` sets **`suggest_building_import.campus: true`** and the slug resolves to **`campus`** — `twin init place` then writes `place/BUILDINGS.md` (RFC 0005). Golden **`from:`** bases live in `core/examples` (`base-campus`, `base-open-area`, `base-linear`, etc.) — not in this package.

**Authoring a full unit:** Dockerfile-style steps (`from:` → `archetype` → `layers:` → per-space `exposure`) in Twinfile spec [`doc/place/place-recipe.md`](https://github.com/twinfile/spec/blob/main/doc/place/place-recipe.md) (monorepo: `spec/doc/place/place-recipe.md`).

## Optional map-host wiring

```typescript
import {
  createGeokitTaxonomyResolver,
  type PlaceTaxonomyResolver,
} from '@doppler-group/geotypes/geokit';

const resolver: PlaceTaxonomyResolver = createGeokitTaxonomyResolver();
// Register `resolver` with your map host's place-taxonomy hook.
```
