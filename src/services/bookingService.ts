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
import { VisitorBooking, BookingStatus, OperationType } from '../types';
import { notificationService } from './notificationService';

const COLLECTION_NAME = 'visitorBookings';

export const bookingService = {
  // Create new visitor booking
  async createBooking(booking: Omit<VisitorBooking, 'bookingId' | 'createdAt'>): Promise<string> {
    try {
      const id = `vbook-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const docRef = doc(db, COLLECTION_NAME, id);
      const now = new Date().toISOString();
      const newBooking: VisitorBooking = {
        ...booking,
        bookingId: id,
        createdAt: now,
        updatedAt: now
      };
      await setDoc(docRef, newBooking);

      // Create notification document automatically for booking creation
      if (booking.residentId) {
        await notificationService.createNotification({
          userId: booking.residentId,
          title: 'Visitor Pass Created',
          message: `Visitor pass created for ${booking.guestName} (${booking.vehicleNumber}) on ${booking.date} (${booking.startTime} - ${booking.endTime}). Status: ${booking.status}.`,
          type: 'Booking'
        });
      }

      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
      return '';
    }
  },

  // Check if slot has overlapping bookings
  async checkSlotConflict(
    slotId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    try {
      if (!slotId) return false;
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, where('slotId', '==', slotId), where('date', '==', date));
      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        if (excludeBookingId && docSnap.id === excludeBookingId) continue;
        const b = docSnap.data() as VisitorBooking;

        // Skip cancelled or rejected bookings
        if (b.status === 'Cancelled' || b.status === 'Rejected' || b.status === 'Checked Out') {
          continue;
        }

        // Check time overlap: (newStart < existingEnd) && (newEnd > existingStart)
        if (startTime < b.endTime && endTime > b.startTime) {
          return true; // Conflict found
        }
      }
      return false;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?conflictCheck`);
      return false;
    }
  },

  // Update full booking details
  async updateBooking(bookingId: string, updates: Partial<VisitorBooking>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, bookingId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${bookingId}`);
    }
  },

  // Delete booking document
  async deleteBooking(bookingId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, bookingId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${bookingId}`);
    }
  },

  // Get user's bookings
  async getUserBookings(residentId: string): Promise<VisitorBooking[]> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, where('residentId', '==', residentId));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        bookingId: doc.id,
        ...doc.data()
      } as VisitorBooking));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return items;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?residentId=${residentId}`);
      return [];
    }
  },

  // Realtime subscription for resident's bookings
  subscribeToUserBookings(residentId: string, callback: (bookings: VisitorBooking[]) => void) {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where('residentId', '==', residentId));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          bookingId: doc.id,
          ...doc.data()
        } as VisitorBooking));
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?residentId=${residentId}`);
      }
    );
  },

  // Get today's bookings for Security
  async getTodayBookings(): Promise<VisitorBooking[]> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, where('date', '==', todayStr));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        bookingId: doc.id,
        ...doc.data()
      } as VisitorBooking));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?today`);
      return [];
    }
  },

  // Realtime subscription for today's bookings
  subscribeToTodayBookings(callback: (bookings: VisitorBooking[]) => void) {
    const todayStr = new Date().toISOString().split('T')[0];
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where('date', '==', todayStr));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          bookingId: doc.id,
          ...doc.data()
        } as VisitorBooking));
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `${COLLECTION_NAME}?today`);
      }
    );
  },

  // Realtime subscription for all bookings (Admin/Security)
  subscribeToAllBookings(callback: (bookings: VisitorBooking[]) => void) {
    const colRef = collection(db, COLLECTION_NAME);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          bookingId: doc.id,
          ...doc.data()
        } as VisitorBooking));
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    );
  },

  // Update status (e.g., Approved, Checked In, Checked Out, Rejected, Cancelled)
  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    extra?: Partial<VisitorBooking> & { residentId?: string; guestName?: string }
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, bookingId);
      const updatedAt = new Date().toISOString();
      await updateDoc(docRef, {
        status,
        updatedAt,
        ...extra
      });

      // Send notification document automatically on status change
      if (extra?.residentId) {
        let notifTitle = `Booking Status: ${status}`;
        let notifMsg = `Your visitor booking ${bookingId.slice(-6)} status updated to ${status}.`;

        if (status === 'Approved') {
          notifTitle = 'Visitor Booking Approved';
          notifMsg = `Pass for guest ${extra.guestName || 'visitor'} has been approved.`;
        } else if (status === 'Rejected') {
          notifTitle = 'Visitor Booking Rejected';
          notifMsg = `Pass for guest ${extra.guestName || 'visitor'} has been rejected.`;
        } else if (status === 'Cancelled') {
          notifTitle = 'Visitor Booking Cancelled';
          notifMsg = `Pass for guest ${extra.guestName || 'visitor'} was cancelled.`;
        } else if (status === 'Checked In' || status === 'Checked-In') {
          notifTitle = 'Visitor Checked In';
          notifMsg = `Guest ${extra.guestName || 'visitor'} has checked in at the security gate.`;
        } else if (status === 'Checked Out' || status === 'Completed') {
          notifTitle = 'Visitor Checked Out';
          notifMsg = `Guest ${extra.guestName || 'visitor'} has exited the premises.`;
        }

        await notificationService.createNotification({
          userId: extra.residentId,
          title: notifTitle,
          message: notifMsg,
          type: 'Booking'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${bookingId}`);
    }
  }
};
