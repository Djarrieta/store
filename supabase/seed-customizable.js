// Seeds the "Camiseta Personalizable" product, its variations, and per-variation
// print templates via PostgREST + the service-role key.
//
// Run independently:    node supabase/seed-customizable.js
// Or chained via       npm run db:reset
//
// Idempotent: uses deterministic UUIDs + Prefer: resolution=merge-duplicates.
// Depends on:
//   - migrations 08 (customization_kinds), 09 (products), 10 (items), 17 (print_templates)
//   - seed 00_customization_kinds.sql (tshirt kind row)
//   - seed 01_categories.sql (variant dimensions Talla + Color)
//   - seed-storage.js (uploads the mockup + mask referenced below)
const { readFileSync } = require("fs");
const { join } = require("path");

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(__dirname, "../.env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env.local not found — rely on shell environment
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "✗ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local",
  );
  process.exit(1);
}

const PRODUCT_ID = "c2a00000-0000-0000-0000-000000000001";
const TSHIRT_KIND_ID = "b2000000-0000-0000-0000-000000000002";
const MOCKUP_PATH = "seed/tshirt-front-mockup.svg";
const MASK_PATH = "seed/tshirt-mask.svg";
// Storefront card image — external photo, not uploaded to Supabase Storage.
const GALLERY_URL =
  "https://mongooseboutique.com/wp-content/uploads/2019/05/Principe-de-la-casa.jpg";

// Talla (parent b1000000-…-001), Color Blanco (b1000000-…-021)
const CAT_COLOR_BLANCO = "b1000000-0000-0000-0000-000000000021";
const SIZE_VARIANTS = [
  { code: "S",   itemId: "c2a01000-0000-0000-0000-000000000001", catId: "b1000000-0000-0000-0000-000000000002", stock: 25 },
  { code: "M",   itemId: "c2a01000-0000-0000-0000-000000000002", catId: "b1000000-0000-0000-0000-000000000003", stock: 30 },
  { code: "L",   itemId: "c2a01000-0000-0000-0000-000000000003", catId: "b1000000-0000-0000-0000-000000000004", stock: 25 },
  { code: "XL",  itemId: "c2a01000-0000-0000-0000-000000000004", catId: "b1000000-0000-0000-0000-000000000005", stock: 18 },
  { code: "XXL", itemId: "c2a01000-0000-0000-0000-000000000005", catId: "b1000000-0000-0000-0000-000000000006", stock: 12 },
];

const baseHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function pgrest(path, init = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...baseHeaders, ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function upsert(table, rows, onConflict) {
  if (rows.length === 0) return;
  const qs = onConflict ? `?on_conflict=${onConflict}` : "";
  await pgrest(`${table}${qs}`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
}

async function main() {
  console.log("→ Seeding 'Camiseta Personalizable' product, items, and templates...");

  // 1. Product
  await upsert(
    "products",
    [
      {
        id: PRODUCT_ID,
        title: "Camiseta Personalizable",
        description:
          "Camiseta unisex en algodón 100% lista para imprimir tu propia imagen. Sube tu diseño, ajústalo sobre el frente y nosotros nos encargamos del estampado.",
        price: 79900,
        discount: 0,
        images: [
          {
            url: GALLERY_URL,
            description: "Vista frontal — blanca",
          },
        ],
        tags: ["camiseta", "personalizable", "algodon", "unisex"],
        ocultar: false,
        customizable: true,
        customization_kind_id: TSHIRT_KIND_ID,
      },
    ],
    "id",
  );
  console.log("  ✓ product upserted");

  // 2. Items (one per size, all Blanco)
  await upsert(
    "items",
    SIZE_VARIANTS.map((v) => ({
      id: v.itemId,
      product_id: PRODUCT_ID,
      stock: v.stock,
    })),
    "id",
  );
  console.log(`  ✓ ${SIZE_VARIANTS.length} items upserted`);

  // 3. item_categories — both Talla and Color for each
  const itemCats = [];
  for (const v of SIZE_VARIANTS) {
    itemCats.push({ item_id: v.itemId, category_id: v.catId });
    itemCats.push({ item_id: v.itemId, category_id: CAT_COLOR_BLANCO });
  }
  await upsert("item_categories", itemCats, "item_id,category_id");
  console.log(`  ✓ ${itemCats.length} item_categories upserted`);

  // 4. print_templates — one per item, same mockup and dimensions for now
  await upsert(
    "print_templates",
    SIZE_VARIANTS.map((v) => ({
      item_id: v.itemId,
      label: `Talla ${v.code} — Frente`,
      attributes: { placement: "front" },
      width_mm: 300,
      height_mm: 400,
      print_dpi: 300,
      mockup_path: MOCKUP_PATH,
      mask_path: MASK_PATH,
      safe_area: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
    })),
    "item_id",
  );
  console.log(`  ✓ ${SIZE_VARIANTS.length} print_templates upserted`);

  console.log("✓ 'Camiseta Personalizable' seeded.");
}

main().catch((err) => {
  console.error(`✗ ${err.message ?? err}`);
  process.exit(1);
});
