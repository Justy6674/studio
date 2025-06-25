"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthenticatedFunction = createAuthenticatedFunction;
const functions = __importStar(require("firebase-functions"));
/**
 * Helper function to create properly typed Firebase callable functions
 * Works with both Firebase Functions v1 and v2
 *
 * @param handler Function implementation with guaranteed non-null uid
 * @returns Firebase callable function with proper typing and auth verification
 */
function createAuthenticatedFunction(handler) {
    // @ts-expect-error - Deliberately ignoring type issues to support both v1 and v2
    return functions.https.onCall(async (data, context) => {
        // Runtime check that works with both v1 and v2
        if (!context || !context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to call this function");
        }
        // We've verified auth exists and has uid
        return handler(data, context.auth.uid);
    });
}
//# sourceMappingURL=firebase.js.map