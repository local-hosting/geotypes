# @twinfile/geotypes

Open POI taxonomy registry for Twinfile place units — slugs, 3-letter acronyms, vendor crosswalks, and maintenance CLI.

**Repository:** [github.com/twinfile/geotypes](https://github.com/twinfile/geotypes)  
**npm:** `@twinfile/geotypes` on GitHub Packages

## Layout

```text
data/features.yml     POI taxonomy (~297 types)
data/category/        Category YAML
proto/                geospatial.proto + tags.proto
generated/            protoc output (`yarn generate`)
cli/                  Taxonomy maintenance CLI
scripts/              sync helpers (slugs, acronyms, providers)
src/                  Runtime (slugs, acronyms, provider crosswalk, venue partition)
```

## Commands

```bash
yarn install
yarn generate          # proto → generated/
yarn sync              # slugs + acronyms + provider crosswalks
yarn sync:slugs        # data/features.yml → src/slugs.ts
yarn sync:acronyms     # id + name → src/generated/acronyms.ts
yarn sync:providers    # Foursquare/Google/OSM/HERE → provider-categories.ts
yarn category          # category tooling
yarn check             # neutral-language guard + typecheck + tests
```

## Exports

| Subpath | Purpose |
| --- | --- |
| `@twinfile/geotypes` | Slugs, acronyms, normalization, provider maps, venue helpers |
| `@twinfile/geotypes/geokit` | Optional `PlaceTaxonomyResolver` factory for map hosts (no map SDK dependency here) |
| `@twinfile/geotypes/generated/*` | Protobuf modules |

## Twinfile

Reference slugs from place manifests (e.g. `geotype.primary`) against this registry at a pinned semver — documented in `@twinfile/spec`; the full catalog is not embedded in spec or core.

## Optional map-host wiring

```typescript
import {
  createGeokitTaxonomyResolver,
  type PlaceTaxonomyResolver,
} from '@twinfile/geotypes/geokit';

const resolver: PlaceTaxonomyResolver = createGeokitTaxonomyResolver();
// Register `resolver` with your map host's place-taxonomy hook.
```
