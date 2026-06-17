import { Client, Account, Databases, ID, Query } from "appwrite";

export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || "violet-db";

export const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Ping Appwrite on startup to verify connectivity
client.ping().then(() => {
  console.log("✅ Appwrite ping successful");
}).catch((err) => {
  console.warn("⚠️ Appwrite ping failed:", err);
});

export const account = new Account(client);
export const databases = new Databases(client);

export { ID, Query };

// Collection IDs (create these in Appwrite console)
export const COLLECTIONS = {
  USERS: "users",
  APPLICATIONS: "applications",
  EMAILS: "emails",
  ACHIEVEMENTS: "achievements",
  APPROVALS: "approvals",
  MEMORY: "memory",
};

// Auth helpers
export async function loginWithEmail(email: string, password: string) {
  return account.createEmailPasswordSession(email, password);
}

export async function signupWithEmail(email: string, password: string, name: string) {
  await account.create(ID.unique(), email, password, name);
  return account.createEmailPasswordSession(email, password);
}

export async function loginWithGoogle() {
  account.createOAuth2Session(
    "google" as any,
    `${window.location.origin}/`,
    `${window.location.origin}/`
  );
}

export async function logoutUser() {
  try {
    await account.deleteSession("current");
  } catch (err) {
    console.error("Logout error:", err);
    throw err;
  }
}

export async function getCurrentUser() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

// Re-export OperationType for compatibility
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write"
}

export function handleAppwriteError(error: unknown, operationType: OperationType, path: string | null) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`Appwrite Error [${operationType}] at ${path}:`, msg);
  throw new Error(msg);
}
