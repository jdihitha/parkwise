import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase/firebase';
import { UserProfile, UserRole, OperationType } from '../types';

const COLLECTION_NAME = 'users';

export const userService = {
  // Get user profile by UID
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${uid}`);
      return null;
    }
  },

  // Realtime subscription for user profile
  subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
    const docRef = doc(db, COLLECTION_NAME, uid);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as UserProfile);
        } else {
          callback(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${uid}`);
      }
    );
  },

  // Save or create user profile
  async createUserProfile(profile: UserProfile): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, profile.uid);
      await setDoc(docRef, {
        ...profile,
        createdAt: profile.createdAt || new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${profile.uid}`);
    }
  },

  // Update existing profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      await updateDoc(docRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${uid}`);
    }
  },

  // Update user role
  async updateUserRole(uid: string, role: UserRole): Promise<void> {
    return this.updateUserProfile(uid, { role });
  },

  // Get all users (Admin view)
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  },

  // Realtime list of all users
  subscribeToAllUsers(callback: (users: UserProfile[]) => void) {
    const colRef = collection(db, COLLECTION_NAME);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const users = snapshot.docs.map(doc => doc.data() as UserProfile);
        callback(users);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    );
  },

  subscribeToUsers(callback: (users: UserProfile[]) => void) {
    return this.subscribeToAllUsers(callback);
  },

  // Filter users by role
  async getUsersByRole(role: UserRole): Promise<UserProfile[]> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, where('role', '==', role));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?role=${role}`);
      return [];
    }
  },

  // Delete user document
  async deleteUser(uid: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${uid}`);
    }
  }
};
