import { Booking, BookingStatus, Car } from '../types';

const BOOKINGS_KEY = 'shree_crm_bookings';
const CARS_KEY = 'shree_crm_cars';
const DRAFT_KEY = 'shree_crm_current_draft';

// Helper to safely save to localStorage
const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      alert("Storage Full! Unable to save. Please delete old bookings or use lower resolution images.");
      console.error("LocalStorage Quota Exceeded");
    } else {
      console.error("Error saving to storage", e);
    }
  }
};

// --- Cars ---
export const getCars = (): Car[] => {
  try {
    const data = localStorage.getItem(CARS_KEY);
    if (!data) {
      // Seed initial data
      const initialCars: Car[] = [
        {
          id: '1',
          name: 'WagonR (Petrol/CNG)',
          model: '2025',
          plateNumber: 'MH-06-CL-7364',
          currentKm: 0,
          lastServiceKm: 0,
          serviceInterval: 10000,
          documents: [],
          status: 'Available'
        }
      ];
      safeSetItem(CARS_KEY, JSON.stringify(initialCars));
      return initialCars;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error("Error parsing cars data", e);
    return [];
  }
};

export const resetAllOdometers = () => {
  const cars = getCars();
  const updatedCars = cars.map(car => ({
    ...car,
    currentKm: 0,
    lastServiceKm: 0
  }));
  safeSetItem(CARS_KEY, JSON.stringify(updatedCars));
  return updatedCars;
};

export const saveCar = (car: Car) => {
  const cars = getCars();
  const index = cars.findIndex(c => c.id === car.id);
  if (index >= 0) {
    cars[index] = car;
  } else {
    cars.push(car);
  }
  safeSetItem(CARS_KEY, JSON.stringify(cars));
};

export const deleteCar = (id: string) => {
  const cars = getCars().filter(c => c.id !== id);
  safeSetItem(CARS_KEY, JSON.stringify(cars));
};

// --- Bookings ---
export const getBookings = (): Booking[] => {
  try {
    const data = localStorage.getItem(BOOKINGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error parsing bookings data", e);
    return [];
  }
};

export const saveBooking = (booking: Booking) => {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === booking.id);
  if (index >= 0) {
    bookings[index] = booking;
  } else {
    bookings.push(booking);
  }
  safeSetItem(BOOKINGS_KEY, JSON.stringify(bookings));
};

export const deleteBooking = (id: string) => {
  const bookings = getBookings().filter(b => b.id !== id);
  safeSetItem(BOOKINGS_KEY, JSON.stringify(bookings));
};

export const generateNextBookingId = (): string => {
  const bookings = getBookings();
  // Filter out timestamp-based IDs (which are large numbers > 1 trillion)
  // We want to find the max of sequential IDs (e.g. 1, 2, 3...)
  const sequentialIds = bookings
    .map(b => parseInt(b.id, 10))
    .filter(id => !isNaN(id) && id < 1000000000000);

  const maxId = sequentialIds.length > 0 ? Math.max(...sequentialIds) : 0;
  const nextId = maxId + 1;
  return nextId.toString().padStart(2, '0');
};

// --- Drafts ---
export const saveDraft = (booking: Partial<Booking>) => {
  safeSetItem(DRAFT_KEY, JSON.stringify(booking));
};

export const getDraft = (): Partial<Booking> | null => {
  try {
    const data = localStorage.getItem(DRAFT_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const clearDraft = () => {
  localStorage.removeItem(DRAFT_KEY);
};