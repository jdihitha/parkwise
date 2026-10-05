import { parkingService } from './parkingService';
import { bookingService } from './bookingService';
import { visitorLogService } from './visitorLogService';
import { violationService } from './violationService';
import { userService } from './userService';

export interface AnalyticsSummary {
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  reservedSlots: number;
  maintenanceSlots: number;
  occupancyRate: number;
  totalUsers: number;
  totalResidents: number;
  totalSecurity: number;
  activeVisitors: number;
  todayBookings: number;
  totalViolations: number;
  openViolations: number;
}

export const analyticsService = {
  // Aggregate live metrics from Firestore
  async getLiveMetrics(): Promise<AnalyticsSummary> {
    const [slots, users, visitorLogs, todayBookings, violations] = await Promise.all([
      parkingService.getAllSlots(),
      userService.getAllUsers(),
      visitorLogService.getAllLogs(),
      bookingService.getTodayBookings(),
      new Promise<any[]>(resolve => {
        const unsub = violationService.subscribeToAllViolations(data => {
          unsub();
          resolve(data);
        });
      })
    ]);

    const totalSlots = slots.length || 1;
    const occupiedSlots = slots.filter(s => s.status === 'Occupied').length;
    const availableSlots = slots.filter(s => s.status === 'Available').length;
    const reservedSlots = slots.filter(s => s.status === 'Reserved').length;
    const maintenanceSlots = slots.filter(s => s.status === 'Maintenance').length;
    const occupancyRate = Math.round((occupiedSlots / totalSlots) * 100);

    const activeVisitors = visitorLogs.filter(l => l.status === 'Active').length;
    const totalResidents = users.filter(u => u.role === 'Resident').length;
    const totalSecurity = users.filter(u => u.role === 'Security').length;

    const openViolations = violations.filter(v => v.status === 'Open' || v.status === 'Under Review').length;

    return {
      totalSlots,
      occupiedSlots,
      availableSlots,
      reservedSlots,
      maintenanceSlots,
      occupancyRate,
      totalUsers: users.length,
      totalResidents,
      totalSecurity,
      activeVisitors,
      todayBookings: todayBookings.length,
      totalViolations: violations.length,
      openViolations
    };
  }
};
