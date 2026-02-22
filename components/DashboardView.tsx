import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Car, Booking, BookingStatus } from '../types';
import { Plus, Folder, AlertTriangle, CheckCircle, Car as CarIcon, TrendingUp, Edit, Trash2, Wallet, Activity, CalendarClock, ArrowUpRight, Zap, Filter, IndianRupee, Moon, Sun, Upload, X, FileText, User, Settings, LogOut, Key, Shield, Eye, EyeOff } from 'lucide-react';
import { logout, updateCredentials, getCredentials } from '../services/authService';
import { resetAllOdometers } from '../services/storageService';

interface DashboardProps {
  cars: Car[];
  bookings: Booking[];
  darkMode: boolean;
  toggleTheme: () => void;
  onAddCar: (car: Car) => void;
  onUpdateCar: (car: Car) => void;
  onDeleteCar: (id: string) => void;
  onLogout: () => void;
}

const DashboardView: React.FC<DashboardProps> = ({ cars, bookings, darkMode, toggleTheme, onAddCar, onUpdateCar, onDeleteCar, onLogout }) => {
  const [revenueType, setRevenueType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [revenueCarId, setRevenueCarId] = useState<string>('');
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [settingsMsg, setSettingsMsg] = useState('');

  const [showCarModal, setShowCarModal] = useState(false);
  const [newCar, setNewCar] = useState<Partial<Car>>({
    id: undefined,
    name: '',
    plateNumber: '',
    currentKm: 0,
    lastServiceKm: 0,
    serviceInterval: 10000,
    status: 'Available',
    imageUrl: undefined,
    documents: []
  });

  // Load creds when modal opens
  const openSettings = () => {
      const creds = getCredentials();
      setTempUsername(creds.username);
      setTempPassword(creds.password);
      setShowSettings(true);
      setShowPassword(false); // Reset to hidden
      setSettingsMsg('');
  };

  const handleSaveSettings = () => {
      if (tempUsername && tempPassword) {
          updateCredentials(tempUsername, tempPassword);
          setSettingsMsg('Credentials updated successfully!');
          setTimeout(() => {
              setSettingsMsg('');
              setShowSettings(false);
          }, 1500);
      } else {
          setSettingsMsg('Username and Password cannot be empty.');
      }
  };

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const totalCars = cars.length;
    const available = cars.filter(c => c.status === 'Available').length;
    const activeTrips = bookings.filter(b => b.status === BookingStatus.PRE_BOOKING || b.status === BookingStatus.ONGOING).length; 
    
    // Calculate total pending balance from active/completed bookings
    const pendingAmount = bookings.reduce((sum, b) => {
        return b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.DRAFT
            ? sum + (Number(b.netBalance) || 0) 
            : sum;
    }, 0);

    const totalCollected = bookings.reduce((sum, b) => {
        return b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.DRAFT
            ? sum + (Number(b.totalPaid) || 0)
            : sum;
    }, 0);

    const serviceAlerts = cars.filter(c => (c.currentKm - c.lastServiceKm) >= c.serviceInterval).length;

    return { totalCars, available, activeTrips, pendingAmount, totalCollected, serviceAlerts };
  }, [cars, bookings]);

  // --- Upcoming Returns ---
  const upcomingReturns = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return bookings
        .filter(b => (b.status === BookingStatus.PRE_BOOKING || b.status === BookingStatus.ONGOING) && b.endDate >= today)
        .sort((a, b) => a.endDate.localeCompare(b.endDate))
        .slice(0, 3);
  }, [bookings]);

  // --- Revenue Logic ---
  const { chartData, totalChartRevenue } = useMemo(() => {
    const data: { name: string; amt: number }[] = [];
    const now = new Date();
    let totalRevenue = 0;
    
    // Helper to get YYYY-MM-DD in local time
    const toDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Filter valid bookings (exclude Cancelled/Draft)
    let validBookings = bookings.filter(b => 
        b.status !== BookingStatus.CANCELLED && 
        b.status !== BookingStatus.DRAFT
    );

    // Filter by Selected Car if any
    if (revenueCarId) {
        validBookings = validBookings.filter(b => b.carId === revenueCarId);
    }

    // Value Getter: Strictly use Total Paid (Collected)
    const getValue = (b: Booking) => {
        return Number(b.totalPaid) || 0;
    };

    // Robust Date Getter
    const getDate = (b: Booking) => {
        // Use startDate if available, otherwise fallback to createdAt date
        if (b.startDate) return b.startDate;
        if (b.createdAt) {
             const created = new Date(b.createdAt);
             return toDateString(created);
        }
        return '';
    };

    if (revenueType === 'daily') {
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const dateStr = toDateString(d);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            
            const total = validBookings
                .filter(b => getDate(b) === dateStr)
                .reduce((sum, b) => sum + getValue(b), 0);
            
            data.push({ name: dayName, amt: total });
            totalRevenue += total;
        }
    } else if (revenueType === 'weekly') {
        // Last 4 weeks
        const currentDay = now.getDay(); // 0 is Sunday
        const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); 
        const currentMonday = new Date(now);
        currentMonday.setDate(diff);

        for (let i = 3; i >= 0; i--) {
             const startOfWeek = new Date(currentMonday);
             startOfWeek.setDate(currentMonday.getDate() - (i * 7));
             
             const endOfWeek = new Date(startOfWeek);
             endOfWeek.setDate(startOfWeek.getDate() + 6);

             const startStr = toDateString(startOfWeek);
             const endStr = toDateString(endOfWeek);
             
             const label = `${startOfWeek.getDate()}/${startOfWeek.getMonth()+1}`;

             const total = validBookings
                .filter(b => {
                    const d = getDate(b);
                    return d >= startStr && d <= endStr;
                })
                .reduce((sum, b) => sum + getValue(b), 0);

             data.push({ name: `W ${label}`, amt: total });
             totalRevenue += total;
        }
    } else if (revenueType === 'monthly') {
        // Current Year (Jan - Dec)
        const year = now.getFullYear();
        for (let i = 0; i < 12; i++) {
            const monthStr = `${year}-${String(i+1).padStart(2, '0')}`;
            const monthName = new Date(year, i, 1).toLocaleDateString('en-US', { month: 'short' });

            const total = validBookings
                .filter(b => {
                    const d = getDate(b);
                    return d && d.startsWith(monthStr);
                })
                .reduce((sum, b) => sum + getValue(b), 0);
            
            data.push({ name: monthName, amt: total });
            totalRevenue += total;
        }
    } else if (revenueType === 'yearly') {
        // Last 5 years
        const currentYear = now.getFullYear();
        for (let i = 4; i >= 0; i--) {
            const year = String(currentYear - i);
            const total = validBookings
                .filter(b => {
                    const d = getDate(b);
                    return d && d.startsWith(year);
                })
                .reduce((sum, b) => sum + getValue(b), 0);
            
            data.push({ name: year, amt: total });
            totalRevenue += total;
        }
    } else if (revenueType === 'custom') {
        if (customDateRange.start && customDateRange.end) {
             const start = new Date(customDateRange.start);
             const end = new Date(customDateRange.end);
             const diffTime = Math.abs(end.getTime() - start.getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

             if (diffDays <= 31) {
                // By Day
                let loopDate = new Date(start);
                while(loopDate <= end) {
                    const dateStr = toDateString(loopDate);
                    const dayLabel = `${loopDate.getDate()}/${loopDate.getMonth()+1}`;
                    const total = validBookings
                        .filter(b => getDate(b) === dateStr)
                        .reduce((sum, b) => sum + getValue(b), 0);
                    data.push({ name: dayLabel, amt: total });
                    totalRevenue += total;
                    loopDate.setDate(loopDate.getDate() + 1);
                }
             } else {
                 // By Month
                 let loopDate = new Date(start);
                 // Normalize to start of month to avoid skipping months
                 loopDate.setDate(1); 
                 
                 while(loopDate <= end) {
                     const year = loopDate.getFullYear();
                     const month = String(loopDate.getMonth() + 1).padStart(2, '0');
                     const monthStr = `${year}-${month}`;
                     const monthLabel = loopDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                     
                     const total = validBookings
                        .filter(b => {
                            const d = getDate(b);
                            return d && d.startsWith(monthStr);
                        })
                        .reduce((sum, b) => sum + getValue(b), 0);
                    
                     data.push({ name: monthLabel, amt: total });
                     totalRevenue += total;
                     
                     // Next Month
                     loopDate.setMonth(loopDate.getMonth() + 1);
                 }
             }
        }
    }
    return { chartData: data, totalChartRevenue: totalRevenue };
  }, [revenueType, bookings, customDateRange, cars, revenueCarId]);

  const handleSaveCar = () => {
    if (newCar.name && newCar.plateNumber) {
      const carToSave = {
        ...newCar,
        id: newCar.id || Date.now().toString(),
        documents: newCar.documents || [],
        model: newCar.model || '2024'
      } as Car;

      if (newCar.id) {
          onUpdateCar(carToSave);
      } else {
          onAddCar(carToSave);
      }
      
      setShowCarModal(false);
      setNewCar({ id: undefined, name: '', plateNumber: '', currentKm: 0, lastServiceKm: 0, serviceInterval: 10000, status: 'Available', imageUrl: undefined, documents: [] });
    }
  };

  const openAddModal = () => {
      setNewCar({ id: undefined, name: '', plateNumber: '', currentKm: 0, lastServiceKm: 0, serviceInterval: 10000, status: 'Available', imageUrl: undefined, documents: [] });
      setShowCarModal(true);
  };

  const openEditModal = (car: Car) => {
      setNewCar(car);
      setShowCarModal(true);
  };

  const handleServiceUpdate = (car: Car) => {
    if (window.confirm(`Mark service as done for ${car.name} (${car.plateNumber})? This will update the Last Service KM to the current odometer reading.`)) {
        const updated = { ...car, lastServiceKm: car.currentKm };
        onUpdateCar(updated);
    }
  };

  const handleCarImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCar(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCarDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setNewCar(prev => ({
                ...prev,
                documents: [...(prev.documents || []), reader.result as string]
            }));
          };
          reader.readAsDataURL(file);
      });
    }
  };

  const removeCarDocument = (index: number) => {
    setNewCar(prev => ({
        ...prev,
        documents: (prev.documents || []).filter((_, i) => i !== index)
    }));
  };

  const getCarName = (id: string) => {
    const c = cars.find(car => car.id === id);
    return c ? c.plateNumber : 'Unknown';
  };

  return (
    <div className="space-y-6 pb-20 p-5">
      <header className="flex justify-between items-center mb-4 animate-enter">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight transition-colors">Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-neutral-400 font-medium mt-1">Overview & Analytics</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={openSettings}
                className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white border border-transparent shadow-md flex items-center justify-center text-white dark:text-slate-900 hover:scale-105 active:scale-95 transition-all"
            >
                <User size={20} />
            </button>
            <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 border border-black shadow-sm flex items-center justify-center text-slate-600 dark:text-yellow-400 hover:scale-105 active:scale-95 transition-all"
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
      </header>

      {/* --- Quick Stats Cards --- */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 no-scrollbar animate-enter delay-75 snap-x md:grid md:grid-cols-4 md:overflow-visible md:mx-0 md:px-0">
          {/* Card 1: Pending Balance */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-neutral-900 dark:to-black p-4 rounded-3xl text-white min-w-[160px] w-[45%] md:w-auto flex flex-col justify-between shadow-lg shadow-slate-300 dark:shadow-black/50 snap-start border border-white/10 dark:border-neutral-800">
             <div className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <Wallet size={16} className="text-blue-300" />
             </div>
             <div>
                <span className="text-xs text-slate-400 font-medium block">Outstanding</span>
                <span className="text-xl font-bold tracking-tight">₹{stats.pendingAmount.toLocaleString()}</span>
             </div>
          </div>

          {/* Card 1b: Total Collected */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-900 p-4 rounded-3xl text-white min-w-[160px] w-[45%] md:w-auto flex flex-col justify-between shadow-lg shadow-blue-200 dark:shadow-blue-900/40 snap-start border border-white/10">
             <div className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <IndianRupee size={16} className="text-white" />
             </div>
             <div>
                <span className="text-xs text-blue-100 font-medium block">Total Collected</span>
                <span className="text-xl font-bold tracking-tight">₹{stats.totalCollected.toLocaleString()}</span>
             </div>
          </div>

          {/* Card 2: Active Trips */}
          <div className="bg-white dark:bg-neutral-900 border border-black dark:border-neutral-800 p-4 rounded-3xl min-w-[150px] w-[40%] md:w-auto flex flex-col justify-between shadow-sm snap-start transition-colors">
             <div className="bg-blue-50 dark:bg-blue-900/30 w-8 h-8 rounded-full flex items-center justify-center mb-4">
                <Activity size={16} className="text-blue-600 dark:text-blue-400" />
             </div>
             <div>
                <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium block">Active Trips</span>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.activeTrips}</span>
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500">/ {bookings.length}</span>
                </div>
             </div>
          </div>

          {/* Card 3: Fleet Status */}
          <div className="bg-white dark:bg-neutral-900 border border-black dark:border-neutral-800 p-4 rounded-3xl min-w-[150px] w-[40%] md:w-auto flex flex-col justify-between shadow-sm snap-start transition-colors">
             <div className="bg-emerald-50 dark:bg-emerald-900/30 w-8 h-8 rounded-full flex items-center justify-center mb-4">
                <CarIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
             </div>
             <div>
                <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium block">Available Cars</span>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.available}</span>
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500">/ {stats.totalCars}</span>
                </div>
             </div>
          </div>

           {/* Card 4: Service Alerts */}
           <div className="bg-white dark:bg-neutral-900 border border-black dark:border-neutral-800 p-4 rounded-3xl min-w-[150px] w-[40%] md:w-auto hidden md:flex flex-col justify-between shadow-sm snap-start transition-colors">
             <div className="bg-amber-50 dark:bg-amber-900/30 w-8 h-8 rounded-full flex items-center justify-center mb-4">
                <Zap size={16} className="text-amber-600 dark:text-amber-400" />
             </div>
             <div>
                <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium block">Service Due</span>
                <span className={`text-xl font-bold ${stats.serviceAlerts > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>{stats.serviceAlerts}</span>
             </div>
          </div>
      </div>

      {/* --- Revenue Chart Section --- */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-black dark:border-neutral-800 animate-scale-in delay-100 transition-colors">
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center">
                <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" /> 
                    Collected Revenue
                    <span className="text-slate-400 dark:text-neutral-500 text-sm font-normal">(₹{totalChartRevenue.toLocaleString()})</span>
                </h2>
            </div>

            <div className="flex gap-2 animate-enter flex-wrap">
                <select
                    value={revenueCarId}
                    onChange={(e) => setRevenueCarId(e.target.value)}
                    className="flex-1 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 font-medium transition-colors"
                >
                    <option value="">All Vehicles</option>
                    {cars.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.plateNumber})</option>
                    ))}
                </select>

                <select 
                    value={revenueType} 
                    onChange={(e) => setRevenueType(e.target.value as any)}
                    className="flex-1 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 font-medium transition-colors"
                >
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom Range</option>
                </select>
                
                {revenueType === 'custom' && (
                    <div className="flex gap-1 flex-[2] w-full sm:w-auto">
                        <input type="date" className="w-full text-[10px] p-1 border rounded-lg bg-slate-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white" value={customDateRange.start} onChange={e => setCustomDateRange({...customDateRange, start: e.target.value})} />
                        <input type="date" className="w-full text-[10px] p-1 border rounded-lg bg-slate-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white" value={customDateRange.end} onChange={e => setCustomDateRange({...customDateRange, end: e.target.value})} />
                    </div>
                )}
            </div>
        </div>
        
        <div className="h-48 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-neutral-500 text-xs bg-slate-50/50 dark:bg-neutral-900/30 rounded-2xl border-2 border-dashed border-slate-100 dark:border-neutral-800 transition-colors">
                 <TrendingUp size={24} className="mb-2 opacity-50"/>
                 <span>No billing data found for selected period</span>
                 {revenueType === 'custom' && !customDateRange.start && <span className="mt-1 text-[10px] text-blue-500">Select dates to view data</span>}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#262626" : "#f1f5f9"} />
                <XAxis dataKey="name" tick={{fontSize: 9, fill: darkMode ? '#a3a3a3' : '#64748b'}} axisLine={false} tickLine={false} dy={10} interval={0} />
                <YAxis hide />
                <Tooltip 
                    cursor={{fill: darkMode ? '#171717' : '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: darkMode ? '#171717' : '#fff', color: darkMode ? '#fff' : '#000'}}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar 
                    dataKey="amt" 
                    fill={darkMode ? "#3b82f6" : "#2563eb"} 
                    radius={[6, 6, 0, 0]} 
                    barSize={24} 
                    animationDuration={1000} 
                />
                </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* --- Upcoming Returns Section --- */}
      {upcomingReturns.length > 0 && (
          <div className="animate-enter delay-150">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3 px-1 text-sm uppercase tracking-wide">
                <CalendarClock size={16} className="text-blue-600 dark:text-blue-400" /> Upcoming Returns
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcomingReturns.map(booking => (
                    <div key={booking.id} className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-black dark:border-neutral-800 shadow-sm flex justify-between items-center transition-colors">
                        <div className="flex gap-3 items-center">
                            <div className="bg-slate-100 dark:bg-neutral-800 p-2 rounded-xl text-slate-500 dark:text-neutral-400">
                                <CarIcon size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm">{getCarName(booking.carId)}</h4>
                                <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">{booking.fullName}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-xs font-bold text-slate-700 dark:text-neutral-200 bg-slate-50 dark:bg-neutral-800 px-2 py-1 rounded-lg">
                                {booking.endDate}
                             </div>
                             <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1">{booking.endTime}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* --- Fleet Folder Section --- */}
      <div>
        <div className="flex justify-between items-center mb-4 px-1 animate-enter delay-200 mt-4">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-lg">
            <Folder size={20} className="text-blue-600 dark:text-blue-400" /> Fleet
          </h2>
          <button 
            onClick={openAddModal}
            className="bg-slate-900 dark:bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-slate-200 dark:shadow-none active:scale-95 transition-transform hover:bg-slate-800 hover:rotate-90 duration-300"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Updated Grid for XL screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cars.map((car, index) => {
            const kmDrivenSinceService = car.currentKm - car.lastServiceKm;
            const needsService = kmDrivenSinceService >= car.serviceInterval;
            const serviceProgress = Math.min((kmDrivenSinceService / car.serviceInterval) * 100, 100);

            // Calculate Car Revenue
            const carRevenue = bookings
                .filter(b => b.carId === car.id && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.DRAFT)
                .reduce((sum, b) => sum + (Number(b.totalPaid) || 0), 0);

            // Stagger delay calculation
            const delayClass = index === 0 ? 'delay-200' : index === 1 ? 'delay-300' : 'delay-400';

            return (
              <div key={car.id} className={`bg-white dark:bg-neutral-900 p-5 rounded-3xl shadow-md border border-black dark:border-neutral-800 relative overflow-hidden group hover:shadow-xl transition-all duration-300 animate-enter ${delayClass}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-1 rounded-2xl h-14 w-14 shrink-0 overflow-hidden flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform duration-300 border border-blue-100 dark:border-blue-900/50">
                        {car.imageUrl ? (
                             <img src={car.imageUrl} alt={car.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                             <CarIcon size={24} />
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{car.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded inline-block mt-1">{car.plateNumber}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${car.status === 'Available' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {car.status}
                    </div>
                  </div>
                </div>

                {/* Details Grid - Updated with Revenue */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-50 dark:bg-neutral-800/50 p-2 rounded-xl text-center">
                        <span className="text-[9px] text-slate-400 dark:text-neutral-500 block uppercase font-bold">Odometer</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-neutral-200">{car.currentKm.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-neutral-800/50 p-2 rounded-xl text-center">
                         <span className="text-[9px] text-slate-400 dark:text-neutral-500 block uppercase font-bold">Revenue</span>
                         <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₹{carRevenue.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-neutral-800/50 p-2 rounded-xl text-center">
                         <span className="text-[9px] text-slate-400 dark:text-neutral-500 block uppercase font-bold">Next Service</span>
                         <span className="text-xs font-bold text-slate-700 dark:text-neutral-200">{(car.lastServiceKm + car.serviceInterval).toLocaleString()}</span>
                    </div>
                </div>

                {/* Service Tracker */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className={needsService ? "text-red-500 dark:text-red-400 font-bold flex items-center gap-1" : "text-slate-500 dark:text-neutral-400 font-medium"}>
                      {needsService && <AlertTriangle size={12} className="animate-bounce" />}
                      Service Health
                    </span>
                    <span className="text-slate-400 dark:text-neutral-500 font-medium">{Math.round(serviceProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${needsService ? 'bg-red-500' : 'bg-blue-500'}`} 
                      style={{ width: `${serviceProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-slate-100 dark:border-neutral-800 pt-3">
                   {needsService && (
                    <button 
                      onClick={() => handleServiceUpdate(car)}
                      className="flex-1 text-xs bg-emerald-600 text-white py-2.5 rounded-xl flex justify-center items-center gap-2 font-bold hover:bg-emerald-700 transition-colors active:scale-95 shadow-lg shadow-emerald-200 dark:shadow-none"
                    >
                      <CheckCircle size={14} /> Service Done
                    </button>
                  )}
                  <button 
                      onClick={() => openEditModal(car)}
                      className="flex-1 text-xs bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-200 py-2.5 rounded-xl flex justify-center items-center gap-2 font-bold hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors active:scale-95"
                    >
                      <Edit size={14} /> Edit
                    </button>
                   <button 
                      onClick={() => onDeleteCar(car.id)}
                      className="w-10 text-xs bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 py-2.5 rounded-xl flex justify-center items-center gap-2 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors active:scale-95"
                    >
                      <Trash2 size={14} />
                    </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl shadow-2xl animate-scale-in border border-black dark:border-neutral-800">
                  <div className="p-5 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Settings size={20} className="text-blue-500"/> Account
                      </h3>
                      <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-100 dark:bg-neutral-800 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
                          <X size={18} />
                      </button>
                  </div>
                  
                  <div className="p-6 space-y-5">
                      <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase ml-1">Update Credentials</label>
                          <div className="relative group">
                              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                              <input 
                                  value={tempUsername}
                                  onChange={(e) => setTempUsername(e.target.value)}
                                  placeholder="New Username"
                                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:border-blue-500 text-sm font-medium text-slate-900 dark:text-white"
                              />
                          </div>
                          <div className="relative group">
                              <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                              <input 
                                  value={tempPassword}
                                  onChange={(e) => setTempPassword(e.target.value)}
                                  placeholder="New Password"
                                  type={showPassword ? "text" : "password"}
                                  className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:border-blue-500 text-sm font-medium text-slate-900 dark:text-white"
                              />
                              <button 
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors"
                              >
                                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                          </div>
                      </div>

                      {settingsMsg && (
                          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${settingsMsg.includes('success') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              <Shield size={14}/> {settingsMsg}
                          </div>
                      )}

                      <button 
                          onClick={handleSaveSettings}
                          className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                      >
                          Save Changes
                      </button>

                      <div className="pt-2">
                          <button 
                              onClick={() => {
                                  if (window.confirm("Are you sure you want to reset ALL car odometers to 0? This cannot be undone.")) {
                                      resetAllOdometers();
                                      window.location.reload(); 
                                  }
                              }}
                              className="w-full py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors border border-amber-200 dark:border-amber-800/50"
                          >
                              <Zap size={18} /> Reset All Odometers
                          </button>
                      </div>

                      <div className="border-t border-slate-100 dark:border-neutral-800 pt-5">
                          <button 
                              onClick={() => {
                                  logout();
                                  onLogout();
                                  setShowSettings(false);
                              }}
                              className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-500 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                          >
                              <LogOut size={18} /> Logout
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Add/Edit Car Modal Overlay */}
      {showCarModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] overflow-y-auto animate-fade-in">
          <div className="min-h-full flex items-center justify-center p-4 pb-24">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl shadow-2xl animate-scale-in transition-colors border border-black dark:border-neutral-800 relative">
                
                {/* Content Area */}
                <div className="p-6 space-y-5">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white text-center">{newCar.id ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                    
                    <div className="flex justify-center mb-1">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-neutral-800 border-2 border-dashed border-slate-300 dark:border-neutral-700 flex items-center justify-center overflow-hidden">
                                {newCar.imageUrl ? (
                                    <img src={newCar.imageUrl} alt="Car Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <CarIcon size={32} className="text-slate-400 dark:text-neutral-500" />
                                )}
                            </div>
                            <label className="absolute bottom-[-10px] right-[-10px] bg-blue-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-colors active:scale-90">
                                <Upload size={14} />
                                <input type="file" accept="image/*" className="hidden" onChange={handleCarImageUpload} />
                            </label>
                            {newCar.imageUrl && (
                                <button 
                                    onClick={() => setNewCar({...newCar, imageUrl: undefined})}
                                    className="absolute top-[-5px] left-[-5px] bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 active:scale-90"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <input 
                        placeholder="Vehicle Name" 
                        className="w-full p-3.5 bg-slate-50 dark:bg-neutral-800 rounded-xl border border-black dark:border-neutral-700 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-neutral-500"
                        value={newCar.name}
                        onChange={e => setNewCar({...newCar, name: e.target.value})}
                        />
                        <input 
                        placeholder="Plate Number" 
                        className="w-full p-3.5 bg-slate-50 dark:bg-neutral-800 rounded-xl border border-black dark:border-neutral-700 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-neutral-500"
                        value={newCar.plateNumber}
                        onChange={e => setNewCar({...newCar, plateNumber: e.target.value})}
                        />
                        <div className="flex gap-3">
                        <input 
                            type="number"
                            placeholder="Current KM" 
                            className="w-1/2 p-3.5 bg-slate-50 dark:bg-neutral-800 rounded-xl border border-black dark:border-neutral-700 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-neutral-500"
                            value={newCar.currentKm || ''}
                            onChange={e => setNewCar({...newCar, currentKm: Number(e.target.value)})}
                        />
                        <input 
                            type="number"
                            placeholder="Last Service KM" 
                            className="w-1/2 p-3.5 bg-slate-50 dark:bg-neutral-800 rounded-xl border border-black dark:border-neutral-700 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-neutral-500"
                            value={newCar.lastServiceKm || ''}
                            onChange={e => setNewCar({...newCar, lastServiceKm: Number(e.target.value)})}
                        />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 ml-1">Vehicle Status</label>
                            <select 
                                value={newCar.status} 
                                onChange={(e) => setNewCar({...newCar, status: e.target.value as any})}
                                className="w-full p-3.5 bg-slate-50 dark:bg-neutral-800 rounded-xl border border-black dark:border-neutral-700 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                            >
                                <option value="Available">Available</option>
                                <option value="Rented">Rented</option>
                                <option value="Maintenance">Maintenance</option>
                            </select>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
                            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 ml-1 flex justify-between items-center">
                                <span className="flex items-center gap-1"><Folder size={12}/> Vehicle Documents</span>
                                <span className="text-[10px] bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-slate-500">{newCar.documents?.length || 0} files</span>
                            </label>
                            
                            <div className="grid grid-cols-4 gap-2">
                                <label className="aspect-square bg-slate-50 dark:bg-neutral-800 border-2 border-dashed border-slate-300 dark:border-neutral-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors active:scale-95">
                                    <Upload size={16} className="text-slate-400 mb-1" />
                                    <span className="text-[8px] font-bold text-slate-500 uppercase">Add</span>
                                    <input type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={handleCarDocumentUpload} />
                                </label>

                                {newCar.documents?.map((doc, idx) => (
                                    <div key={idx} className="relative aspect-square bg-slate-100 dark:bg-neutral-800 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-700 group">
                                        {doc.startsWith('data:application/pdf') ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                <FileText size={20} />
                                                <span className="text-[6px] font-bold uppercase mt-1">PDF</span>
                                            </div>
                                        ) : (
                                            <img src={doc} className="w-full h-full object-cover" alt={`doc-${idx}`} />
                                        )}
                                        <button 
                                            onClick={() => removeCarDocument(idx)}
                                            className="absolute top-0.5 right-0.5 bg-red-500/80 hover:bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[9px] text-slate-400 text-center mt-1">RC, Insurance, PUC, Permits etc.</p>
                        </div>
                    </div>
                </div>
                
                {/* Actions */}
                <div className="p-4 border-t border-slate-100 dark:border-neutral-800 bg-slate-50/80 dark:bg-black/20 backdrop-blur-sm flex gap-3 rounded-b-3xl">
                <button onClick={() => setShowCarModal(false)} className="flex-1 p-3.5 text-slate-600 dark:text-neutral-300 font-bold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700 rounded-xl transition-colors">Cancel</button>
                <button onClick={handleSaveCar} className="flex-1 p-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/20 active:scale-95 transition-all hover:bg-blue-700">
                    {newCar.id ? 'Update Car' : 'Save Car'}
                </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;