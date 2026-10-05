import {
  ParkingSlot,
  Vehicle,
  VisitorBooking,
  VisitorLog,
  Violation,
  UserProfile,
  NotificationItem
} from '../types';

export interface AnalyticsExportData {
  stats: Record<string, number | string>;
  parkingSlots: ParkingSlot[];
  vehicles: Vehicle[];
  visitorBookings: VisitorBooking[];
  visitorLogs: VisitorLog[];
  violations: Violation[];
  users: UserProfile[];
  notifications: NotificationItem[];
}

/**
 * Generates and downloads a clean, structured CSV report file from analytics data.
 */
export const exportAnalyticsToCSV = (data: AnalyticsExportData, timeRangeLabel: string) => {
  const dateStr = new Date().toISOString().split('T')[0];
  let csvContent = `PARKWISE SOCIETY PARKING & VISITOR ANALYTICS REPORT\n`;
  csvContent += `Generated On: ${new Date().toLocaleString()}\n`;
  csvContent += `Time Range Filter: ${timeRangeLabel}\n\n`;

  // Section 1: Overview Statistics
  csvContent += `--- OVERVIEW STATISTICS ---\n`;
  csvContent += `Metric,Value\n`;
  Object.entries(data.stats).forEach(([key, val]) => {
    csvContent += `"${key.replace(/"/g, '""')}","${val}"\n`;
  });
  csvContent += `\n`;

  // Section 2: Parking Slot Breakdown
  csvContent += `--- PARKING SLOTS BREAKDOWN ---\n`;
  csvContent += `Slot Number,Building,Floor,Type,Status,Assigned Resident\n`;
  data.parkingSlots.forEach((slot) => {
    csvContent += `"${slot.slotNumber}","${slot.building || ''}","${slot.floor || ''}","${slot.type}","${
      slot.status
    }","${slot.assignedResidentName || 'Unassigned'}"\n`;
  });
  csvContent += `\n`;

  // Section 3: Registered Vehicles
  csvContent += `--- REGISTERED VEHICLES ---\n`;
  csvContent += `Vehicle Plate,Type,Make & Model,Color,Owner ID\n`;
  data.vehicles.forEach((veh) => {
    csvContent += `"${veh.vehicleNumber}","${veh.vehicleType}","${veh.make || ''} ${veh.model || ''}","${
      veh.color || ''
    }","${veh.ownerId}"\n`;
  });
  csvContent += `\n`;

  // Section 4: Recent Visitor Bookings
  csvContent += `--- VISITOR BOOKINGS ---\n`;
  csvContent += `Booking ID,Guest Name,Vehicle Plate,Type,Date,Start Time,End Time,Status,Resident ID\n`;
  data.visitorBookings.forEach((b) => {
    csvContent += `"${b.bookingId}","${b.guestName}","${b.vehicleNumber}","${b.vehicleType}","${b.date}","${
      b.startTime
    }","${b.endTime}","${b.status}","${b.residentId}"\n`;
  });
  csvContent += `\n`;

  // Section 5: Visitor Entry/Exit Logs
  csvContent += `--- VISITOR LOGS ---\n`;
  csvContent += `Log ID,Guest Name,Vehicle Plate,Entry Time,Exit Time,Status,Security Staff\n`;
  data.visitorLogs.forEach((l) => {
    csvContent += `"${l.logId}","${l.guestName}","${l.vehicleNumber}","${l.entryTime}","${
      l.exitTime || 'Active In Premises'
    }","${l.status}","${l.securityName || l.securityId || ''}"\n`;
  });
  csvContent += `\n`;

  // Section 6: Security Violations
  csvContent += `--- SECURITY VIOLATIONS ---\n`;
  csvContent += `Violation ID,Vehicle Plate,Resident,Slot/Location,Severity,Status,Description,Reported Date\n`;
  data.violations.forEach((v) => {
    csvContent += `"${v.violationId}","${v.vehicleNumber}","${v.residentName || 'Unknown'}","${
      v.slotNumber || 'General Area'
    }","${v.severity}","${v.status}","${(v.description || '').replace(/"/g, '""')}","${v.createdAt}"\n`;
  });

  // Create download blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ParkWise_Analytics_Report_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Triggers standard print dialog for generating PDF report.
 */
export const printAnalyticsReport = () => {
  window.print();
};
