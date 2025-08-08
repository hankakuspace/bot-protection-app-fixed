// proxy/src/firebase.ts
import admin from 'firebase-admin';
import path from 'path';

if (!admin.apps.length) {
  const credPath = path.join(process.cwd(), 'serviceAccount.json'); // proxy直下の鍵を参照
  admin.initializeApp({
    credential: admin.credential.cert(require(credPath)),
  });
}

export const db = admin.firestore();
