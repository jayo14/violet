/**
 * Appwrite Migration Script
 * Creates database, collections, attributes, indexes, auth config, and storage.
 *
 * Usage:
 *   APPWRITE_API_KEY=<server-api-key> npx tsx scripts/migrate.ts
 *
 * Get your API key from: Appwrite Console → Project → API Keys → Create Key
 * Required scopes: databases.write, collections.write, attributes.write,
 *                  indexes.write, auth.write, storage.write
 */

import { Client, Databases, Storage, Users, ID, Permission, Role, IndexType } from "node-appwrite";

const ENDPOINT  = process.env.VITE_APPWRITE_ENDPOINT  || "https://fra.cloud.appwrite.io/v1";
const PROJECT   = process.env.VITE_APPWRITE_PROJECT_ID || "6a31e136001844f9234d";
const API_KEY   = process.env.APPWRITE_API_KEY || "";
const DB_ID     = process.env.VITE_APPWRITE_DATABASE_ID || "violet-db";

if (!API_KEY) {
  console.error("❌  Set APPWRITE_API_KEY before running migrations.");
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(API_KEY);
const db      = new Databases(client);
const storage = new Storage(client);

// ── helpers ──────────────────────────────────────────────────────────────────

async function upsertDatabase() {
  try {
    await db.get(DB_ID);
    console.log(`  ↩  database '${DB_ID}' already exists`);
  } catch {
    await db.create(DB_ID, "Violet DB");
    console.log(`  ✅  created database '${DB_ID}'`);
  }
}

async function upsertCollection(id: string, name: string) {
  try {
    await db.getCollection(DB_ID, id);
    console.log(`  ↩  collection '${id}' already exists`);
  } catch {
    await db.createCollection(DB_ID, id, name, [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ]);
    console.log(`  ✅  created collection '${id}'`);
  }
}

type AttrDef =
  | { type: "string";  key: string; size?: number; required?: boolean; array?: boolean; default?: string | null }
  | { type: "boolean"; key: string; required?: boolean; default?: boolean | null }
  | { type: "integer"; key: string; required?: boolean; min?: number; max?: number; default?: number | null }
  | { type: "float";   key: string; required?: boolean; min?: number; max?: number; default?: number | null };

async function addAttr(collId: string, attr: AttrDef) {
  try {
    if (attr.type === "string") {
      await db.createStringAttribute(DB_ID, collId, attr.key, attr.size ?? 255, attr.required ?? false, attr.default ?? null, attr.array ?? false);
    } else if (attr.type === "boolean") {
      await db.createBooleanAttribute(DB_ID, collId, attr.key, attr.required ?? false, attr.default ?? null);
    } else if (attr.type === "integer") {
      await db.createIntegerAttribute(DB_ID, collId, attr.key, attr.required ?? false, attr.min, attr.max, attr.default ?? null);
    } else if (attr.type === "float") {
      await db.createFloatAttribute(DB_ID, collId, attr.key, attr.required ?? false, attr.min, attr.max, attr.default ?? null);
    }
    console.log(`    + attr '${attr.key}'`);
  } catch (e: any) {
    if (e?.code === 409) {
      console.log(`    ↩  attr '${attr.key}' exists`);
    } else {
      console.warn(`    ⚠  attr '${attr.key}': ${e.message}`);
    }
  }
}

async function addIndex(collId: string, key: string, attrs: string[]) {
  try {
    await db.createIndex(DB_ID, collId, key, IndexType.Key, attrs);
    console.log(`    + index '${key}'`);
  } catch (e: any) {
    if (e?.code === 409) console.log(`    ↩  index '${key}' exists`);
    else console.warn(`    ⚠  index '${key}': ${e.message}`);
  }
}

// ── sleep to avoid hitting Appwrite rate limits on attribute creation ─────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log("\n🚀  Violet — Appwrite Migration\n");

  // ── Database ──────────────────────────────────────────────────────────────
  await upsertDatabase();

  // ── users ─────────────────────────────────────────────────────────────────
  console.log("\n[users]");
  await upsertCollection("users", "Users");
  const userAttrs: AttrDef[] = [
    { type: "string",  key: "userId",    size: 36,   required: true },
    { type: "string",  key: "fullName",  size: 100,  required: true },
    { type: "string",  key: "email",     size: 255,  required: true },
    { type: "string",  key: "phone",     size: 50 },
    { type: "string",  key: "github",    size: 255 },
    { type: "string",  key: "linkedin",  size: 255 },
    { type: "string",  key: "portfolio", size: 255 },
    { type: "string",  key: "location",  size: 255 },
    // Nested arrays stored as JSON strings (Appwrite doesn't support nested objects)
    { type: "string",  key: "education",  size: 10000, default: "[]" },
    { type: "string",  key: "experience", size: 10000, default: "[]" },
    { type: "string",  key: "skills",     size: 5000,  default: "[]" },
    { type: "string",  key: "memory",     size: 20000, default: "{}" },
  ];
  for (const a of userAttrs) { await addAttr("users", a); await sleep(300); }
  await addIndex("users", "idx_userId", ["userId"]);

  // ── applications ─────────────────────────────────────────────────────────
  console.log("\n[applications]");
  await upsertCollection("applications", "Applications");
  const appAttrs: AttrDef[] = [
    { type: "string",  key: "userId",       size: 36,   required: true },
    { type: "string",  key: "title",        size: 200,  required: true },
    { type: "string",  key: "company",      size: 200,  required: true },
    { type: "string",  key: "location",     size: 255 },
    { type: "string",  key: "salary",       size: 100 },
    { type: "string",  key: "deadline",     size: 50  },
    { type: "string",  key: "status",       size: 50,   required: true, default: "SAVED" },
    { type: "string",  key: "requirements", size: 5000, default: "[]" },
    { type: "string",  key: "descriptionText", size: 10000 },
    { type: "string",  key: "createdAt",    size: 30,   required: true },
  ];
  for (const a of appAttrs) { await addAttr("applications", a); await sleep(300); }
  await addIndex("applications", "idx_userId", ["userId"]);
  await addIndex("applications", "idx_status",  ["userId", "status"]);

  // ── emails ────────────────────────────────────────────────────────────────
  console.log("\n[emails]");
  await upsertCollection("emails", "Emails");
  const emailAttrs: AttrDef[] = [
    { type: "string",  key: "userId",         size: 36,    required: true },
    { type: "string",  key: "sender",         size: 255,   required: true },
    { type: "string",  key: "subject",        size: 500,   required: true },
    { type: "string",  key: "body",           size: 10000, required: true },
    { type: "string",  key: "receivedAt",     size: 30,    required: true },
    { type: "string",  key: "category",       size: 50,    required: true, default: "OPPORTUNITY" },
    { type: "boolean", key: "processed",      required: true, default: false },
    { type: "string",  key: "suggestedAction", size: 1000 },
  ];
  for (const a of emailAttrs) { await addAttr("emails", a); await sleep(300); }
  await addIndex("emails", "idx_userId",     ["userId"]);
  await addIndex("emails", "idx_processed",  ["userId", "processed"]);

  // ── achievements ─────────────────────────────────────────────────────────
  console.log("\n[achievements]");
  await upsertCollection("achievements", "Achievements");
  const achAttrs: AttrDef[] = [
    { type: "string",  key: "userId",            size: 36,    required: true },
    { type: "string",  key: "title",             size: 300,   required: true },
    { type: "string",  key: "source",            size: 50,    required: true },
    { type: "string",  key: "description",       size: 5000,  required: true },
    { type: "string",  key: "detectedAt",        size: 30,    required: true },
    { type: "boolean", key: "isAppliedToResume", required: true, default: false },
  ];
  for (const a of achAttrs) { await addAttr("achievements", a); await sleep(300); }
  await addIndex("achievements", "idx_userId", ["userId"]);

  // ── approvals ─────────────────────────────────────────────────────────────
  console.log("\n[approvals]");
  await upsertCollection("approvals", "Approvals");
  const apprAttrs: AttrDef[] = [
    { type: "string",  key: "userId",      size: 36,    required: true },
    { type: "string",  key: "type",        size: 50,    required: true },
    { type: "string",  key: "title",       size: 300,   required: true },
    { type: "string",  key: "description", size: 2000 },
    { type: "string",  key: "payload",     size: 20000, default: "{}" },
    { type: "string",  key: "status",      size: 20,    required: true, default: "pending" },
    { type: "string",  key: "createdAt",   size: 30,    required: true },
  ];
  for (const a of apprAttrs) { await addAttr("approvals", a); await sleep(300); }
  await addIndex("approvals", "idx_userId", ["userId"]);
  await addIndex("approvals", "idx_status", ["userId", "status"]);

  // ── Storage bucket ────────────────────────────────────────────────────────
  console.log("\n[storage]");
  try {
    await storage.getBucket("resumes");
    console.log("  ↩  bucket 'resumes' already exists");
  } catch {
    await storage.createBucket("resumes", "Resumes", [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ], false, undefined, 5 * 1024 * 1024, ["application/pdf", "text/plain"]);
    console.log("  ✅  created bucket 'resumes' (max 5 MB, pdf/txt)");
  }

  console.log("\n✅  Migration complete!\n");
  console.log("Auth is managed by Appwrite's built-in service.");
  console.log("Enable Email/Password + Google OAuth in:");
  console.log("  Console → Auth → Settings → OAuth2 Providers → Google\n");
}

run().catch((e) => {
  console.error("\n❌  Migration failed:", e.message ?? e);
  process.exit(1);
});
