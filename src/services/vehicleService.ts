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
import { Vehicle, OperationType } from '../types';

const COLLECTION_NAME = 'vehicles';

export const vehicleService = {
  // Get vehicles for owner
  async getVehiclesByOwner(ownerId: string): Promise<Vehicle[]> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, where('ownerId', '==', ownerId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        vehicleId: doc.id,
        ...doc.data()
      } as Vehicle));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?ownerId=${ownerId}`);
      return [];
    }
  },

  // Realtime subscription for owner's vehicles
  subscribeToUserVehicles(ownerId: string, callback: (vehicles: Vehicle[]) => void) {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where('ownerId', '==', ownerId));
    return onSnapshot(
      q,
      (snapshot) => {
        const vehicles = snapshot.docs.map(doc => ({
          vehicleId: doc.id,
          ...doc.data()
        } as Vehicle));
        callback(vehicles);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?ownerId=${ownerId}`);
      }
    );
  },

  // Get all registered vehicles (Admin/Security view)
  async getAllVehicles(): Promise<Vehicle[]> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map(doc => ({
        vehicleId: doc.id,
        ...doc.data()
      } as Vehicle));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  },

  // Realtime subscription for all vehicles
  subscribeToAllVehicles(callback: (vehicles: Vehicle[]) => void) {
    const colRef = collection(db, COLLECTION_NAME);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const vehicles = snapshot.docs.map(doc => ({
          vehicleId: doc.id,
          ...doc.data()
        } as Vehicle));
        callback(vehicles);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    );
  },

  // Add new vehicle
  async addVehicle(vehicle: Omit<Vehicle, 'vehicleId'> & { vehicleId?: string }): Promise<string> {
    try {
      const id = vehicle.vehicleId || `veh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const docRef = doc(db, COLLECTION_NAME, id);
      const newVehicle: Vehicle = {
        ...vehicle,
        vehicleId: id,
        createdAt: vehicle.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(docRef, newVehicle);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
      return '';
    }
  },

  // Update vehicle details
  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, vehicleId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${vehicleId}`);
    }
  },

  // Delete vehicle
  async deleteVehicle(vehicleId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, vehicleId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${vehicleId}`);
    }
  }
};
