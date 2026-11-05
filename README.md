# @twinfile/geotypes

Open POI taxonomy registry for Twinfile place units — slugs, 3-letter acronyms, vendor crosswalks, and maintenance CLI.

**Repository:** [github.com/twinfile/geotypes](https://github.com/twinfile/geotypes)  
**npm:** `@twinfile/geotypes` on GitHub Packages

## Layout

```text
data/features.yml     POI taxonomy (~297 types)
data/category/              Category YAML (`archetype` on each root)
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
yarn sync              # slugs + acronyms + provider crosswalks + place archetypes
yarn sync:slugs        # data/features.yml → src/slugs.ts
yarn sync:acronyms     # id + name → src/generated/acronyms.ts
yarn sync:providers    # Foursquare/Google/OSM/HERE → provider-categories.ts
yarn sync:place-archetypes  # → src/generated/place-archetype-data.ts
yarn category          # category tooling
yarn check             # neutral-language guard + typecheck + tests
```

## Taxonomy visualization (isocanvas)

Local iso diagram of category bands grouped by **place archetype** (`single_level`, `campus`, `linear`, `indoor_stack`). Requires a sibling checkout of [`@westlane/isocanvas`](https://github.com/westlane/isocanvas) at `../../westlane/isocanvas` (or set `TF_ISOCANVAS_ROOT`).

```bash
yarn viz   # http://localhost:5175
```

Runtime helper (no canvas dependency):

```typescript
import { buildGeotypeTaxonomyDiagramArtboards } from '@twinfile/geotypes';
```

## Exports

| Subpath | Purpose |
| --- | --- |
| `@twinfile/geotypes` | Slugs, acronyms, normalization, provider maps, `placeScaffoldForSlug`, venue helpers |
| `@twinfile/geotypes/geokit` | Optional `PlaceTaxonomyResolver` factory for map hosts (no map SDK dependency here) |
| `@twinfile/geotypes/generated/*` | Protobuf modules |

## Twinfile

Reference slugs from place manifests (e.g. `geotype.primary`) against this registry at a pinned semver — documented in `@twinfile/spec`; the full catalog is not embedded in spec or core.

Each slug has a **place scaffold**: suggested `archetype` and `authoring_scale` (map-first; see Twinfile spec `doc/place/place.md`). Resolve with `placeScaffoldForSlug('shopping_mall')`. Golden **`from:`** bases live in `@twinfile/examples` (`base-campus-mixed`, `base-ordered-route`, etc.) — not in this package.

## Optional map-host wiring

```typescript
import {
  createGeokitTaxonomyResolver,
  type PlaceTaxonomyResolver,
} from '@twinfile/geotypes/geokit';

const resolver: PlaceTaxonomyResolver = createGeokitTaxonomyResolver();
// Register `resolver` with your map host's place-taxonomy hook.
```
