import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase/firebase';
import { Violation, ViolationStatus, OperationType } from '../types';
import { notificationService } from './notificationService';

const COLLECTION_NAME = 'violations';

export const violationService = {
  // Report new violation
  async reportViolation(violation: Omit<Violation, 'violationId' | 'createdAt'>): Promise<string> {
    try {
      const id = `viol-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const docRef = doc(db, COLLECTION_NAME, id);
      const newViolation: Violation = {
        ...violation,
        violationId: id,
        createdAt: new Date().toISOString()
      };
      await setDoc(docRef, newViolation);

      if (violation.residentId) {
        await notificationService.createNotification({
          userId: violation.residentId,
          title: 'Parking Violation Reported',
          message: `A parking violation (${violation.description || 'Unauthorized parking'}) was logged for vehicle ${violation.vehicleNumber}. Severity: ${violation.severity || 'Medium'}.`,
          type: 'Violation'
        });
      }

      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
      return '';
    }
  },

  // Realtime subscription for all violations (Admin / Security)
  subscribeToAllViolations(callback: (violations: Violation[]) => void) {
    const colRef = collection(db, COLLECTION_NAME);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          violationId: doc.id,
          ...doc.data()
        } as Violation));
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    );
  },

  // Realtime subscription for a resident's violations
  subscribeToUserViolations(residentId: string, callback: (violations: Violation[]) => void) {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where('residentId', '==', residentId));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          violationId: doc.id,
          ...doc.data()
        } as Violation));
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?residentId=${residentId}`);
      }
    );
  },

  // Update violation status or fine
  async updateViolationStatus(
    violationId: string,
    status: ViolationStatus,
    extra?: { residentId?: string; vehicleNumber?: string; fineAmount?: number }
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, violationId);
      await updateDoc(docRef, {
        status,
        updatedAt: new Date().toISOString(),
        ...(extra?.fineAmount !== undefined ? { fineAmount: extra.fineAmount } : {})
      });

      if (extra?.residentId) {
        if (status === 'Resolved') {
          await notificationService.createNotification({
            userId: extra.residentId,
            title: 'Violation Resolved',
            message: `Parking violation record for vehicle ${extra.vehicleNumber || ''} has been marked as Resolved.`,
            type: 'Violation'
          });
        } else if (status === 'Rejected') {
          await notificationService.createNotification({
            userId: extra.residentId,
            title: 'Violation Dismissed / Rejected',
            message: `Parking violation report for vehicle ${extra.vehicleNumber || ''} has been reviewed and dismissed.`,
            type: 'Violation'
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${violationId}`);
    }
  },

  async resolveViolation(violationId: string, residentId?: string, vehicleNumber?: string): Promise<void> {
    return this.updateViolationStatus(violationId, 'Resolved', { residentId, vehicleNumber });
  },

  async rejectViolation(violationId: string, residentId?: string, vehicleNumber?: string): Promise<void> {
    return this.updateViolationStatus(violationId, 'Rejected', { residentId, vehicleNumber });
  },

  // Delete violation
  async deleteViolation(violationId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, violationId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${violationId}`);
    }
  }
};
