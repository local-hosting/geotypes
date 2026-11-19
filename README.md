# @local-hosting/geotypes

Open POI taxonomy registry — slugs, acronyms, vendor crosswalks, and a maintenance CLI.

## Layout

```text
data/venue/features.yml         Places (venues people occupy or travel along)
data/resource/features.yml      Equipment and conveyance
data/category/                  Category YAML
data/place-archetype-rules.yml  Authoring-scale defaults + slug overrides
proto/                          geospatial.proto + tags.proto
generated/                      protoc output (`yarn generate`)
cli/                            Taxonomy maintenance CLI
scripts/                        Sync helpers
src/                            Runtime (slugs, acronyms, providers, archetypes)
```

## Commands

```bash
yarn install
yarn generate   # proto → generated/
yarn sync       # slugs, acronyms, providers, format mappings, place archetypes
yarn check      # vendor-neutral guard + typecheck + tests
yarn viz        # taxonomy diagram at http://localhost:5175
```

`yarn viz` needs a sibling [`@westlane/isocanvas`](https://github.com/westlane/isocanvas) at `../../westlane/isocanvas`, or set `ISOCANVAS_ROOT`.

## Exports

| Subpath | Purpose |
| --- | --- |
| `@local-hosting/geotypes` | Slugs, acronyms, provider maps, place scaffolds |
| `@local-hosting/geotypes/generated/*` | Protobuf modules |

```typescript
import { placeScaffoldForSlug, isAssetGeotype } from '@local-hosting/geotypes';

placeScaffoldForSlug('shopping_mall');
isAssetGeotype('stop_sign'); // true — point assets have no place scaffold
```
