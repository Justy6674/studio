import * as functions from "firebase-functions";
import * as express from 'express';
import * as cors from 'cors';

const app = express();
app.use(cors({ origin: /^(http:\/\/localhost:\d+|https:\/\/.*\.replit\.dev)$/ }));
import * as admin from "firebase-admin";

admin.initializeApp();

import { logHydration } from "./logHydration";

export { logHydration };
