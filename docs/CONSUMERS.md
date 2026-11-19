# Consumers — migrate to `@local-hosting/geotypes`

| From | To |
|------|-----|
| `@local-hosting/geotypes` | `@local-hosting/geotypes` |
| `@twinfile/geotypes` | `@local-hosting/geotypes` |

```bash
yarn exec node scripts/migrate-imports.mjs /path/to/repo
```

Update any `registry:` pins and CI checkout paths to `@local-hosting/geotypes`.
