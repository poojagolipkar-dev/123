import React, { useState, useEffect } from 'react';
import { ViewState, Booking, Car, BookingStatus } from './types';
import { LayoutDashboard, PlusCircle, FileEdit, Clock, CheckSquare, List, AlertCircle, ArrowRight, Menu, X, Sun, Moon } from 'lucide-react';
import DashboardView from './components/DashboardView';
import BookingForm from './components/BookingForm';
import BookingList from './components/BookingList';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import { getBookings, getCars, saveBooking, saveCar, getDraft, deleteCar, deleteBooking } from './services/storageService';
import { isAuthenticated } from './services/authService';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [unsavedDraft, setUnsavedDraft] = useState<Partial<Booking> | null>(null);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Apply Theme Effect
  useEffect(() => {
    if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Check Auth on Mount
  useEffect(() => {
    if (isAuthenticated()) {
      setIsLoggedIn(true);
    }
  }, []);

  // Load Data on Mount (only if logged in, but we can load anyway for readiness)
  useEffect(() => {
    if (isLoggedIn) {
        setBookings(getBookings());
        setCars(getCars());
    }
  }, [isLoggedIn]);

  // Check for unsaved draft whenever entering the draft view
  useEffect(() => {
    if (currentView === 'draft') {
        setUnsavedDraft(getDraft());
    }
  }, [currentView]);

  // Auto-hide Navigation Logic (Mobile Only)
  useEffect(() => {
    if (!isLoggedIn) return;
    
    let hideTimer: NodeJS.Timeout;

    const resetTimer = () => {
      setIsNavVisible(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        setIsNavVisible(false);
      }, 5000);
    };

    // Events to detect user activity
    const events = ['mousemove', 'mousedown', 'touchstart', 'click', 'keydown', 'scroll'];
    
    // Add listeners (use capture for scroll to detect scrolling in nested elements)
    events.forEach(event => window.addEventListener(event, resetTimer, true));

    // Initial timer start
    resetTimer();

    return () => {
      clearTimeout(hideTimer);
      events.forEach(event => window.removeEventListener(event, resetTimer, true));
    };
  }, [isLoggedIn]);

  const handleSaveBooking = (booking: Booking) => {
    // If completing, update car mileage
    if (booking.status === BookingStatus.COMPLETED) {
        const car = cars.find(c => c.id === booking.carId);
        if (car) {
            const updatedCar = { 
                ...car, 
                currentKm: booking.checkinKm, 
                status: 'Available' 
            } as Car;
            handleUpdateCar(updatedCar);
        }
        setCurrentView('complete'); // Redirect to Done list
    } else if (booking.status === BookingStatus.PRE_BOOKING || booking.status === BookingStatus.ONGOING) {
        // Update car status to Rented
        const car = cars.find(c => c.id === booking.carId);
        if (car && car.status === 'Available') {
             handleUpdateCar({ ...car, status: 'Rented' });
        }
        
        // Redirect based on status
        if (booking.status === BookingStatus.ONGOING) {
            setCurrentView('all_bookings');
        } else {
            setCurrentView('pre_booking');
        }
    } else {
        setCurrentView('all_bookings');
    }

    saveBooking(booking);
    setBookings(getBookings()); // Refresh
    setEditingBooking(null);
  };

  const handleAddCar = (car: Car) => {
    saveCar(car);
    setCars(getCars());
  };

  const handleUpdateCar = (car: Car) => {
    saveCar(car);
    setCars(getCars());
  };
  
  const handleDeleteCar = (id: string) => {
    if (window.confirm("Are you sure you want to delete this car? This action cannot be undone.")) {
        deleteCar(id);
        setCars(getCars());
    }
  };

  const handleDeleteBooking = (id: string) => {
    if (window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
        deleteBooking(id);
        setBookings(getBookings());
    }
  };

  const loadUnsavedDraft = () => {
    const draft = getDraft();
    if (draft) {
      setEditingBooking(draft as Booking);
      setCurrentView('new_booking');
    }
  };

  // Determine the mode for BookingForm
  const getBookingFormMode = () => {
      if (!editingBooking) return 'new';
      if (editingBooking.status === BookingStatus.DRAFT) return 'draft';
      return 'edit';
  };

  // Navigation Items
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'new_booking', icon: PlusCircle, label: 'New Booking' },
    { id: 'draft', icon: FileEdit, label: 'Drafts' }, 
    { id: 'pre_booking', icon: Clock, label: 'Pre-Booking' },
    { id: 'complete', icon: CheckSquare, label: 'Completed' },
    { id: 'all_bookings', icon: List, label: 'All Bookings' },
  ];

  if (!isLoggedIn) {
      return (
          <>
            {/* Pass theme for consistent look even on login, though logic is inside App */}
            <div className={darkMode ? 'dark' : ''}>
                <Login onLogin={() => setIsLoggedIn(true)} />
            </div>
          </>
      );
  }

  return (
    <div className="h-screen h-[100dvh] w-full flex justify-center items-center p-0 transition-colors duration-500 overflow-hidden">
      {/* App Container - Full Screen on Desktop */}
      <div className="w-full h-full bg-slate-50/80 dark:bg-black/95 backdrop-blur-2xl shadow-2xl flex relative overflow-hidden border-0">
        
        {/* Left Sidebar - Visible on Desktop */}
        <Sidebar 
          navItems={navItems} 
          currentView={currentView} 
          onViewChange={(view) => {
            setCurrentView(view);
            setEditingBooking(null);
          }}
          darkMode={darkMode}
        />

        {/* Mobile Drawer Overlay */}
        {isDrawerOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden animate-fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        {/* Mobile Slidable Drawer */}
        <div 
          className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-neutral-900 z-[101] md:hidden transition-transform duration-500 ease-out shadow-2xl ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-sm">S</span>
                </div>
                <h1 className="font-black text-slate-800 dark:text-white tracking-tighter text-sm">SHREE</h1>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id as ViewState);
                      setEditingBooking(null);
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                      isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-lg'
                        : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-6 border-t border-slate-100 dark:border-neutral-800">
              <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-neutral-800 rounded-2xl"
              >
                <span className="text-xs font-bold text-slate-600 dark:text-neutral-300 uppercase">Appearance</span>
                {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <main 
          key={currentView} 
          className="flex-1 overflow-y-auto scroll-smooth relative h-full flex flex-col"
        >
          {/* Mobile Top Bar */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-slate-100 dark:border-neutral-800 sticky top-0 z-40">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 -ml-2 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-black text-[10px]">S</span>
              </div>
              <span className="font-black text-slate-800 dark:text-white tracking-tighter text-xs">SHREE</span>
            </div>
            <div className="w-10" /> {/* Spacer for balance */}
          </div>

          <div className="w-full min-h-full px-3 md:px-8 pb-40 pt-4 md:pt-6">
            {currentView === 'dashboard' && (
              <DashboardView 
                cars={cars} 
                bookings={bookings} 
                darkMode={darkMode}
                toggleTheme={toggleTheme}
                onAddCar={handleAddCar}
                onUpdateCar={handleUpdateCar}
                onDeleteCar={handleDeleteCar}
                onLogout={() => setIsLoggedIn(false)}
              />
            )}

            {currentView === 'new_booking' && (
              <div className="max-w-5xl mx-auto">
                <BookingForm 
                  cars={cars} 
                  mode={getBookingFormMode()}
                  initialData={editingBooking || undefined}
                  onSave={handleSaveBooking}
                  onCancel={() => {
                    setEditingBooking(null);
                    setCurrentView('dashboard');
                  }}
                />
              </div>
            )}

            {/* Draft View Logic */}
            {currentView === 'draft' && (
              <div className="space-y-6 animate-enter p-1 md:p-5">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 tracking-tight animate-slide-in">Drafts</h2>
                  
                  {/* Unsaved Auto-Draft Section */}
                  {unsavedDraft && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 p-5 rounded-2xl shadow-sm mb-6 animate-scale-in delay-100 max-w-5xl mx-auto">
                          <div className="flex items-start gap-4">
                              <div className="bg-orange-100 dark:bg-orange-800/30 p-2 rounded-full text-orange-600 dark:text-orange-400 animate-pulse">
                                  <AlertCircle size={24} />
                              </div>
                              <div className="flex-1">
                                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Unsaved Work</h3>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                      You have an unsaved booking form from {new Date(unsavedDraft.updatedAt || Date.now()).toLocaleTimeString()}.
                                  </p>
                                  <button 
                                      onClick={loadUnsavedDraft}
                                      className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200 dark:shadow-none transition-all active:scale-95"
                                  >
                                      Resume Editing <ArrowRight size={18} />
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* Saved Drafts List */}
                  <BookingList 
                      bookings={bookings} 
                      cars={cars} 
                      filterStatus={BookingStatus.DRAFT}
                      onEdit={(b) => {
                          setEditingBooking(b);
                          setCurrentView('new_booking');
                      }}
                      onComplete={(b) => {
                          setEditingBooking(b);
                          setCurrentView('complete');
                      }}
                      onDelete={handleDeleteBooking}
                  />
              </div>
            )}

            {currentView === 'pre_booking' && (
              <BookingList 
                bookings={bookings} 
                cars={cars} 
                filterStatus={BookingStatus.PRE_BOOKING}
                onEdit={(b) => {
                  setEditingBooking(b);
                  setCurrentView('new_booking');
                }}
                onComplete={(b) => {
                  setEditingBooking(b);
                  setCurrentView('complete');
                }}
                onDelete={handleDeleteBooking}
              />
            )}

            {currentView === 'complete' && (
              editingBooking ? (
                  <div className="max-w-5xl mx-auto">
                    <BookingForm 
                        cars={cars} 
                        mode="complete" 
                        initialData={editingBooking}
                        onSave={handleSaveBooking}
                        onCancel={() => {
                            setEditingBooking(null);
                            setCurrentView('all_bookings');
                        }}
                    />
                  </div>
              ) : (
                   <BookingList 
                    bookings={bookings} 
                    cars={cars} 
                    filterStatus={BookingStatus.COMPLETED} 
                    onEdit={(b) => {
                        setEditingBooking(b);
                        setCurrentView('new_booking'); 
                    }}
                    onComplete={(b) => {
                    }}
                    onDelete={handleDeleteBooking}
                  />
              )
            )}

             {currentView === 'all_bookings' && (
              <BookingList 
                bookings={bookings} 
                cars={cars} 
                onEdit={(b) => {
                  setEditingBooking(b);
                  setCurrentView('new_booking');
                }}
                onComplete={(b) => {
                  setEditingBooking(b);
                  setCurrentView('complete');
                }}
                onDelete={handleDeleteBooking}
                onRefresh={() => setBookings(getBookings())}
              />
            )}
          </div>
        </main>

      </div>
    </div>
  );
};

export default App;