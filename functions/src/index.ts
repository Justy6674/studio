import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

import { logHydration } from "./logHydration";

export { logHydration };
