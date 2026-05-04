import PocketBase from "pocketbase";

const instances = new Map<string, PocketBase>();

/**
 * Get or create a PocketBase instance for a specific user
 * Used primarily for user-specific operations
 */
export function getPocketBaseInstance(userId?: string): PocketBase {
  const key = userId || "default";

  if (!instances.has(key)) {
    const pb = new PocketBase(
      process.env.POCKETBASE_URL || "http://127.0.0.1:8090"
    );
    instances.set(key, pb);
  }

  return instances.get(key)!;
}

/**
 * Helper to safely call PocketBase with error handling
 */
export function handlePocketBaseError(error: any): {
  statusCode: number;
  message: string;
} {
  if (error.status === 400) {
    return {
      statusCode: 400,
      message: error.data?.message || "Invalid request",
    };
  }

  if (error.status === 401) {
    return {
      statusCode: 401,
      message: "Invalid email or password",
    };
  }

  if (error.status === 404) {
    return {
      statusCode: 404,
      message: "User not found",
    };
  }

  if (error.status === 409) {
    return {
      statusCode: 409,
      message: "User already exists",
    };
  }

  return {
    statusCode: error.status || 500,
    message: error.data?.message || error.message || "An error occurred",
  };
}
