import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  // @ts-ignore - useFetchStreams might be missing in some types but exists in runtime
  useFetchStreams: false, 
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const login = () => signInWithPopup(auth, googleProvider);
export const loginEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const registerEmail = async (email: string, pass: string, name: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  await firebaseUpdateProfile(userCredential.user, { displayName: name });
  
  // Create profile in Firestore immediately
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    email: email,
    displayName: name,
    currency: 'Rp',
    lastSeen: new Date().toISOString()
  });
  
  return userCredential;
};
export const logout = () => signOut(auth);
