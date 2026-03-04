import React, { useState, useRef } from 'react';
import { Booking, BookingStatus, Car } from '../types';
import { Download, Search, Edit3, CheckCircle, Calendar, X, MapPin, Filter, CarFront, ChevronDown, User, Upload, FileText, Eye, MessageCircle, Trash2, FileEdit } from 'lucide-react';
import { saveBooking } from '../services/storageService';
import * as XLSX from 'xlsx';
import { generateInvoicePDF, viewInvoicePDF, sendInvoiceWhatsApp, generateBookingReportPDF } from '../services/invoiceService';

interface BookingListProps {
  bookings: Booking[];
  cars: Car[];
  filterStatus?: BookingStatus;
  onEdit: (booking: Booking) => void;
  onComplete: (booking: Booking) => void;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
}

const BookingList: React.FC<BookingListProps> = ({ bookings, cars, filterStatus, onEdit, onComplete, onDelete, onRefresh }) => {
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [selectedCarId, setSelectedCarId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBookings = React.useMemo(() => bookings.filter(b => {
    // Status Filter
    if (filterStatus && b.status !== filterStatus) return false;
    
    // Date Range Filter (based on Booking Start Date)
    if (dateRange.start && b.startDate < dateRange.start) return false;
    if (dateRange.end && b.startDate > dateRange.end) return false;
    
    // Car Filter
    if (selectedCarId && b.carId !== selectedCarId) return false;

    // Search Filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const car = cars.find(c => c.id === b.carId);
        const carText = car ? `${car.name} ${car.plateNumber}`.toLowerCase() : '';
        const clientName = (b.fullName || '').toLowerCase();
        const address = (b.address || '').toLowerCase();
        
        if (!clientName.includes(query) && !address.includes(query) && !carText.includes(query)) {
            return false;
        }
    }

    return true;
  }), [bookings, filterStatus, dateRange, selectedCarId, searchQuery, cars]);

  const getCarName = (id: string) => {
    const car = cars.find(c => c.id === id);
    return car ? `${car.name} (${car.plateNumber})` : 'Unknown Car';
  };

  const getTitle = () => {
    switch (filterStatus) {
        case BookingStatus.PRE_BOOKING: return 'Pre-Bookings';
        case BookingStatus.COMPLETED: return 'Completed';
        case BookingStatus.DRAFT: return 'Drafts';
        default: return 'All Bookings';
    }
  };

  const getCardStyle = (status: BookingStatus) => {
    switch (status) {
        case BookingStatus.ONGOING:
            return 'border-red-200 dark:border-red-900/50 border-l-[6px] border-l-red-500 bg-red-50/60 dark:bg-red-900/20 backdrop-blur-md';
        case BookingStatus.COMPLETED:
            return 'border-emerald-200 dark:border-emerald-900/50 border-l-[6px] border-l-emerald-500 bg-emerald-50/60 dark:bg-emerald-900/20 backdrop-blur-md';
        case BookingStatus.PRE_BOOKING:
            return 'border-blue-200 dark:border-blue-900/50 border-l-[6px] border-l-blue-500 bg-blue-50/60 dark:bg-blue-900/20 backdrop-blur-md';
        case BookingStatus.DRAFT:
            return 'border-amber-200 dark:border-amber-900/50 border-l-[6px] border-l-amber-400 bg-amber-50/60 dark:bg-amber-900/20 backdrop-blur-md';
        case BookingStatus.CANCELLED:
            return 'border-slate-200 dark:border-slate-800 border-l-[6px] border-l-slate-400 bg-slate-50/60 dark:bg-slate-900/40 backdrop-blur-md grayscale opacity-75';
        default:
            return 'border-black dark:border-crm-border bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md';
    }
  };

  const getBadgeStyle = (status: BookingStatus) => {
    switch (status) {
        case BookingStatus.ONGOING: return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
        case BookingStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
        case BookingStatus.PRE_BOOKING: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
        case BookingStatus.DRAFT: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
        default: return 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300';
    }
  };

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) return;
    
    const dataToExport = filteredBookings.map(b => {
        const car = cars.find(c => c.id === b.carId);
        return {
            'Booking ID': b.id,
            'Status': b.status,
            'Booking Created At': new Date(b.createdAt).toLocaleString(),
            // 1. Vehicle Details
            'Vehicle Name': car ? car.name : 'Unknown',
            'Plate Number': car ? car.plateNumber : 'Unknown',
            'Car ID': b.carId,
            // 2. Location & GPS
            'GPS Location': b.gpsLocation || '',
            'Address': b.address,
            // 3. Trip Duration
            'Start Date': b.startDate,
            'Start Time': b.startTime,
            'End Date': b.endDate,
            'End Time': b.endTime,
            'Total Days': b.totalDays,
            'Total Time': b.totalTime || '',
            // 4. Odometer (KM)
            'Checkout KM': b.checkoutKm,
            'Checkin KM': b.checkinKm,
            'Total KM': b.totalKmTravelled,
            // 5. Client Details
            'Full Name': b.fullName,
            'Mobile': b.mobile,
            'Email': b.email || '',
            // 6. Documents
            'Aadhar Card ID': b.aadharCardId || '',
            'PAN Card ID': b.panCardId || '',
            'Driving License ID': b.drivingLicenseId || '',
            'Light Bill ID': b.lightBillId || '',
            'Gas Bill ID': b.gasBillId || '',
            'Rent Agreement ID': b.rentAgreementId || '',
            'Passport ID': b.passportId || '',
            'Other Docs ID': b.otherDocsId || '',
            // 7. Residence Type
            'House Type': b.houseType || '',
            // 8. Payment Details
            'Fastag Recharge': b.fastagRecharge,
            'Fastag Amount': b.fastagRechargeAmount || 0,
            'Advance Payment': b.advancePayment,
            'Security Deposit': b.securityDeposit,
            'Gross Total': b.grossTotal,
            'Total Paid': b.totalPaid,
            'Net Balance': b.netBalance,
            // 9. Remarks
            'Remarks': b.remarks
        };
    });

    // Create header row
    const headers = Object.keys(dataToExport[0]).join(',');
    // Create rows
    const rows = dataToExport.map(row => 
      Object.values(row).map(val => `"${val}"`).join(',')
    ).join('\n');
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Add car name to filename if selected
    const carName = selectedCarId ? cars.find(c => c.id === selectedCarId)?.plateNumber.replace(/\s/g, '_') : 'all';
    link.setAttribute("download", `bookings_${carName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportXLSX = () => {
    if (filteredBookings.length === 0) return;
    
    try {
        const dataToExport = filteredBookings.map(b => {
            const car = cars.find(c => c.id === b.carId);
            return {
                'Booking ID': b.id,
                'Status': b.status,
                'Booking Created At': new Date(b.createdAt).toLocaleString(),
                // 1. Vehicle Details
                'Vehicle Name': car ? car.name : 'Unknown',
                'Plate Number': car ? car.plateNumber : 'Unknown',
                'Car ID': b.carId,
                // 2. Location & GPS
                'GPS Location': b.gpsLocation || '',
                'Address': b.address,
                // 3. Trip Duration
                'Start Date': b.startDate,
                'Start Time': b.startTime,
                'End Date': b.endDate,
                'End Time': b.endTime,
                'Total Days': b.totalDays,
                'Total Time': b.totalTime || '',
                // 4. Odometer (KM)
                'Checkout KM': b.checkoutKm,
                'Checkin KM': b.checkinKm,
                'Total KM': b.totalKmTravelled,
                // 5. Client Details
                'Full Name': b.fullName,
                'Mobile': b.mobile,
                'Email': b.email || '',
                // 6. Documents
                'Aadhar Card ID': b.aadharCardId || '',
                'PAN Card ID': b.panCardId || '',
                'Driving License ID': b.drivingLicenseId || '',
                'Light Bill ID': b.lightBillId || '',
                'Gas Bill ID': b.gasBillId || '',
                'Rent Agreement ID': b.rentAgreementId || '',
                'Passport ID': b.passportId || '',
                'Other Docs ID': b.otherDocsId || '',
                // 7. Residence Type
                'House Type': b.houseType || '',
                // 8. Payment Details
                'Fastag Recharge': b.fastagRecharge,
                'Fastag Amount': b.fastagRechargeAmount || 0,
                'Advance Payment': b.advancePayment,
                'Security Deposit': b.securityDeposit,
                'Gross Total': b.grossTotal,
                'Total Paid': b.totalPaid,
                'Net Balance': b.netBalance,
                // 9. Remarks
                'Remarks': b.remarks
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
        
        const moduleName = filterStatus ? filterStatus.toLowerCase().replace(/\s+/g, '_') : 'all_bookings';
        const fileName = `${moduleName}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        XLSX.writeFile(workbook, fileName);
    } catch (error) {
        console.error("XLSX Export Error:", error);
        alert("Failed to export XLSX. Please try again.");
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      try {
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            alert("File appears to be empty or invalid.");
            return;
        }

        let importedCount = 0;
        jsonData.forEach((row: any) => {
            const booking: any = {};
            
            // Map keys and handle numeric conversions
            Object.keys(row).forEach(key => {
                let value = row[key];
                
                // Convert numeric fields
                if (['currentKm', 'lastServiceKm', 'checkoutKm', 'checkinKm', 'totalKmTravelled', 'fastagRechargeAmount', 'advancePayment', 'securityDeposit', 'grossTotal', 'totalPaid', 'netBalance', 'totalDays', 'createdAt', 'updatedAt'].includes(key)) {
                    value = Number(value);
                    if (isNaN(value)) value = 0;
                }
                
                booking[key] = value;
            });

            if (booking.id) {
                saveBooking(booking as Booking);
                importedCount++;
            }
        });

        alert(`Successfully imported ${importedCount} bookings from ${file.name}.`);
        if (onRefresh) onRefresh();
        
      } catch (err) {
        console.error("Import error", err);
        alert("Failed to parse file. Please ensure it is a valid CSV or Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="pb-20 space-y-4 p-5">
      
      {/* Prominent Search Bar */}
      <div className="relative animate-enter">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search size={18} />
        </div>
        <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, car, or address..."
            className="w-full pl-11 pr-10 py-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-black dark:border-crm-border rounded-2xl shadow-sm text-sm outline-none focus:border-blue-500 transition-all text-slate-700 dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
        />
        {searchQuery && (
            <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors active:scale-95"
            >
                <X size={16} />
            </button>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-black dark:border-crm-border animate-enter transition-colors delay-75">
        <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-blue-600 dark:text-blue-400"/>
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wide">Filters</span>
            {(dateRange.start || dateRange.end || selectedCarId) && (
                <button 
                    onClick={() => {
                        setDateRange({start: '', end: ''});
                        setSelectedCarId('');
                    }}
                    className="ml-auto text-[10px] text-red-500 dark:text-red-400 flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded transition-colors font-bold animate-scale-in"
                >
                    <X size={12} /> Clear
                </button>
            )}
        </div>
        
        <div className="space-y-3">
            {/* Car Selector */}
             <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <CarFront size={14} />
                </div>
                <select
                    value={selectedCarId}
                    onChange={(e) => setSelectedCarId(e.target.value)}
                    className="w-full pl-9 pr-8 p-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors text-slate-600 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                >
                    <option value="">All Vehicles</option>
                    {cars.map(car => (
                        <option key={car.id} value={car.id}>
                            {car.name.length > 20 ? car.name.substring(0, 20) + '...' : car.name} ({car.plateNumber})
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                     <ChevronDown size={14} />
                </div>
            </div>

            {/* Date Range */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                        className="w-full p-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors text-slate-600 dark:text-white font-medium focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                        placeholder="Start Date"
                    />
                </div>
                <div className="flex-1">
                    <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                        className="w-full p-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors text-slate-600 dark:text-white font-medium focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                        placeholder="End Date"
                    />
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 px-1 animate-enter delay-100 gap-3">
        <h2 className="text-2xl font-bold text-white tracking-tight animate-slide-in">
          {getTitle()}
        </h2>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportData} 
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                    className="hidden" 
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800/50 shadow-sm active:scale-95 transition-transform hover:bg-blue-50 dark:hover:bg-blue-900/20 whitespace-nowrap"
                >
                    <Upload size={14} /> Import Data
                </button>
            </>
            <button 
                onClick={handleExportCSV}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-200 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-neutral-800 shadow-sm active:scale-95 transition-transform hover:bg-slate-50 dark:hover:bg-neutral-800 whitespace-nowrap"
            >
                <Download size={14} /> Export CSV
            </button>
            <button 
                onClick={() => {
                    if (filteredBookings.length === 0) return;
                    // Pass all filtered bookings and the full cars list to the generator
                    generateBookingReportPDF(filteredBookings, cars);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-red-200 dark:shadow-none active:scale-95 transition-transform hover:bg-red-700 whitespace-nowrap"
            >
                <FileText size={14} /> Export PDF
            </button>
            <button 
                onClick={handleExportXLSX}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-transform hover:bg-blue-700 whitespace-nowrap"
            >
                <Download size={14} /> Export XLSX
            </button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-20 animate-enter delay-150">
          <div className="bg-slate-100 dark:bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-neutral-500 transition-colors">
            <Search size={24} />
          </div>
          <p className="text-slate-400 font-medium">No bookings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBookings.map((booking, index) => (
            <div 
                key={booking.id} 
                style={{ animationDelay: `${index * 100}ms` }}
                className={`p-5 rounded-3xl shadow-md border flex flex-col gap-4 relative overflow-hidden group hover:shadow-xl transition-all duration-300 animate-slide-in ${getCardStyle(booking.status)}`}
            >
              
              {/* Status Badge */}
              <div className="flex justify-between items-start">
                <div className="flex gap-3 items-center flex-1">
                   {/* Avatar */}
                   <div className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-black/20 overflow-hidden shrink-0 border-2 border-[#D6F527] shadow-sm">
                      {booking.clientPhoto ? (
                          <img 
                            src={booking.clientPhoto} 
                            alt={booking.fullName} 
                            className="w-full h-full object-cover" 
                            loading="lazy"
                            decoding="async"
                          />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-neutral-500">
                             <User size={20} />
                          </div>
                      )}
                   </div>
                   
                   <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{booking.fullName}</h3>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium mt-1 flex items-center gap-1 truncate">
                            <MapPin size={12} /> {booking.address || 'No Address'}
                        </p>
                   </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ml-2 shadow-sm ${getBadgeStyle(booking.status)}`}>
                    {booking.status}
                </div>
              </div>

              {/* Car Info */}
              <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-black/5 dark:border-white/5 group-hover:border-blue-200 dark:group-hover:border-blue-900 transition-colors">
                <p className="text-xs font-bold text-slate-700 dark:text-neutral-200">{getCarName(booking.carId)}</p>
              </div>

                {/* Grid Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl text-center border border-black/5 dark:border-white/5 relative">
                    <Calendar size={12} className="absolute top-2 left-2 text-slate-400 dark:text-neutral-600" />
                    <span className="text-[10px] text-slate-500 dark:text-neutral-400 block uppercase font-bold mb-1">Start Date</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{booking.startDate}</span>
                </div>
                <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl text-center border border-black/5 dark:border-white/5 relative">
                    <Calendar size={12} className="absolute top-2 left-2 text-slate-400 dark:text-neutral-600" />
                    <span className="text-[10px] text-slate-500 dark:text-neutral-400 block uppercase font-bold mb-1">End Date</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{booking.endDate}</span>
                </div>

                {/* KM Details Added */}
                <div className="col-span-2 bg-white/40 dark:bg-black/20 p-3 rounded-xl flex justify-between items-center border border-black/5 dark:border-white/5">
                     <div>
                        <span className="text-[10px] text-slate-500 dark:text-neutral-400 block uppercase font-bold flex items-center gap-1">
                            <MapPin size={10} /> Total Distance
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white">{booking.totalKmTravelled} km</span>
                     </div>
                     <div className="text-right">
                        <span className="text-[10px] text-slate-500 dark:text-neutral-400 block uppercase font-bold">Trip Log</span>
                        <span className="text-xs font-mono text-slate-700 dark:text-neutral-300">{booking.checkoutKm} <span className="text-slate-400">→</span> {booking.checkinKm}</span>
                     </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center pt-3 border-t border-black/5 dark:border-white/5 mt-1 gap-2">
                 <div className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 shrink-0">
                    REF: {booking.id.slice(-8).toUpperCase()}
                 </div>
                 <div className="flex flex-wrap gap-2 justify-end">
                    {booking.status === BookingStatus.COMPLETED ? (
                        <>
                            <button 
                                onClick={() => onEdit(booking)}
                                className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-500 hover:text-white transition-all hover:scale-110 shadow-sm border border-blue-200/50 flex items-center justify-center"
                                title="Edit Booking"
                            >
                                <FileEdit size={18} />
                            </button>
                            <button 
                                onClick={() => {
                                    const car = cars.find(c => c.id === booking.carId);
                                    if (car) viewInvoicePDF(booking, car);
                                }}
                                className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-500 hover:text-white transition-all hover:scale-110 shadow-sm border border-purple-200/50 flex items-center justify-center"
                                title="View Invoice"
                            >
                                <Eye size={18} />
                            </button>
                            <button 
                                onClick={() => {
                                    const car = cars.find(c => c.id === booking.carId);
                                    if (car) sendInvoiceWhatsApp(booking, car);
                                }}
                                className="p-2.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-500 hover:text-white transition-all hover:scale-110 shadow-sm border border-green-200/50 flex items-center justify-center"
                                title="Send via WhatsApp"
                            >
                                <MessageCircle size={18} />
                            </button>

                            <button 
                                onClick={() => {
                                    const car = cars.find(c => c.id === booking.carId);
                                    if (car) generateInvoicePDF(booking, car);
                                }}
                                className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-500 hover:text-white transition-all hover:scale-110 shadow-sm border border-blue-200/50 flex items-center justify-center"
                                title="Download Invoice"
                            >
                                <FileText size={18} />
                            </button>
                            {onDelete && (
                                <button 
                                    onClick={() => onDelete(booking.id)} 
                                    className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all hover:scale-110 shadow-sm border border-red-200/50 flex items-center justify-center"
                                    title="Delete Booking"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                             <button onClick={() => onEdit(booking)} className="p-2.5 bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 rounded-full hover:bg-slate-50 dark:hover:bg-neutral-700 hover:shadow hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:scale-110 shadow-sm border border-black/5">
                                <Edit3 size={18} />
                            </button>
                            <button 
                                onClick={() => {
                                    const car = cars.find(c => c.id === booking.carId);
                                    if (car) generateInvoicePDF(booking, car);
                                }}
                                className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-500 hover:text-white transition-all hover:scale-110 shadow-sm border border-blue-200/50 flex items-center justify-center"
                                title="Download Invoice"
                            >
                                <FileText size={18} />
                            </button>
                            <button onClick={() => onComplete(booking)} className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-200 dark:hover:shadow-none transition-all hover:scale-110 shadow-sm border border-emerald-200/50">
                                <CheckCircle size={18} />
                            </button>
                            {onDelete && (
                                <button 
                                    onClick={() => onDelete(booking.id)} 
                                    className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all hover:scale-110 shadow-sm border border-red-200/50 flex items-center justify-center"
                                    title="Delete Booking"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </>
                    )}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingList;