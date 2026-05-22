# Seed images

Files in this folder are uploaded by `node supabase/seed-storage.js` (run automatically
during `npm run db:reset`) to the buckets declared in `manifest.json`.

| File | Bucket | Object path | Used by |
|---|---|---|---|
| `tshirt-blank.svg` | `item-images` | `seed/tshirt-blank.svg` | Product gallery for *Camiseta Personalizable* |
| `tshirt-blank.svg` | `print-templates` | `seed/tshirt-front-mockup.svg` | Print template mockup for every variation of *Camiseta Personalizable* |

`tshirt-blank.svg` is a hand-drawn blank t-shirt silhouette authored for this repo
(no third-party assets, no attribution required). Replace freely.
