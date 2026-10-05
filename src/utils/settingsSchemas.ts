import { z } from 'zod';

export const generalSettingsSchema = z.object({
  societyName: z.string().min(2, 'Society name must be at least 2 characters'),
  societyAddress: z.string().min(5, 'Address must be at least 5 characters'),
  contactPhone: z.string().min(5, 'Valid contact phone number is required'),
  contactEmail: z.string().email('Invalid email address'),
  timezone: z.string().min(2, 'Timezone selection is required'),
  societyLogo: z.string().optional()
});

export const parkingRulesSchema = z.object({
  maxVehiclesPerResident: z.number().min(1, 'Minimum 1 vehicle per resident'),
  maxVisitorParkingSlots: z.number().min(0, 'Cannot be negative'),
  reservedParkingPercentage: z.number().min(0, 'Minimum 0%').max(100, 'Must be between 0% and 100%'),
  enableEVParking: z.boolean(),
  enableDisabledParking: z.boolean(),
  parkingTimings: z.string().min(2, 'Parking timing schedule is required'),
  totalSlots: z.number().min(1, 'Total slots must be at least 1'),
  finePerViolation: z.number().min(0, 'Fine amount cannot be negative')
});

export const visitorRulesSchema = z.object({
  visitorStartTime: z.string().min(1, 'Start time required'),
  visitorEndTime: z.string().min(1, 'End time required'),
  maxBookingHours: z.number().min(1, 'Must be at least 1 hour').max(72, 'Max 72 hours'),
  advanceBookingLimitDays: z.number().min(1, 'At least 1 day advance').max(90, 'Max 90 days'),
  allowWeekendVisitors: z.boolean(),
  autoExpireBooking: z.boolean(),
  visitorAutoApproval: z.boolean()
});

export const notificationSettingsSchema = z.object({
  notifyBookings: z.boolean(),
  notifyVisitors: z.boolean(),
  notifyViolations: z.boolean(),
  notifyParkingAlerts: z.boolean(),
  notifyAnnouncements: z.boolean(),
  notifyEmail: z.boolean()
});

export const securitySettingsSchema = z.object({
  requireEntryVerification: z.boolean(),
  requireExitVerification: z.boolean(),
  allowManualEntry: z.boolean(),
  allowManualExit: z.boolean(),
  enableOtpVerification: z.boolean(),
  securityGatePassRequired: z.boolean()
});

export const appearanceSettingsSchema = z.object({
  theme: z.enum(['Light', 'Dark', 'System']),
  primaryAccentColor: z.string().min(1, 'Color choice is required'),
  compactMode: z.boolean()
});

export const societyInfoSchema = z.object({
  totalTowers: z.number().min(1, 'At least 1 tower/wing required'),
  totalFlats: z.number().min(1, 'At least 1 flat required'),
  maintenanceStaffCount: z.number().min(0, 'Cannot be negative'),
  gateEntryPoints: z.number().min(1, 'At least 1 entry gate required'),
  emergencyContact: z.string().min(5, 'Emergency contact number required')
});

export type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;
export type ParkingRulesFormData = z.infer<typeof parkingRulesSchema>;
export type VisitorRulesFormData = z.infer<typeof visitorRulesSchema>;
export type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;
export type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;
export type AppearanceSettingsFormData = z.infer<typeof appearanceSettingsSchema>;
export type SocietyInfoFormData = z.infer<typeof societyInfoSchema>;
