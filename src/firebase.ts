import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Client-side Firestore direct connection is disabled in favor of Express server API (/api/*) proxying,
// preventing client-side gRPC write stream resource exhaustion errors.
let db: any = null;
let useFirestore = false;
let app: any = null;

try {
  if (firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
    useFirestore = true;
  }
} catch (err) {
  console.error("[Firebase] App initialization error:", err);
  useFirestore = false;
}

export { db, useFirestore, app };
