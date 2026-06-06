# @twinfile/geotypes

Full POI taxonomy — migrated from `~/GitHub/geotypes` into the product monorepo.

## Layout

```text
data/features.yml     POI taxonomy (~297 types)
data/category/        Category YAML
proto/                geospatial.proto + tags.proto
generated/            protoc output (`yarn generate`)
cli/                  Taxonomy maintenance CLI
scripts/preview.mjs   Map preview
src/                  Runtime (slugs, brand crosswalk, venue partition)
```

## Map preview

```bash
cp _secrets.example.yml _secrets.yml   # maptilerKey
yarn open                              # yarn preview
```

## Taxonomy CLI

```bash
yarn generate          # proto → generated/
yarn sync:slugs        # data/features.yml → src/slugs.ts
yarn category          # category tooling
```

## Consumers

- `packages/pipeline` — CDN venue geopoint export by brand + geotype
- `places-data` (future) — bake `properties.geotype` at build
