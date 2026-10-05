export type UserRole = 'Resident' | 'Security' | 'Admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  flatNumber: string;
  phone: string;
  profilePhoto?: string;
  createdAt: string;
}

export type SlotType = 'Resident' | 'Visitor' | 'EV' | 'EV Charging' | 'Handicapped' | 'Accessible';
export type SlotStatus = 'Available' | 'Occupied' | 'Reserved' | 'Maintenance';

export interface ParkingSlot {
  slotId: string;
  slotNumber: string;
  building: string;
  floor: string;
  type: SlotType;
  assignedResident?: string | null;
  assignedResidentName?: string | null;
  status: SlotStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type VehicleType = 'Car' | 'Bike' | 'SUV' | 'EV' | 'Truck' | 'Other';

export interface Vehicle {
  vehicleId: string;
  ownerId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BookingStatus = 'Pending' | 'Approved' | 'Checked In' | 'Checked Out' | 'Checked-In' | 'Completed' | 'Cancelled' | 'Rejected';

export interface VisitorBooking {
  bookingId: string;
  residentId: string;
  residentName?: string;
  flatNumber?: string;
  guestName: string;
  guestPhone?: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  date: string;
  startTime: string;
  endTime: string;
  slotId?: string;
  slotNumber?: string;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type LogStatus = 'Active' | 'Completed' | 'Checked In' | 'Checked Out';

export interface VisitorLog {
  logId: string;
  bookingId: string;
  residentId?: string;
  residentName?: string;
  entryTime: string;
  exitTime?: string | null;
  securityId: string;
  securityName?: string;
  status: LogStatus;
  guestName: string;
  vehicleNumber: string;
  flatNumber: string;
  slotId?: string;
  slotNumber?: string;
  notes?: string;
}

export type ViolationSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type ViolationStatus = 'Pending' | 'In Review' | 'Resolved' | 'Rejected' | 'Open' | 'Under Review' | 'Fined';

export interface Violation {
  violationId: string;
  residentId?: string;
  residentName?: string;
  slotId?: string;
  slotNumber?: string;
  vehicleNumber: string;
  violationType?: string;
  description: string;
  severity: ViolationSeverity;
  status: ViolationStatus;
  reportedBy?: string;
  reportedByName?: string;
  fineAmount?: number;
  createdAt: string;
  updatedAt?: string;
}

export type NotificationType = 'Booking' | 'Parking' | 'Violation' | 'Security' | 'Announcement' | 'System';

export interface NotificationItem {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface SystemSettings {
  id?: string;
  // 1. General
  societyName: string;
  societyAddress: string;
  contactPhone: string;
  contactEmail: string;
  timezone: string;
  societyLogo?: string;

  // 2. Parking Rules
  maxVehiclesPerResident: number;
  maxVisitorParkingSlots: number;
  reservedParkingPercentage: number;
  enableEVParking: boolean;
  enableDisabledParking: boolean;
  parkingTimings: string;
  totalSlots: number;
  finePerViolation: number;

  // 3. Visitor Rules
  visitorStartTime: string;
  visitorEndTime: string;
  maxBookingHours: number;
  advanceBookingLimitDays: number;
  allowWeekendVisitors: boolean;
  autoExpireBooking: boolean;
  visitorAutoApproval: boolean;

  // 4. Notification Settings
  notifyBookings: boolean;
  notifyVisitors: boolean;
  notifyViolations: boolean;
  notifyParkingAlerts: boolean;
  notifyAnnouncements: boolean;
  notifyEmail: boolean;

  // 5. Security Settings
  requireEntryVerification: boolean;
  requireExitVerification: boolean;
  allowManualEntry: boolean;
  allowManualExit: boolean;
  enableOtpVerification: boolean;
  securityGatePassRequired: boolean;

  // 6. Appearance
  theme: 'Light' | 'Dark' | 'System';
  primaryAccentColor: string;
  compactMode: boolean;

  // 7. Society Information
  totalTowers: number;
  totalFlats: number;
  maintenanceStaffCount: number;
  gateEntryPoints: number;
  emergencyContact: string;
  updatedAt?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
