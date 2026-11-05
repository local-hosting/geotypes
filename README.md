# @twinfile/geotypes

POI taxonomy registry for Twinfile place units and geokit map I/O — ~297 place types with 3-letter acronyms, vendor mappings, and maintenance CLI.

**Repository:** [github.com/twinfile/geotypes](https://github.com/twinfile/geotypes)

Formerly `twinfile/geotypes` and `@twinfile/geotypes` in monorepo layouts. npm package: **`@twinfile/geotypes`** on GitHub Packages.

## Layout

```text
data/features.yml     POI taxonomy (~297 types)
data/category/        Category YAML
proto/                geospatial.proto + tags.proto
generated/            protoc output (`yarn generate`)
cli/                  Taxonomy maintenance CLI
scripts/preview.mjs   Map preview (optional geokit sibling)
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
yarn check             # typecheck + tests
```

## Map preview

Requires a geokit checkout for UI imports (see `scripts/preview.mjs`).

```bash
cp _secrets.example.yml _secrets.yml   # maptilerKey
yarn open                              # yarn preview
```

## Geokit integration

```typescript
import { setPlaceTaxonomyResolver } from '@geokit/service/place-taxonomy';
import { createGeokitTaxonomyResolver } from '@twinfile/geotypes/geokit';

setPlaceTaxonomyResolver(createGeokitTaxonomyResolver());
```

Geokit should re-export or alias `PlaceTaxonomyResolver` from `@twinfile/geotypes` when the service hook lands.

## Twinfile

Reference slugs from place manifests (`geotype.primary`, etc.) against this registry at a pinned semver — see `@twinfile/spec` (not embedded in spec/core).

## Package name

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
