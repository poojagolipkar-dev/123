
export enum BookingStatus {
  DRAFT = 'Draft',
  PRE_BOOKING = 'Pre-Booking',
  ONGOING = 'Ongoing',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface Car {
  id: string;
  name: string;
  model: string;
  plateNumber: string;
  imageUrl?: string;
  currentKm: number;
  lastServiceKm: number;
  serviceInterval: number; // usually 10000
  documents: string[]; // URLs or base64
  status: 'Available' | 'Rented' | 'Maintenance';
}

export interface Booking {
  id: string;
  status: BookingStatus;
  createdAt: number;
  updatedAt: number;

  // Car Details
  carId: string;
  
  // Trip Details
  gpsLocation?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalDays: number;
  totalTime: string;
  
  // KM Tracking
  checkoutKm: number;
  checkinKm: number;
  totalKmTravelled: number;

  // Client Details
  clientPhoto?: string;
  fullName: string;
  mobile: string;
  email?: string;
  address: string;
  houseType?: string;

  // Documents IDs
  aadharCardId?: string;
  panCardId?: string;
  drivingLicenseId?: string;
  lightBillId?: string;
  gasBillId?: string;
  rentAgreementId?: string;
  passportId?: string;
  otherDocsId?: string;

  // Documents Files (Base64)
  aadharCard?: string[];
  panCard?: string[];
  drivingLicense?: string[];
  lightBill?: string[];
  gasBill?: string[];
  rentAgreement?: string[];
  passport?: string[];
  otherDocs?: string[];

  // Payment
  fastagRecharge: 'Client' | 'Self';
  fastagRechargeAmount?: number;
  advancePayment: number;
  securityDeposit: number;
  grossTotal: number;
  totalPaid: number;
  netBalance: number;
  
  remarks: string;
}

export type ViewState = 'dashboard' | 'new_booking' | 'draft' | 'pre_booking' | 'complete' | 'all_bookings';