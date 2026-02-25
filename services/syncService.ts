
import { Booking, Car } from '../types';
import { getBookings, getCars, saveBooking, saveCar } from './storageService';

const SYNC_SETTINGS_KEY = 'shree_crm_sync_settings';

export interface SyncSettings {
  enabled: boolean;
  scriptUrl: string;
  lastSynced?: string;
  autoSyncInterval: number; // in minutes
}

export const getSyncSettings = (): SyncSettings => {
  const stored = localStorage.getItem(SYNC_SETTINGS_KEY);
  return stored ? JSON.parse(stored) : { 
    enabled: false, 
    scriptUrl: '', 
    autoSyncInterval: 60 
  };
};

export const saveSyncSettings = (settings: SyncSettings) => {
  localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
};

export const performSync = async (): Promise<{ success: boolean; message: string }> => {
  const settings = getSyncSettings();
  if (!settings.scriptUrl) {
    return { success: false, message: 'No Google Script URL configured' };
  }

  try {
    const bookings = getBookings();
    const cars = getCars();

    const payload = {
      timestamp: new Date().toISOString(),
      bookings,
      cars
    };

    // Send data to Google Sheet via App Script
    // Using no-cors mode is required for Google Apps Script Web Apps when calling from client-side
    // without a proxy, as they don't support CORS preflight for POST requests consistently.
    // Note: This results in an opaque response (status 0), so we can't read the return value.
    await fetch(settings.scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload)
    });

    // Update last synced time (Assume success if fetch didn't throw)
    const updatedSettings = {
        ...settings,
        lastSynced: new Date().toLocaleString()
    };
    saveSyncSettings(updatedSettings);

    return { success: true, message: 'Data synced successfully (Background)' };
  } catch (error: any) {
    console.error('Sync failed:', error);
    return { success: false, message: `Sync failed: ${error.message}. Ensure Script is deployed as "Anyone".` };
  }
};

export const restoreFromGoogleSheet = async (): Promise<{ success: boolean; message: string; data?: any }> => {
  const settings = getSyncSettings();
  if (!settings.scriptUrl) {
    return { success: false, message: 'No Google Script URL configured' };
  }

  try {
    const response = await fetch(settings.scriptUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    
    if (data.bookings) {
        data.bookings.forEach((b: Booking) => saveBooking(b));
    }
    if (data.cars) {
        data.cars.forEach((c: Car) => saveCar(c));
    }

    return { success: true, message: 'Data restored successfully', data };
  } catch (error: any) {
    console.error('Restore failed:', error);
    return { success: false, message: `Restore failed: ${error.message}` };
  }
};
