import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Booking, Car, BookingStatus, Notification } from './types';
import { LayoutDashboard, PlusCircle, FileEdit, Clock, CheckSquare, List, AlertCircle, ArrowRight, Menu, X, Sun, Moon, Settings, Move } from 'lucide-react';
import DashboardView from './components/DashboardView';
import BookingForm from './components/BookingForm';
import BookingList from './components/BookingList';
import Login from './components/Login';
import LockScreen from './components/LockScreen';
import SettingsView from './components/SettingsView';

import Sidebar from './components/Sidebar';
import { getBookings, getCars, saveBooking, saveCar, getDraft, deleteCar, deleteBooking } from './services/storageService';
import { getNotifications, saveNotification, markAllAsRead, clearNotifications } from './services/notificationService';
import { isAuthenticated, isAppLocked, setAppLocked, logout, getPin } from './services/authService';
import { getSyncSettings, performSync } from './services/syncService';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [showBottomNav, setShowBottomNav] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [unsavedDraft, setUnsavedDraft] = useState<Partial<Booking> | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Floating Nav State
  const [navPosition, setNavPosition] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('navPosition');
        if (saved) return JSON.parse(saved);
        return { x: 20, y: window.innerHeight - 100 };
    }
    return { x: 20, y: 600 };
  });
  const [isNavIdle, setIsNavIdle] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const navStartPos = useRef({ x: 0, y: 0 });
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  // Idle Timer Logic
  useEffect(() => {
    const resetIdle = () => {
        setIsNavIdle(false);
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => {
            setIsNavIdle(true);
        }, 500);
    };

    const events = ['mousedown', 'mousemove', 'touchstart', 'touchmove', 'scroll', 'click', 'keydown'];
    events.forEach(e => window.addEventListener(e, resetIdle));
    
    resetIdle();

    return () => {
        events.forEach(e => window.removeEventListener(e, resetIdle));
        if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  // Drag Logic
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Only allow dragging from the handle or specific area if needed
    // For now, we attach this to the container or a handle
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    dragStartPos.current = { x: clientX, y: clientY };
    navStartPos.current = { ...navPosition };
  };

  const handleDragMove = (e: any) => {
    if (!isDragging) return;
    e.preventDefault(); 
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - dragStartPos.current.x;
    const dy = clientY - dragStartPos.current.y;
    
    let newX = navStartPos.current.x + dx;
    let newY = navStartPos.current.y + dy;
    
    // Boundary checks (keep fully on screen)
    // Assuming nav width approx 300px, height 60px. 
    // We can refine this by using ref to get actual dimensions.
    const navEl = document.getElementById('floating-nav');
    const width = navEl ? navEl.offsetWidth : 300;
    const height = navEl ? navEl.offsetHeight : 60;

    const maxX = window.innerWidth - width;
    const maxY = window.innerHeight - height;
    
    newX = Math.max(0, Math.min(maxX, newX));
    newY = Math.max(0, Math.min(maxY, newY));

    setNavPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Keep nav on screen on resize
  useEffect(() => {
    const handleResize = () => {
        setNavPosition((prev: { x: number; y: number }) => {
            const navEl = document.getElementById('floating-nav');
            const width = navEl ? navEl.offsetWidth : 300; // Fallback width
            const height = navEl ? navEl.offsetHeight : 60; // Fallback height
            
            const maxX = window.innerWidth - width;
            const maxY = window.innerHeight - height;
            
            return {
                x: Math.max(0, Math.min(prev.x, maxX)),
                y: Math.max(0, Math.min(prev.y, maxY))
            };
        });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isDragging) {
        localStorage.setItem('navPosition', JSON.stringify(navPosition));
    }
  }, [isDragging, navPosition]);

  useEffect(() => {
    if (isDragging) {
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchmove', handleDragMove, { passive: false });
        window.addEventListener('touchend', handleDragEnd);
    } else {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
    }
    return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

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
      if (isAppLocked() && getPin()) {
          setIsLocked(true);
      } else {
          setAppLocked(false);
      }
    }
  }, []);

  // Auto-Lock Timer (15 minutes)
  useEffect(() => {
    if (!isLoggedIn || isLocked) return;

    let lockTimer: NodeJS.Timeout;
    const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

    const resetLockTimer = () => {
      clearTimeout(lockTimer);
      if (!getPin()) return; // Don't lock if no PIN set
      
      lockTimer = setTimeout(() => {
        setIsLocked(true);
        setAppLocked(true);
      }, LOCK_TIME);
    };

    const events = ['mousemove', 'mousedown', 'touchstart', 'click', 'keydown', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetLockTimer, true));
    
    resetLockTimer();

    return () => {
      clearTimeout(lockTimer);
      events.forEach(event => window.removeEventListener(event, resetLockTimer, true));
    };
  }, [isLoggedIn, isLocked]);

  // Auto-Sync Implementation
  useEffect(() => {
    if (!isLoggedIn) return;

    let syncTimer: NodeJS.Timeout;

    const runSync = async () => {
        const settings = getSyncSettings();
        if (settings.enabled && settings.scriptUrl) {
            console.log('Performing auto-sync...');
            await performSync();
        }
        
        // Schedule next run based on current settings
        const nextSettings = getSyncSettings();
        if (nextSettings.enabled) {
            const intervalMs = Math.max(15, nextSettings.autoSyncInterval) * 60 * 1000;
            syncTimer = setTimeout(runSync, intervalMs);
        }
    };

    // Initial delay to not block startup
    syncTimer = setTimeout(runSync, 5000);

    return () => clearTimeout(syncTimer);
  }, [isLoggedIn]);

  // Load Data on Mount (only if logged in, but we can load anyway for readiness)
  useEffect(() => {
    if (isLoggedIn) {
        setBookings(getBookings());
        setCars(getCars());
        setNotifications(getNotifications());
    }
  }, [isLoggedIn]);

  const addNotification = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
      const newNotification = saveNotification({ type, message });
      if (newNotification) {
          setNotifications(prev => [newNotification, ...prev]);
      }
  };

  const handleMarkAllRead = () => {
      const updated = markAllAsRead();
      setNotifications(updated);
  };

  const handleClearNotifications = () => {
      clearNotifications();
      setNotifications([]);
  };

  // Check for unsaved draft whenever entering the draft view
  useEffect(() => {
    if (currentView === 'draft') {
        setUnsavedDraft(getDraft());
    }
  }, [currentView]);



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
        addNotification('success', `Booking completed for ${booking.fullName}`);
        setCurrentView('complete'); // Redirect to Done list
    } else if (booking.status === BookingStatus.PRE_BOOKING || booking.status === BookingStatus.ONGOING) {
        // Update car status to Rented
        const car = cars.find(c => c.id === booking.carId);
        if (car && car.status === 'Available') {
             handleUpdateCar({ ...car, status: 'Rented' });
        }
        
        // Redirect based on status
        if (booking.status === BookingStatus.ONGOING) {
            addNotification('info', `Booking started for ${booking.fullName}`);
            setCurrentView('all_bookings');
        } else {
            addNotification('info', `Pre-booking created for ${booking.fullName}`);
            setCurrentView('pre_booking');
        }
    } else {
        addNotification('info', `Booking saved for ${booking.fullName}`);
        setCurrentView('all_bookings');
    }

    saveBooking(booking);
    setBookings(getBookings()); // Refresh
    setEditingBooking(null);
  };

  const handleAddCar = (car: Car) => {
    saveCar(car);
    setCars(getCars());
    addNotification('success', `Car ${car.name} added successfully`);
  };

  const handleUpdateCar = (car: Car) => {
    saveCar(car);
    setCars(getCars());
    // Don't notify on every update to avoid spam, or make it optional
  };
  
  const handleDeleteCar = (id: string) => {
    if (window.confirm("Are you sure you want to delete this car? This action cannot be undone.")) {
        deleteCar(id);
        setCars(getCars());
        addNotification('warning', `Car deleted`);
    }
  };

  const handleDeleteBooking = (id: string) => {
    if (window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
        deleteBooking(id);
        setBookings(getBookings());
        addNotification('warning', `Booking deleted`);
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
    { id: 'settings', icon: Settings, label: 'Settings' },
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

  if (isLocked) {
      return (
          <div className={darkMode ? 'dark' : ''}>
            <LockScreen 
                onUnlock={() => {
                    setIsLocked(false);
                    setAppLocked(false);
                }} 
                onLogout={() => {
                    logout();
                    setIsLoggedIn(false);
                    setIsLocked(false);
                    setAppLocked(false);
                }}
            />
          </div>
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
          className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white dark:bg-neutral-900 z-[101] md:hidden transition-transform duration-500 ease-out shadow-2xl ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-sm">S</span>
                </div>
                <div>
                  <h1 className="font-black text-slate-800 dark:text-white tracking-tighter text-sm leading-none">SHREE SELF DRIVING</h1>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mt-0.5">& CAR RENTAL SERVICE</p>
                </div>
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
          ref={mainRef}
          key={currentView} 
          className="flex-1 overflow-y-auto scroll-smooth relative h-full flex flex-col"
        >
          {/* Mobile Top Bar */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-slate-100 dark:border-crm-border sticky top-0 z-40">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 -ml-2 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center shrink-0">
                <span className="text-white font-black text-[10px]">S</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-slate-800 dark:text-white tracking-tighter text-sm leading-none font-mono">SHREE SELF DRIVING</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-tight font-mono">& CAR RENTAL SERVICE</span>
              </div>
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
                onLogout={() => {
                    logout();
                    setIsLoggedIn(false);
                }}
                notifications={notifications}
                onMarkAllRead={handleMarkAllRead}
                onClearNotifications={handleClearNotifications}
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

            {currentView === 'settings' && (
              <SettingsView 
                darkMode={darkMode}
                toggleTheme={toggleTheme}
                showBottomNav={showBottomNav}
                toggleBottomNav={() => setShowBottomNav(!showBottomNav)}
                onLogout={() => {
                    logout();
                    setIsLoggedIn(false);
                }}
              />
            )}
          </div>

          {/* Floating Movable Navigation Bar */}
          <div 
            id="floating-nav"
            className={`md:hidden fixed z-[999] transition-all duration-500 ease-in-out ${!showBottomNav || (isNavIdle && !isDragging) ? 'opacity-0 scale-90 translate-y-10 pointer-events-none' : 'opacity-100 scale-100 translate-y-0 pointer-events-auto'}`}
            style={{ 
                left: navPosition.x, 
                top: navPosition.y,
                touchAction: 'none' 
            }}
          >
            <nav className="bg-slate-900/90 dark:bg-neutral-800/90 backdrop-blur-xl text-white p-1.5 rounded-full shadow-2xl flex items-center gap-1 border border-white/10 relative max-w-[92vw] overflow-x-auto no-scrollbar">
                
                {/* Drag Handle */}
                <div 
                    className="p-2 cursor-move text-slate-500 hover:text-white active:text-blue-400 shrink-0"
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                >
                    <Move size={16} />
                </div>

                {navItems.filter(item => item.id !== 'settings').map((item) => {
                    const isActive = currentView === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setCurrentView(item.id as ViewState);
                                setEditingBooking(null);
                            }}
                            className={`p-2.5 rounded-full transition-all duration-200 flex items-center justify-center shrink-0 ${isActive ? 'bg-blue-600 text-white shadow-lg scale-110' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                        >
                            <Icon size={18} />
                        </button>
                    )
                })}
                
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                    <Menu size={18} />
                </button>
            </nav>
          </div>
        </main>

      </div>
    </div>
  );
};

export default App;