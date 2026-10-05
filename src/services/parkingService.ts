import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase/firebase';
import { ParkingSlot, SlotStatus, OperationType } from '../types';

import { notificationService } from './notificationService';

const COLLECTION_NAME = 'parkingSlots';

export const parkingService = {
  // Get all slots once
  async getAllSlots(): Promise<ParkingSlot[]> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map(doc => ({
        slotId: doc.id,
        ...doc.data()
      } as ParkingSlot));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  },

  // Realtime subscription for all parking slots
  subscribeToSlots(callback: (slots: ParkingSlot[]) => void) {
    const colRef = collection(db, COLLECTION_NAME);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const slots = snapshot.docs.map(doc => ({
          slotId: doc.id,
          ...doc.data()
        } as ParkingSlot));
        // Sort by slot number logically
        slots.sort((a, b) => a.slotNumber.localeCompare(b.slotNumber, undefined, { numeric: true }));
        callback(slots);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    );
  },

  // Get single slot
  async getSlotById(slotId: string): Promise<ParkingSlot | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, slotId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { slotId: snapshot.id, ...snapshot.data() } as ParkingSlot;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${slotId}`);
      return null;
    }
  },

  // Add or initialize a slot
  async createSlot(slot: Omit<ParkingSlot, 'slotId'> & { slotId?: string }): Promise<string> {
    try {
      const id = slot.slotId || `slot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const docRef = doc(db, COLLECTION_NAME, id);
      const newSlot: ParkingSlot = {
        ...slot,
        slotId: id,
        createdAt: slot.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(docRef, newSlot, { merge: true });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
      return '';
    }
  },

  // Update slot details
  async updateSlot(slotId: string, updates: Partial<ParkingSlot>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, slotId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${slotId}`);
    }
  },

  // Assign slot to resident
  async assignSlotToResident(slotId: string, residentId: string | null, residentName?: string | null, slotNumber?: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, slotId);
      await updateDoc(docRef, {
        assignedResident: residentId || null,
        assignedResidentName: residentName || null,
        updatedAt: new Date().toISOString()
      });

      if (residentId) {
        await notificationService.createNotification({
          userId: residentId,
          title: 'Parking Slot Assigned',
          message: `Parking slot ${slotNumber || slotId} has been assigned to you.`,
          type: 'Parking'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${slotId}`);
    }
  },

  // Update status (e.g. Occupied/Available/Reserved)
  async updateSlotStatus(slotId: string, status: SlotStatus): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, slotId);
      await updateDoc(docRef, {
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${slotId}`);
    }
  },

  // Automatically free slot by slotId or slotNumber
  async freeSlotByNumberOrId(slotIdentifier: string): Promise<void> {
    try {
      if (!slotIdentifier) return;
      // 1. Check if direct slotId exists
      const directRef = doc(db, COLLECTION_NAME, slotIdentifier);
      const snap = await getDoc(directRef);
      if (snap.exists()) {
        await updateDoc(directRef, {
          status: 'Available',
          updatedAt: new Date().toISOString()
        });
        return;
      }
      // 2. Query by slotNumber
      const q = query(collection(db, COLLECTION_NAME), where('slotNumber', '==', slotIdentifier));
      const querySnap = await getDocs(q);
      for (const d of querySnap.docs) {
        await updateDoc(d.ref, {
          status: 'Available',
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${slotIdentifier}`);
    }
  },

  // Automatically mark slot as Occupied by slotId or slotNumber
  async occupySlotByNumberOrId(slotIdentifier: string): Promise<void> {
    try {
      if (!slotIdentifier) return;
      const directRef = doc(db, COLLECTION_NAME, slotIdentifier);
      const snap = await getDoc(directRef);
      if (snap.exists()) {
        await updateDoc(directRef, {
          status: 'Occupied',
          updatedAt: new Date().toISOString()
        });
        return;
      }
      const q = query(collection(db, COLLECTION_NAME), where('slotNumber', '==', slotIdentifier));
      const querySnap = await getDocs(q);
      for (const d of querySnap.docs) {
        await updateDoc(d.ref, {
          status: 'Occupied',
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${slotIdentifier}`);
    }
  },

  // Delete slot
  async deleteSlot(slotId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, slotId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${slotId}`);
    }
  }
};
