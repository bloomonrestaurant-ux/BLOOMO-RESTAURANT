import * as admin from 'firebase-admin';

const getServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON environment variable:', e);
    }
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID || 'mock-project-id',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'mock-client-email@gserviceaccount.com',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || 'mock-private-key').replace(/\\n/g, '\n'),
  };
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'mock-bucket.appspot.com',
  });
}

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();

// Configure collection settings if needed
db.settings({ ignoreUndefinedProperties: true });

export default admin;
