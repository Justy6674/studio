import * as functions from "firebase-functions";

/**
 * Type definition that works across both Firebase Functions v1 and v2
 * This circumvents the typing incompatibility issues
 */
interface AuthData {
  uid: string;
  token?: object;
}

/**
 * Helper type that works across both v1 and v2 APIs
 * Avoids direct dependency on specific CallableContext implementation
 */
interface SafeCallableContext {
  auth?: AuthData | null;
}

/**
 * Helper function to create properly typed Firebase callable functions
 * Works with both Firebase Functions v1 and v2
 * 
 * @param handler Function implementation with guaranteed non-null uid
 * @returns Firebase callable function with proper typing and auth verification
 */
export function createAuthenticatedFunction<T, R>(
  handler: (data: T, uid: string) => Promise<R>
) {
  // @ts-expect-error - Deliberately ignoring type issues to support both v1 and v2
  return functions.https.onCall(async (data: T, context?: SafeCallableContext) => {
    // Runtime check that works with both v1 and v2
    if (!context || !context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated", 
        "User must be authenticated to call this function"
      );
    }

    // We've verified auth exists and has uid
    return handler(data, context.auth.uid);
  });
}
