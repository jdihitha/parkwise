import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase/firebase';
import { NotificationItem, OperationType } from '../types';

const COLLECTION_NAME = 'notifications';

export const notificationService = {
  // Send notification to a specific user
  async createNotification(notification: Omit<NotificationItem, 'notificationId' | 'createdAt' | 'read'>): Promise<string> {
    try {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const docRef = doc(db, COLLECTION_NAME, id);
      const newNotif: NotificationItem = {
        ...notification,
        notificationId: id,
        read: false,
        createdAt: new Date().toISOString()
      };
      await setDoc(docRef, newNotif);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
      return '';
    }
  },

  // Realtime listener for user's notifications
  subscribeToUserNotifications(userId: string, callback: (notifications: NotificationItem[]) => void) {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          notificationId: doc.id,
          ...doc.data()
        } as NotificationItem));
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?userId=${userId}`);
      }
    );
  },

  // Realtime listener for all notifications (Admin)
  subscribeToAllNotifications(callback: (notifications: NotificationItem[]) => void) {
    const colRef = collection(db, COLLECTION_NAME);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          notificationId: doc.id,
          ...doc.data()
        } as NotificationItem));
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    );
  },

  // Mark single notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, notificationId);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${notificationId}`);
    }
  },

  // Mark all unread notifications for user as read
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, where('userId', '==', userId), where('read', '==', false));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return;
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { read: true });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}?userId=${userId}`);
    }
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, notificationId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${notificationId}`);
    }
  },

  // Delete all read notifications for user
  async deleteAllReadNotifications(userId: string): Promise<void> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, where('userId', '==', userId), where('read', '==', true));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return;
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}?userId=${userId}&read=true`);
    }
  }
};
