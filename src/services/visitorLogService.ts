import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase/firebase';
import { VisitorLog, OperationType } from '../types';

const COLLECTION_NAME = 'visitorLogs';

export const visitorLogService = {
  // Record new entry check-in
  async recordEntry(log: Omit<VisitorLog, 'logId' | 'status'> & { logId?: string }): Promise<string> {
    try {
      const id = log.logId || `vlog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const docRef = doc(db, COLLECTION_NAME, id);
      const newLog: VisitorLog = {
        ...log,
        logId: id,
        status: 'Checked In',
        entryTime: log.entryTime || new Date().toISOString()
      };
      await setDoc(docRef, newLog, { merge: true });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
      return '';
    }
  },

  // Record exit check-out
  async recordExit(logId: string, exitTime?: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, logId);
      await updateDoc(docRef, {
        exitTime: exitTime || new Date().toISOString(),
        status: 'Checked Out'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${logId}`);
    }
  },

  // Realtime subscription for a resident's visitor logs
  subscribeToResidentLogs(residentId: string, flatNumber: string, callback: (logs: VisitorLog[]) => void) {
    const colRef = collection(db, COLLECTION_NAME);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs
          .map(doc => ({
            logId: doc.id,
            ...doc.data()
          } as VisitorLog))
          .filter(
            log =>
              log.residentId === residentId ||
              (flatNumber && log.flatNumber === flatNumber)
          );
        items.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?residentId=${residentId}`);
      }
    );
  },

  // Realtime subscription for active checked-in visitors
  subscribeToActiveLogs(callback: (logs: VisitorLog[]) => void) {
    const colRef = collection(db, COLLECTION_NAME);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs
          .map(doc => ({
            logId: doc.id,
            ...doc.data()
          } as VisitorLog))
          .filter(
            log =>
              log.status === 'Active' ||
              log.status === 'Checked In' ||
              (!log.exitTime && log.status !== 'Completed' && log.status !== 'Checked Out')
          );
        items.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?status=Active`);
      }
    );
  },

  // Realtime subscription for all visitor logs (Historical)
  subscribeToAllLogs(callback: (logs: VisitorLog[]) => void) {
    const colRef = collection(db, COLLECTION_NAME);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          logId: doc.id,
          ...doc.data()
        } as VisitorLog));
        items.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    );
  },

  subscribeToLogs(callback: (logs: VisitorLog[]) => void) {
    return this.subscribeToAllLogs(callback);
  },

  // One-time list
  async getAllLogs(): Promise<VisitorLog[]> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);
      const items = snapshot.docs.map(doc => ({
        logId: doc.id,
        ...doc.data()
      } as VisitorLog));
      items.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
      return items;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  }
};
