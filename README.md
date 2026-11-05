# @twinfile/geotypes

Open POI taxonomy registry for Twinfile place units and geokit map I/O — place-type slugs, 3-letter acronyms, vendor crosswalks, and maintenance CLI.

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
yarn check             # typecheck + tests
```

## Geokit integration

```typescript
import { setPlaceTaxonomyResolver } from '@geokit/service/place-taxonomy';
import { createGeokitTaxonomyResolver } from '@twinfile/geotypes/geokit';

setPlaceTaxonomyResolver(createGeokitTaxonomyResolver());
```

When geokit exposes `place-taxonomy` on `@geokit/service`, wire the resolver there. Until then, types live under `@twinfile/geotypes` (`src/types/place-taxonomy.ts`).

## Twinfile

Reference slugs from place manifests (e.g. `geotype.primary`) against this registry at a pinned semver — documented in `@twinfile/spec`; the full catalog is not embedded in spec or core.
