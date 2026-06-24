import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  User 
} from 'firebase/auth';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

let authInstance: any = null;
let googleProviderInstance: any = null;
let isFirebaseInitialized = false;

// Attempt Firebase initialization
const firebaseConfigStr = import.meta.env.VITE_FIREBASE_CONFIG;

if (firebaseConfigStr) {
  try {
    const firebaseConfig = JSON.parse(firebaseConfigStr);
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    authInstance = getAuth(app);
    googleProviderInstance = new GoogleAuthProvider();
    isFirebaseInitialized = true;
    console.log("Firebase Auth initialized successfully.");
  } catch (error) {
    console.warn("Failed to initialize Firebase Auth. Running in simulated local credentials mode:", error);
  }
} else {
  console.log("VITE_FIREBASE_CONFIG is empty. Running in simulated local credentials mode.");
}

// Simulated Local Authentication State for testing
const MOCK_USER: UserProfile = {
  uid: 'mock-recruiter-id-123',
  displayName: 'MNC Recruiter Pro',
  email: 'recruiter@corporation.com',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
};

// Store subscribers to auth state changes
const authStateSubscribers = new Set<(user: UserProfile | null) => void>();

// Read initial mock user from localStorage if present
let currentLocalUser: UserProfile | null = (() => {
  const saved = localStorage.getItem('smarthire_mock_user');
  return saved ? JSON.parse(saved) : null;
})();

const notifySubscribers = () => {
  const user = isFirebaseInitialized 
    ? (authInstance?.currentUser ? mapFirebaseUser(authInstance.currentUser) : null)
    : currentLocalUser;
    
  authStateSubscribers.forEach(sub => sub(user));
};

const mapFirebaseUser = (user: User): UserProfile => ({
  uid: user.uid,
  displayName: user.displayName,
  email: user.email,
  photoURL: user.photoURL
});

export const firebaseAuthService = {
  isRealFirebase: () => isFirebaseInitialized,

  subscribeAuthState: (callback: (user: UserProfile | null) => void) => {
    authStateSubscribers.add(callback);
    
    // Initial emission
    const initialUser = isFirebaseInitialized
      ? (authInstance?.currentUser ? mapFirebaseUser(authInstance.currentUser) : null)
      : currentLocalUser;
    callback(initialUser);

    let unsubscribeFirebase: (() => void) | null = null;
    if (isFirebaseInitialized && authInstance) {
      unsubscribeFirebase = authInstance.onAuthStateChanged((user: User | null) => {
        callback(user ? mapFirebaseUser(user) : null);
      });
    }

    return () => {
      authStateSubscribers.delete(callback);
      if (unsubscribeFirebase) unsubscribeFirebase();
    };
  },

  signInWithGoogle: async (): Promise<UserProfile> => {
    if (isFirebaseInitialized && authInstance && googleProviderInstance) {
      try {
        const result = await signInWithPopup(authInstance, googleProviderInstance);
        const mapped = mapFirebaseUser(result.user);
        notifySubscribers();
        return mapped;
      } catch (error) {
        console.error("Google Popup Auth failed:", error);
        throw error;
      }
    }

    // Mock Login trigger
    currentLocalUser = MOCK_USER;
    localStorage.setItem('smarthire_mock_user', JSON.stringify(MOCK_USER));
    notifySubscribers();
    return MOCK_USER;
  },

  logout: async (): Promise<void> => {
    if (isFirebaseInitialized && authInstance) {
      try {
        await signOut(authInstance);
        notifySubscribers();
        return;
      } catch (error) {
        console.error("Firebase SignOut failed:", error);
        throw error;
      }
    }

    // Mock SignOut trigger
    currentLocalUser = null;
    localStorage.removeItem('smarthire_mock_user');
    notifySubscribers();
  }
};
