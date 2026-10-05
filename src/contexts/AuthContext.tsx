import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { userService } from '../services/userService';
import { UserProfile, UserRole } from '../types';

export interface AuthContextType {
  user: FirebaseUser | null;
  currentUser: FirebaseUser | null; // Alias for backward compatibility
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  login: (email: string, pass: string) => Promise<UserProfile>;
  register: (
    name: string,
    email: string,
    pass: string,
    role: UserRole,
    flatNumber: string,
    phone: string,
    profilePhoto?: string
  ) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getDefaultRoute: (role?: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  /**
   * Helper to derive the default home route for a given user role.
   */
  const getDefaultRoute = (role?: UserRole): string => {
    const targetRole = role || userProfile?.role;
    switch (targetRole) {
      case 'Security':
        return '/security/dashboard';
      case 'Admin':
        return '/admin/dashboard';
      case 'Resident':
      default:
        return '/dashboard';
    }
  };

  /**
   * Reads and validates user profile document from Firestore (`users/{uid}`).
   * If the document does not exist, attempts to auto-provision a profile for valid Auth users.
   */
  const fetchAndValidateUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile> => {
    let profile = await userService.getUserProfile(firebaseUser.uid);
    if (!profile) {
      // Short delay retry in case registration write is in flight
      await new Promise((res) => setTimeout(res, 300));
      profile = await userService.getUserProfile(firebaseUser.uid);
    }

    if (!profile) {
      // Auto-provision profile if document is missing in Firestore for valid authenticated user
      try {
        const derivedRole: UserRole = firebaseUser.email?.toLowerCase().includes('admin')
          ? 'Admin'
          : firebaseUser.email?.toLowerCase().includes('security')
          ? 'Security'
          : 'Resident';

        const autoProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'ParkWise User'),
          email: firebaseUser.email || '',
          role: derivedRole,
          flatNumber: derivedRole === 'Resident' ? 'A-101' : 'N/A',
          phone: '+1 (555) 000-0000',
          profilePhoto: firebaseUser.photoURL || undefined,
          createdAt: new Date().toISOString()
        };

        await userService.createUserProfile(autoProfile);
        profile = autoProfile;
      } catch (autoErr) {
        console.warn('[AuthContext] Auto-creation of missing user profile failed:', autoErr);
        const msg = 'Your account is not configured. Please contact the administrator.';
        await firebaseSignOut(auth);
        setUser(null);
        setUserProfile(null);
        throw new Error(msg);
      }
    }

    // Ensure standard schema alignment with all required fields
    const fullProfile: UserProfile = {
      uid: profile.uid || firebaseUser.uid,
      name: profile.name || firebaseUser.displayName || 'User',
      email: profile.email || firebaseUser.email || '',
      role: profile.role || 'Resident',
      flatNumber: profile.flatNumber || '',
      phone: profile.phone || '',
      profilePhoto: profile.profilePhoto || firebaseUser.photoURL || undefined,
      createdAt: profile.createdAt || new Date().toISOString()
    };

    return fullProfile;
  };

  /**
   * Listen to Firebase auth state changes to persist login sessions.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      setAuthError(null);
      if (fbUser) {
        try {
          const profile = await fetchAndValidateUserProfile(fbUser);
          setUserProfile(profile);
        } catch (err: any) {
          console.warn('[AuthContext] Session user profile invalid or missing:', err.message);
          setAuthError(err.message || 'User profile document missing.');
          setUserProfile(null);
          setUser(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Login using signInWithEmailAndPassword and load Firestore user profile.
   */
  const login = async (email: string, pass: string): Promise<UserProfile> => {
    setLoading(true);
    setAuthError(null);
    try {
      let fbUser: FirebaseUser;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        fbUser = userCredential.user;
      } catch (authErr: any) {
        // Auto-provision demo account if it doesn't exist yet in Firebase Auth
        if (
          (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') &&
          email.toLowerCase().endsWith('@parkwise.io')
        ) {
          const newUserCred = await createUserWithEmailAndPassword(auth, email, pass);
          fbUser = newUserCred.user;
          const derivedRole: UserRole = email.toLowerCase().includes('admin')
            ? 'Admin'
            : email.toLowerCase().includes('security')
            ? 'Security'
            : 'Resident';

          const demoProfile: UserProfile = {
            uid: fbUser.uid,
            name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
            email: email,
            role: derivedRole,
            flatNumber: derivedRole === 'Resident' ? 'A-101' : 'N/A',
            phone: '+1 (555) 000-0000',
            createdAt: new Date().toISOString()
          };
          await userService.createUserProfile(demoProfile);
        } else {
          throw authErr;
        }
      }

      const profile = await fetchAndValidateUserProfile(fbUser);
      setUser(fbUser);
      setUserProfile(profile);
      setLoading(false);
      return profile;
    } catch (err: any) {
      setLoading(false);
      let msg = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network error. Please check your internet connection.';
      } else if (err.message) {
        msg = err.message;
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  /**
   * Register a new user in Firebase Auth and provision users/{uid} in Firestore.
   */
  const register = async (
    name: string,
    email: string,
    pass: string,
    role: UserRole,
    flatNumber: string,
    phone: string,
    profilePhoto?: string
  ): Promise<UserProfile> => {
    setLoading(true);
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = userCredential.user.uid;
      const newProfile: UserProfile = {
        uid,
        name,
        email,
        role,
        flatNumber,
        phone,
        profilePhoto: profilePhoto || undefined,
        createdAt: new Date().toISOString()
      };
      // Write profile to Firestore
      await userService.createUserProfile(newProfile);
      setUser(userCredential.user);
      setUserProfile(newProfile);
      setLoading(false);
      return newProfile;
    } catch (err: any) {
      setLoading(false);
      let msg = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Email address is already registered.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.message) {
        msg = err.message;
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  /**
   * Sign out current user.
   */
  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
      setUser(null);
    } catch (err: any) {
      console.error('[AuthContext] Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh active user profile from Firestore.
   */
  const refreshProfile = async (): Promise<void> => {
    if (user) {
      try {
        const profile = await fetchAndValidateUserProfile(user);
        setUserProfile(profile);
      } catch (err: any) {
        console.error('[AuthContext] Refresh profile error:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        userProfile,
        loading,
        authError,
        login,
        register,
        logout,
        refreshProfile,
        getDefaultRoute
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
