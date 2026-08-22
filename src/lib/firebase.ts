import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics if supported
export let analytics: any = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(() => {});

// Use specified Firestore database instance for this applet
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Info: ', JSON.stringify(errInfo));
}

/**
 * Recursively removes all `undefined` values from an object before saving to Firestore,
 * preventing 'Unsupported field value: undefined' errors.
 */
export function cleanFirestorePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanFirestorePayload) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestorePayload(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Test connection on boot as mandated
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Auxiliadora Media connected successfully.");
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    const code = error?.code;
    if (code === 'unavailable' || msg.includes('unavailable') || msg.includes('offline') || msg.includes('Could not reach Cloud Firestore')) {
      console.info("Firestore operating in offline/cached mode while establishing server connection.");
    } else {
      console.warn("Firestore connection status:", msg);
    }
  }
}

setTimeout(() => {
  testConnection().catch(() => {});
}, 1000);

export async function resetUserPassword(userEmail: string) {
  return await sendPasswordResetEmail(auth, userEmail);
}

export async function createFirebaseAuthAccount(email: string, pass: string) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    if (credential.user) {
      await sendEmailVerification(credential.user).catch(console.warn);
    }
    return credential.user;
  } catch (error) {
    console.warn('Firebase Auth creation notice:', error);
    return null;
  }
}

