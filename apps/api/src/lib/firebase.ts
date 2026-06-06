import * as admin from 'firebase-admin';
import path from 'node:path';
import fs from 'node:fs';

const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');

if (admin.apps.length === 0) {
  if (fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    console.log('Firebase initialized using serviceAccountKey.json');
  } else {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountVar) {
      try {
        const serviceAccount = JSON.parse(serviceAccountVar);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase initialized using FIREBASE_SERVICE_ACCOUNT env variable');
      } catch (err) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:', err);
        admin.initializeApp();
      }
    } else {
      console.warn('No serviceAccountKey.json found and FIREBASE_SERVICE_ACCOUNT env not set. Using default credentials.');
      admin.initializeApp();
    }
  }
}

export const db = admin.firestore();
export default admin;
