import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { isFirebaseConfigured } from '../firebase/firebase';
import { parkingService } from '../services/parkingService';
import { useToast } from '../contexts/ToastContext';

export const FirebaseStatusBanner: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const { showToast } = useToast();

  const handleSeedInitialSlots = async () => {
    setIsInitializing(true);
    try {
      // Check if slots already exist
      const existing = await parkingService.getAllSlots();
      if (existing.length > 0) {
        showToast('info', 'Slots already exist', `Found ${existing.length} existing parking slots in Firestore.`);
        setIsInitializing(false);
        return;
      }

      // Populate initial 12 parking slots in Firestore
      const initialSlots = [
        { slotNumber: 'A-101', building: 'Tower A', floor: '1st Floor', type: 'Resident' as const, status: 'Available' as const },
        { slotNumber: 'A-102', building: 'Tower A', floor: '1st Floor', type: 'Resident' as const, status: 'Available' as const },
        { slotNumber: 'A-103', building: 'Tower A', floor: '1st Floor', type: 'Resident' as const, status: 'Available' as const },
        { slotNumber: 'A-EV1', building: 'Tower A', floor: '1st Floor', type: 'EV' as const, status: 'Available' as const },
        { slotNumber: 'V-01', building: 'Visitor Bay', floor: 'Ground Floor', type: 'Visitor' as const, status: 'Available' as const },
        { slotNumber: 'V-02', building: 'Visitor Bay', floor: 'Ground Floor', type: 'Visitor' as const, status: 'Available' as const },
        { slotNumber: 'V-03', building: 'Visitor Bay', floor: 'Ground Floor', type: 'Visitor' as const, status: 'Available' as const },
        { slotNumber: 'V-04', building: 'Visitor Bay', floor: 'Ground Floor', type: 'Visitor' as const, status: 'Available' as const },
        { slotNumber: 'B-201', building: 'Tower B', floor: '2nd Floor', type: 'Resident' as const, status: 'Available' as const },
        { slotNumber: 'B-202', building: 'Tower B', floor: '2nd Floor', type: 'Resident' as const, status: 'Available' as const },
        { slotNumber: 'B-EV2', building: 'Tower B', floor: '2nd Floor', type: 'EV' as const, status: 'Available' as const },
        { slotNumber: 'H-01', building: 'Main Gate', floor: 'Ground Floor', type: 'Handicapped' as const, status: 'Available' as const }
      ];

      for (const slot of initialSlots) {
        await parkingService.createSlot(slot);
      }

      showToast('success', 'Firestore Slots Initialized', 'Created 12 default parking slots in Firestore collection!');
    } catch (error: any) {
      showToast('error', 'Initialization Error', error.message || 'Failed to seed initial slots.');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="mb-6 p-4 rounded-2xl bg-slate-900 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start space-x-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-sm text-slate-100">Firebase Backend Status</h4>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              isFirebaseConfigured
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {isFirebaseConfigured ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Live Config Detected
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Using Standard SDK Setup
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            All forms and actions interact with Firestore collections in real-time.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 shrink-0">
        <button
          onClick={handleSeedInitialSlots}
          disabled={isInitializing}
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow hover:shadow-emerald-500/20 disabled:opacity-50"
        >
          {isInitializing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Layers className="w-3.5 h-3.5" />
          )}
          <span>Initialize Parking Slots</span>
        </button>
      </div>
    </div>
  );
};
