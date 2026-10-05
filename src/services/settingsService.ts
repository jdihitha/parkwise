import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase/firebase';
import { SystemSettings, OperationType } from '../types';

const COLLECTION_NAME = 'settings';
const DOC_ID = 'global_settings';

export const DEFAULT_SETTINGS: SystemSettings = {
  // 1. General
  societyName: 'ParkWise Grand Residency',
  societyAddress: '42 Palm Avenue, Block B, Silicon Hills, CA 94016',
  contactPhone: '+1 (555) 019-2831',
  contactEmail: 'support@parkwise.io',
  timezone: 'America/Los_Angeles (PST)',
  societyLogo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=80',

  // 2. Parking Rules
  maxVehiclesPerResident: 2,
  maxVisitorParkingSlots: 25,
  reservedParkingPercentage: 15,
  enableEVParking: true,
  enableDisabledParking: true,
  parkingTimings: '24/7 (00:00 - 23:59)',
  totalSlots: 120,
  finePerViolation: 50,

  // 3. Visitor Rules
  visitorStartTime: '06:00',
  visitorEndTime: '23:00',
  maxBookingHours: 12,
  advanceBookingLimitDays: 7,
  allowWeekendVisitors: true,
  autoExpireBooking: true,
  visitorAutoApproval: true,

  // 4. Notification Settings
  notifyBookings: true,
  notifyVisitors: true,
  notifyViolations: true,
  notifyParkingAlerts: true,
  notifyAnnouncements: true,
  notifyEmail: false,

  // 5. Security Settings
  requireEntryVerification: true,
  requireExitVerification: true,
  allowManualEntry: true,
  allowManualExit: true,
  enableOtpVerification: false,
  securityGatePassRequired: true,

  // 6. Appearance
  theme: 'System',
  primaryAccentColor: '#a855f7',
  compactMode: false,

  // 7. Society Information
  totalTowers: 6,
  totalFlats: 180,
  maintenanceStaffCount: 12,
  gateEntryPoints: 3,
  emergencyContact: '+1 (555) 911-0000'
};

export const settingsService = {
  // Get global settings
  async getSettings(): Promise<SystemSettings> {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOC_ID);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { ...DEFAULT_SETTINGS, ...snapshot.data() } as SystemSettings;
      } else {
        // Initialize if empty
        await setDoc(docRef, DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${DOC_ID}`);
      return DEFAULT_SETTINGS;
    }
  },

  // Realtime subscription for settings
  subscribeToSettings(callback: (settings: SystemSettings) => void) {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback({ ...DEFAULT_SETTINGS, ...snapshot.data() } as SystemSettings);
        } else {
          // Initialize defaults
          setDoc(docRef, DEFAULT_SETTINGS).catch(console.error);
          callback(DEFAULT_SETTINGS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${DOC_ID}`);
      }
    );
  },

  // Update settings
  async updateSettings(updates: Partial<SystemSettings>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOC_ID);
      await setDoc(docRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${DOC_ID}`);
      throw error;
    }
  }
};
