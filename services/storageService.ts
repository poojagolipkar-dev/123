import { Booking, BookingStatus, Car } from '../types';

const BOOKINGS_KEY = 'shree_crm_bookings';
const CARS_KEY = 'shree_crm_cars';
const DRAFT_KEY = 'shree_crm_current_draft';

// --- IndexedDB Helper ---
const DB_NAME = 'ShreeCRM_DB';
const DB_VERSION = 1;
const STORE_NAME = 'bookings';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const dbGet = async <T>(storeName: string, key: string): Promise<T | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

const dbGetAll = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

const dbPut = async <T>(storeName: string, value: T): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(value);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const dbDelete = async (storeName: string, key: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- In-Memory Cache for Synchronous Access ---
let cachedBookings: Booking[] = [];
let isInitialized = false;

export const initStorage = async () => {
  if (isInitialized) return;
  
  try {
    // Migrate from localStorage if exists
    const localData = localStorage.getItem(BOOKINGS_KEY);
    if (localData) {
      const bookings = JSON.parse(localData) as Booking[];
      for (const b of bookings) {
        await dbPut(STORE_NAME, b);
      }
      localStorage.removeItem(BOOKINGS_KEY);
      console.log("Migrated bookings to IndexedDB");
    }
    
    cachedBookings = await dbGetAll<Booking>(STORE_NAME);
    isInitialized = true;
  } catch (e) {
    console.error("Failed to initialize storage", e);
    // Fallback to empty if DB fails
    cachedBookings = [];
    isInitialized = true;
  }
};

// Helper to safely save to localStorage (for small data like cars/settings)
const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      console.error("LocalStorage Quota Exceeded for key:", key);
      // We don't alert here anymore as we moved large data to IndexedDB
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
  // Returns cached bookings for synchronous UI updates
  return cachedBookings;
};

export const saveBooking = async (booking: Booking) => {
  // Update cache
  const index = cachedBookings.findIndex(b => b.id === booking.id);
  if (index >= 0) {
    cachedBookings[index] = booking;
  } else {
    cachedBookings.push(booking);
  }
  
  // Persist to IndexedDB
  await dbPut(STORE_NAME, booking);
};

export const deleteBooking = async (id: string) => {
  // Update cache
  cachedBookings = cachedBookings.filter(b => b.id !== id);
  
  // Persist to IndexedDB
  await dbDelete(STORE_NAME, id);
};

export const generateNextBookingId = (): string => {
  const bookings = getBookings();
  const sequentialIds = bookings
    .map(b => parseInt(b.id, 10))
    .filter(id => !isNaN(id) && id < 1000000000000);

  const maxId = sequentialIds.length > 0 ? Math.max(...sequentialIds) : 0;
  const nextId = maxId + 1;
  return nextId.toString().padStart(2, '0');
};

// --- Drafts ---
// Drafts are small enough for localStorage, but we could move them too if needed
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