import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  limit,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Transaction, TransactionType, UserProfile } from '../types';
import { translateFirebaseError } from './errorUtils';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useUserProfile(user: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfiles([]);
      setLoading(false);
      setError(null);
      return;
    }

    const { uid, email, displayName, photoURL } = user;
    const userRef = doc(db, 'users', uid);

    // Robust profile creation/sync
    const syncProfile = async () => {
      try {
        await setDoc(userRef, { 
          email: email || '',
          displayName: displayName || 'User',
          photoURL: photoURL || '',
          lastSeen: new Date().toISOString()
        }, { merge: true });
      } catch (err: any) {
        console.warn("Profile sync error:", err);
      }
    };

    // Initial sync
    if (user) syncProfile();

    const unsubProfile = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setProfile(snap.data() as UserProfile);
    }, (err) => {
      if (err.code !== 'unavailable') console.error("Profile listener error:", err);
    });

    const unsubAll = onSnapshot(collection(db, 'users'), 
      (snap) => {
        const allProfiles = snap.docs.map(d => ({ uid: d.id, ...d.data() })) as UserProfile[];
        // Sort locally by lastSeen if available
        allProfiles.sort((a, b) => {
          const timeA = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
          const timeB = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
          return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        });
        setProfiles(allProfiles);
        setLoading(false);
        setError(null);
      }, 
      (err) => {
        console.error("User list error:", err);
        setError(translateFirebaseError(err));
        setLoading(false);
      }
    );

    const heartbeat = setInterval(() => {
      // Only heartbeat if we have a user to avoid create failures in rules
      if (user) {
        updateDoc(userRef, { lastSeen: new Date().toISOString() }).catch(() => {});
      }
    }, 60000);

    return () => {
      unsubProfile();
      unsubAll();
      clearInterval(heartbeat);
    };
  }, [user?.uid]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), data as any, { merge: true });
  };

  return { profile, profiles, loading, error, updateProfile };
}

export function useTransactions(user: any) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeMain: (() => void) | null = null;
    let unsubscribeFallback: (() => void) | null = null;

    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const startListening = () => {
      const path = 'transactions';
      setLoading(true);
      
      const q = query(
        collection(db, path),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );

      unsubscribeMain = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        setTransactions(data);
        setLoading(false);
        setError(null);
      }, (err) => {
        if (err.code === 'unavailable') {
          console.warn("Transactions unavailable, operating in offline mode.");
          setLoading(false);
          return;
        }
        if (err.message.includes('index')) {
          console.warn("Transactions index missing, falling back to unordered list.");
          const qFallback = query(collection(db, path), where('userId', '==', user.uid));
          unsubscribeFallback = onSnapshot(qFallback, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
            setTransactions(data.sort((a,b) => {
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
            }));
            setLoading(false);
            setError(null);
          }, (fallbackErr) => {
            setError(fallbackErr.message);
            setLoading(false);
          });
        } else {
          setError(err.message);
          setLoading(false);
        }
      });
    };

    startListening();

    return () => {
      if (unsubscribeMain) unsubscribeMain();
      if (unsubscribeFallback) unsubscribeFallback();
    };
  }, [user?.uid]);

  const addTransaction = async (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const path = 'transactions';
    try {
      await addDoc(collection(db, path), {
        ...data,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Create error:", err);
    }
  };

  const removeTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    try {
      const { id: _, ...updateData } = data;
      await updateDoc(doc(db, 'transactions', id), {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  return { transactions, loading, error, addTransaction, removeTransaction, updateTransaction };
}
