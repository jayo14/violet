import { Client, Account, Databases, ID, Query } from "appwrite";

export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || "violet-db";
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!APPWRITE_PROJECT_ID) {
  console.warn("⚠️ VITE_APPWRITE_PROJECT_ID is not set. Authentication will fail. Please check your .env file.");
}

export const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID || "unset");

// Ping Appwrite on startup to verify connectivity
client.ping().then(() => {
  console.log(`✅ Appwrite connected to project: ${APPWRITE_PROJECT_ID}`);
}).catch((err) => {
  console.error("❌ Appwrite connection failed. Verify your endpoint and project ID:", err);
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

/**
 * Initiates Google OAuth2 session.
 * IMPORTANT: You must add your development URL (e.g., http://localhost:5173) 
 * as a Web Platform in your Appwrite Project Settings for this to work.
 */
export async function loginWithGoogle() {
  try {
    return account.createOAuth2Session(
      "google" as any,
      `${window.location.origin}/`,
      `${window.location.origin}/`
    );
  } catch (err) {
    console.error("Failed to initiate Google OAuth:", err);
    throw err;
  }
}

export async function logoutUser() {
  try {
    await account.deleteSession("current");
    localStorage.removeItem("career_os_logged_in");
  } catch (err) {
    console.error("Logout error:", err);
    throw err;
  }
}

export async function getCurrentUser() {
  try {
    const user = await account.get();
    return user;
  } catch (err: any) {
    // 401 Unauthorized is expected if the user is not logged in
    if (err.code !== 401) {
      console.warn("Appwrite account.get() failed with unexpected error:", err);
    }
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
