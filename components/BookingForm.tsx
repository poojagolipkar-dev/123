import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Booking, BookingStatus, Car } from '../types';
import { Camera, MapPin, Upload, Calendar, Clock, CreditCard, Save, X, User, FileEdit, CheckCircle, Loader2, CheckSquare, Trash2, FileText, SwitchCamera, Zap, ZapOff, Sun, RefreshCw, Aperture, PlayCircle, Search, Locate, Layers, Globe, ArrowLeft, AlertCircle, AlertTriangle, Car as CarIcon, Home, Users, Satellite, KeyRound, Lock, Unlock, Phone, Mail, FileText as FileIcon, IndianRupee, ScanText, Copy, Download } from 'lucide-react';
import { saveDraft, clearDraft, generateNextBookingId, getBookings } from '../services/storageService';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { GoogleGenAI } from "@google/genai";
import * as XLSX from 'xlsx';

// --- OpenStreetMap / Leaflet Config ---
// Fix Leaflet's default icon path issues in React
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_CENTER = {
  lat: 19.0760, // Mumbai
  lng: 72.8777
};

interface BookingFormProps {
  cars: Car[];
  initialData?: Partial<Booking>;
  mode: 'new' | 'edit' | 'draft' | 'complete';
  onSave: (booking: Booking) => void;
  onCancel: () => void;
}

// Helper Components
const Section = ({ title, icon: Icon, children, className }: any) => (
  <div className={`bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md p-5 rounded-3xl shadow-md border border-black dark:border-crm-border mb-5 animate-enter transition-colors ${className}`}>
    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-5 border-b border-black dark:border-crm-border pb-3">
      <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-lg text-blue-600 dark:text-blue-400">
        <Icon size={16} /> 
      </div>
      {title}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
      {children}
    </div>
  </div>
);

const Input = ({ label, type = 'text', value, onChange, placeholder, readOnly = false, action, onAction, icon: Icon }: any) => (
  <div className="flex flex-col gap-1.5 group">
    <div className="flex justify-between items-end">
        <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 ml-1 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">{label}</label>
        {action && (
            <button 
                type="button" 
                onClick={onAction}
                className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors active:scale-95 border border-blue-100 dark:border-blue-900/50"
            >
                {action}
            </button>
        )}
    </div>
    <div className="relative">
        {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 pointer-events-none">
                <Icon size={18} />
            </div>
        )}
        <input 
        type={type} 
        value={value || ''} 
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full p-3.5 ${Icon ? 'pl-10' : ''} rounded-xl border ${readOnly ? 'bg-slate-100 dark:bg-neutral-900 text-slate-500 border-black dark:border-neutral-800 cursor-not-allowed' : 'bg-slate-50 dark:bg-neutral-800 border-black dark:border-neutral-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 text-slate-700 dark:text-white'} outline-none text-sm transition-all font-medium`}
        />
    </div>
  </div>
);

const ClientPhotoUpload = ({ value, onCapture, onUpload, onClear }: any) => {
  return (
    <div className="relative group overflow-hidden rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shadow-2xl border border-slate-100 dark:border-neutral-800 transition-all hover:shadow-blue-500/10 max-w-sm mx-auto p-1">
      {/* Premium Gradient Border Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center p-8 gap-8 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-[20px]">
        
        {/* Photo Container */}
        <div className="relative group/photo">
            {/* Animated Ring */}
            <div className={`absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-75 blur-sm transition-all duration-500 ${value ? 'animate-spin-slow opacity-100' : 'opacity-0'}`}></div>
            
            <div className={`relative w-48 h-48 rounded-full flex items-center justify-center overflow-hidden shadow-2xl border-[6px] transition-all duration-500 bg-slate-100 dark:bg-neutral-800 ${value ? 'border-[#D6F527] scale-100' : 'border-white dark:border-neutral-700 scale-100'}`}>
            {value ? (
                <img src={value} alt="Client" className="w-full h-full object-cover animate-scale-in" />
            ) : (
                <div className="flex flex-col items-center justify-center text-slate-300 dark:text-neutral-600 group-hover/photo:text-blue-500 transition-colors duration-300">
                    <User size={64} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold mt-3 uppercase tracking-[0.2em] opacity-60">Add Photo</span>
                </div>
            )}
            </div>

            {value && (
                <button 
                    type="button"
                    onClick={onClear}
                    className="absolute top-2 right-2 p-2.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all active:scale-90 z-20 border-2 border-white dark:border-black"
                >
                    <X size={18} strokeWidth={2.5} />
                </button>
            )}

            {!value && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg shadow-red-500/30 animate-bounce border-2 border-white dark:border-black whitespace-nowrap tracking-wider">
                    REQUIRED
                </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-4">
            <button
                type="button"
                onClick={onCapture}
                className="relative overflow-hidden flex flex-col items-center justify-center gap-2 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 group/btn"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <Camera size={24} className="group-hover/btn:scale-110 transition-transform duration-300" />
                    <span className="text-[10px] font-black tracking-widest uppercase">Camera</span>
                </div>
            </button>

            <label className="relative overflow-hidden flex flex-col items-center justify-center gap-2 py-4 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white rounded-2xl shadow-lg border border-slate-100 dark:border-neutral-700 hover:border-blue-500/50 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 cursor-pointer group/btn">
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <Upload size={24} className="text-slate-400 dark:text-neutral-500 group-hover/btn:text-blue-500 transition-colors duration-300 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 dark:text-neutral-400 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors">Upload</span>
                </div>
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={onUpload}
                />
            </label>
        </div>
      </div>
    </div>
  );
};

const DocumentRow = ({ 
  label, 
  idValue, 
  placeholder, 
  files, 
  onIdChange, 
  onFileUpload, 
  onCameraCapture, 
  onFileRemove,
  onPreview,
  onExtractText
}: {
  label: string, 
  idValue: string, 
  placeholder?: string, 
  files: string[], 
  onIdChange: (val: string) => void, 
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  onCameraCapture: () => void,
  onFileRemove: (index: number) => void,
  onPreview: (file: string) => void,
  onExtractText?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  // Ensure files is an array to prevent "map is not a function" error (handles corrupt data/strings)
  const safeFiles = Array.isArray(files) ? files : [];
  
  return (
      <div className="bg-slate-50/80 dark:bg-neutral-800/40 backdrop-blur-md p-4 rounded-2xl border border-black dark:border-neutral-700 shadow-sm animate-enter transition-all hover:border-blue-200 dark:hover:border-blue-800 group">
          <div className="flex justify-between items-center mb-3">
               <label className="text-xs font-bold text-slate-700 dark:text-neutral-200 uppercase tracking-wide flex items-center gap-2">
                  {label}
               </label>
               {safeFiles.length > 0 && <span className="text-[10px] font-bold text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">{safeFiles.length} Added</span>}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input 
                  type="text" 
                  placeholder={placeholder || `${label} Number`}
                  value={idValue || ''}
                  onChange={(e) => onIdChange(e.target.value)}
                  className="flex-1 min-w-0 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-black dark:border-neutral-600 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all placeholder:text-slate-400 text-slate-700 dark:text-white"
              />
              
              <div className="flex gap-2 shrink-0">
                  <button
                      type="button" 
                      onClick={onCameraCapture}
                      className="flex-1 sm:flex-none w-auto sm:w-11 h-11 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 active:scale-95 transition-all shadow-sm border border-black dark:border-blue-800"
                      title="Camera"
                  >
                      <Camera size={20} />
                  </button>
                  <label className="flex-1 sm:flex-none w-auto sm:w-11 h-11 flex items-center justify-center bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-700 active:scale-95 transition-all shadow-sm border border-black dark:border-neutral-600" title="Upload Document">
                      <Upload size={20} />
                      <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={onFileUpload} />
                  </label>
                  {onExtractText && (
                    <label className="flex-1 sm:flex-none w-auto sm:w-11 h-11 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-800 active:scale-95 transition-all shadow-sm border border-black dark:border-amber-800" title="Extract Text">
                        <ScanText size={20} />
                        <input type="file" accept="image/*" className="hidden" onChange={onExtractText} />
                    </label>
                  )}
              </div>
          </div>

          {safeFiles.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                  {safeFiles.map((file, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => !file.startsWith('data:application/pdf') && onPreview(file)}
                        className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 border-white dark:border-neutral-600 shadow-md snap-start group/file bg-slate-100 dark:bg-neutral-800 ${!file.startsWith('data:application/pdf') ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                      >
                           {file.startsWith('data:application/pdf') ? (
                               <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                  <FileText size={24} />
                                  <span className="text-[9px] font-bold mt-1">PDF</span>
                               </div>
                           ) : (
                               <img src={file} alt="Doc" className="w-full h-full object-cover" />
                           )}
                           
                           <button 
                               onClick={(e) => { e.stopPropagation(); onFileRemove(idx); }}
                               className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full shadow-sm hover:bg-red-600 transition-colors backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover/file:opacity-100"
                           >
                               <X size={10} />
                           </button>
                      </div>
                  ))}
              </div>
          )}
      </div>
  );
}

// Map Controller for Programmatic Updates & Resize Fixes
const MapController = ({ center }: { center: { lat: number, lng: number } }) => {
  const map = useMap();
  
  useEffect(() => {
    // Invalidate size on mount/updates to fix grey tiles in certain layouts
    const timer = setTimeout(() => {
        map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    map.flyTo(center, 15, { animate: true, duration: 1.5 });
  }, [center, map]);
  
  return null;
};

// Map Events Handler (Click to Pin)
const LocationMarker = ({ 
  position, 
  setPosition, 
  onLocationSelect,
  isLocked
}: { 
  position: { lat: number, lng: number }, 
  setPosition: (pos: { lat: number, lng: number }) => void,
  onLocationSelect: (lat: number, lng: number) => void,
  isLocked: boolean
}) => {
  const map = useMapEvents({
    click(e) {
      if (isLocked) return;
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const { lat, lng } = marker.getLatLng();
            setPosition({ lat, lng });
            onLocationSelect(lat, lng);
          }
        },
      }),
      [onLocationSelect, setPosition],
    )

  return <Marker draggable={!isLocked} eventHandlers={eventHandlers} position={position} ref={markerRef} />;
};

const BookingForm: React.FC<BookingFormProps> = ({ cars, initialData, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Booking>>(() => {
    let initialId = initialData?.id;
    if (!initialId && mode === 'new') {
        initialId = generateNextBookingId();
    }
    
    return {
      id: initialId || Date.now().toString(),
      status: mode === 'complete' ? BookingStatus.COMPLETED : BookingStatus.PRE_BOOKING,
      createdAt: Date.now(),
      fastagRecharge: 'Client',
      fastagRechargeAmount: 0,
      advancePayment: 0,
      securityDeposit: 0,
      grossTotal: 0,
      totalPaid: initialData?.totalPaid ?? initialData?.advancePayment ?? 0,
      netBalance: 0,
      remarks: '',
      checkoutKm: 0,
      checkinKm: 0,
      totalKmTravelled: 0,
      aadharCard: [],
      panCard: [],
      drivingLicense: [],
      lightBill: [],
      gasBill: [],
      rentAgreement: [],
      passport: [],
      otherDocs: [],
      houseType: '',
      ...initialData
    };
  });

  const [notification, setNotification] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [showCamera, setShowCamera] = useState(false);
  const [activeCaptureField, setActiveCaptureField] = useState<keyof Booking | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'torch' | 'auto'>('off');
  const [hasTorch, setHasTorch] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);
  
  const [isLocating, setIsLocating] = useState(false);
  const [isLocationLocked, setIsLocationLocked] = useState(false);
  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('street');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);

  const compressImage = (imageSrc: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Set a 15-second timeout for image loading
      const timeout = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        reject(new Error("Image loading timed out. The file might be too large or your connection is slow."));
      }, 15000);

      img.crossOrigin = "anonymous";
      img.src = imageSrc;
      
      img.onload = () => {
        clearTimeout(timeout);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error("Could not initialize image processor (Canvas)."));
            return;
        }
        
        try {
            ctx.drawImage(img, 0, 0, width, height);
            // 0.7 quality is optimal for OCR balance
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            // Basic check for failed canvas export (common on low-memory mobile devices)
            if (compressedDataUrl === 'data:,' || compressedDataUrl.length < 100) {
                reject(new Error("Image processing failed. Your device might be low on memory. Try a smaller photo."));
                return;
            }
            
            resolve(compressedDataUrl);
        } catch (e) {
            reject(new Error("Failed to process image for extraction."));
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to load image. Please ensure it's a valid image file."));
      };
    });
  };

  const handleExtractText = async (imageOverride?: string) => {
    const imageToUse = imageOverride || previewImage;
    if (!imageToUse) {
        setNotification("No image selected for extraction.");
        return;
    }
    
    setIsExtractingText(true);
    setExtractedText(null);
    
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("Gemini API Key is not configured. Please check environment settings.");
        }

        const ai = new GoogleGenAI({ apiKey });
        
        // Compress image for mobile performance
        const compressedImage = await compressImage(imageToUse);

        // Extract base64 data and mime type
        const matches = compressedImage.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error("Image processing resulted in an invalid format.");
        }
        
        const mimeType = matches[1];
        const base64Data = matches[2];

        // Use gemini-3-flash-preview for high-quality text extraction
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", 
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    },
                    {
                        text: "Extract all readable text from this document image. The document may contain Marathi, Hindi, and English text. Preserve original formatting, line breaks, and punctuation. Do not translate. If any word is unclear, mark it as [uncertain]. Return ONLY the extracted text."
                    }
                ]
            }
        });
        
        const text = response.text;
        if (!text || text.trim().length === 0) {
            setExtractedText("No readable text found in this image.");
        } else {
            setExtractedText(text);
        }
    } catch (error: any) {
        console.error("Extraction Error:", error);
        let errorMsg = "Extraction failed.";
        
        if (error.message?.includes("API_KEY_INVALID")) {
            errorMsg = "Invalid API Key configuration.";
        } else if (error.message?.includes("quota")) {
            errorMsg = "API usage limit reached. Please try again later.";
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        setNotification(`⚠️ ${errorMsg}`);
        setTimeout(() => setNotification(''), 6000);
    } finally {
        setIsExtractingText(false);
    }
  };

  const handleFileExtract = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const file = files[0];
        
        // Validation for file type
        if (!file.type.startsWith('image/')) {
            setNotification("Please select a valid image file (JPG, PNG).");
            return;
        }

        // Use URL.createObjectURL for memory efficiency
        const objectUrl = URL.createObjectURL(file);
        setPreviewImage(objectUrl);
        handleExtractText(objectUrl);
        
        // Reset input
        e.target.value = '';
    }
  };

  const handleCopyText = () => {
      if (extractedText) {
          navigator.clipboard.writeText(extractedText);
          setNotification("Text copied to clipboard!");
          setTimeout(() => setNotification(''), 2000);
      }
  };

  // Customer Lookup State
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Booking[]>([]);
  const [showLookupResults, setShowLookupResults] = useState(false);

  // --- Map State ---
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
  const [showMapResults, setShowMapResults] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  
  // Initialize map center from formData or current location
  useEffect(() => {
    if (formData.gpsLocation) {
        const [lat, lng] = formData.gpsLocation.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
            setMapCenter({ lat, lng });
        }
    } else {
        // Auto detect current location on load if not set
        if (navigator.geolocation) {
             navigator.geolocation.getCurrentPosition((position) => {
                 const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                 setMapCenter(pos);
                 handleChange('gpsLocation', `${pos.lat},${pos.lng}`);
             }, () => {
                 // Fallback or ignore
             });
        }
    }
  }, []);

  const handleMyLocation = () => {
    if (isLocationLocked) {
        setNotification('Location is locked');
        setTimeout(() => setNotification(''), 2000);
        return;
    }
    setIsLocating(true);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
            setMapCenter(pos);
            handleChange('gpsLocation', `${pos.lat},${pos.lng}`);
            setIsLocating(false);
        }, () => {
            setIsLocating(false);
            alert("Could not access location");
        });
    }
  };

  const handleMapInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setMapSearchQuery(query);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (query.length < 3) {
        setMapSearchResults([]);
        setShowMapResults(false);
        return;
    }

    setIsSearchingMap(true);
    searchTimeoutRef.current = setTimeout(async () => {
        try {
            // Nominatim requires a User-Agent, but browsers control it. 
            // We add Accept-Language to be polite and explicit.
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`, {
                headers: {
                    'Accept-Language': 'en'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Nominatim error: ${response.statusText}`);
            }

            const data = await response.json();
            setMapSearchResults(data);
            setShowMapResults(true);
        } catch (error) {
            console.warn("Location search failed", error);
            // Ensure UI doesn't stick in loading state
            setMapSearchResults([]);
        } finally {
            setIsSearchingMap(false);
        }
    }, 500);
  };

  const handleSelectMapLocation = (result: any) => {
    if (isLocationLocked) {
        setNotification('Location is locked');
        setTimeout(() => setNotification(''), 2000);
        return;
    }

    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const newPos = { lat, lng };
    
    setMapCenter(newPos);
    handleChange('gpsLocation', `${lat},${lng}`);
    handleChange('address', result.display_name); // Auto-fill address
    
    setMapSearchQuery(result.display_name);
    setShowMapResults(false);
    setMapSearchResults([]);
  };

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    if ((mode === 'new' || mode === 'draft') && isDirty && !isSubmitted) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        saveDraft(formData);
        setIsSaving(false);
        setNotification('Draft auto-saved');
        setTimeout(() => setNotification(''), 2000);
      }, 1000); 
      return () => clearTimeout(timer);
    }
  }, [formData, mode, isDirty, isSubmitted]);

  useEffect(() => {
    return () => {
        if ((mode === 'new' || mode === 'draft') && isDirty && !isSubmitted) {
            saveDraft(formDataRef.current);
        }
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [mode, isDirty, isSubmitted]);

  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.startTime && formData.endTime) {
      const start = new Date(`${formData.startDate}T${formData.startTime}`);
      const end = new Date(`${formData.endDate}T${formData.endTime}`);
      const diffMs = end.getTime() - start.getTime();
      
      if (diffMs > 0) {
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        setFormData(prev => ({
          ...prev,
          totalDays: days,
          totalTime: `${totalHours} Hours`
        }));
      }
    }
  }, [formData.startDate, formData.endDate, formData.startTime, formData.endTime]);

  useEffect(() => {
    if (formData.checkinKm !== undefined && formData.checkoutKm !== undefined) {
      const total = Math.max(0, formData.checkinKm - formData.checkoutKm);
      if (total !== formData.totalKmTravelled) {
        setFormData(prev => ({ ...prev, totalKmTravelled: total }));
      }
    }
  }, [formData.checkinKm, formData.checkoutKm]);

  useEffect(() => {
    const gross = Number(formData.grossTotal) || 0;
    const paid = Number(formData.totalPaid) || 0;
    const net = gross - paid;
    if (net !== formData.netBalance) {
      setFormData(prev => ({ ...prev, netBalance: net }));
    }
  }, [formData.grossTotal, formData.totalPaid]);

  const handleSetCurrentDateTime = (field: 'start' | 'end') => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    setIsDirty(true);
    if (field === 'start') {
        setFormData(prev => ({ ...prev, startDate: dateStr, startTime: timeStr }));
        setNotification('Set pickup to now');
    } else {
        setFormData(prev => ({ ...prev, endDate: dateStr, endTime: timeStr }));
        setNotification('Set return to now');
    }
    setTimeout(() => setNotification(''), 2000);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;
      setSearchTerm(term);
      
      if (term.length > 1) {
          const allBookings = getBookings();
          // Filter unique customers by mobile or name
          const uniqueCustomers = new Map();
          
          allBookings.forEach(b => {
             // Prefer valid mobile numbers as unique keys
             if(b.mobile && !uniqueCustomers.has(b.mobile)) {
                 uniqueCustomers.set(b.mobile, b);
             } else if (b.fullName && !uniqueCustomers.has(b.fullName)) {
                 // Fallback to name if mobile missing (edge case)
                 uniqueCustomers.set(b.fullName, b);
             }
          });
          
          const results = Array.from(uniqueCustomers.values()).filter(c => 
              (c.fullName && c.fullName.toLowerCase().includes(term.toLowerCase())) ||
              (c.mobile && c.mobile.includes(term))
          );
          
          setFilteredCustomers(results.slice(0, 5)); // Limit to 5
          setShowLookupResults(true);
      } else {
          setShowLookupResults(false);
          setFilteredCustomers([]);
      }
  };

  const handleSelectCustomer = (customer: Booking) => {
      setIsDirty(true);
      setFormData(prev => ({
          ...prev,
          fullName: customer.fullName,
          mobile: customer.mobile,
          email: customer.email,
          address: customer.address,
          houseType: customer.houseType,
          clientPhoto: customer.clientPhoto, // Copy photo
          // ID Numbers
          aadharCardId: customer.aadharCardId,
          panCardId: customer.panCardId,
          drivingLicenseId: customer.drivingLicenseId,
          passportId: customer.passportId,
          lightBillId: customer.lightBillId,
          gasBillId: customer.gasBillId,
          rentAgreementId: customer.rentAgreementId,
          otherDocsId: customer.otherDocsId,
          // Document Images (Optional: often useful to keep valid docs)
          aadharCard: customer.aadharCard,
          panCard: customer.panCard,
          drivingLicense: customer.drivingLicense,
          passport: customer.passport,
          lightBill: customer.lightBill,
          gasBill: customer.gasBill,
          rentAgreement: customer.rentAgreement,
          otherDocs: customer.otherDocs
      }));
      
      setSearchTerm('');
      setShowLookupResults(false);
      setNotification(`Loaded details for ${customer.fullName}`);
      setTimeout(() => setNotification(''), 2000);
  };
  
  const initCamera = async (faceMode: 'user' | 'environment') => {
    try {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        const newStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: faceMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 120 }
            } 
        });

        const track = newStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;

        if (capabilities.focusMode) {
            try {
                if (capabilities.focusMode.includes('continuous')) {
                    await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
                } else if (capabilities.focusMode.includes('auto')) {
                    await track.applyConstraints({ advanced: [{ focusMode: 'auto' }] } as any);
                }
            } catch (e) {
                console.warn("Focus setup failed", e);
            }
        }

        let torchSupported = false;
        try {
            if (capabilities.torch) {
                torchSupported = true;
            }
        } catch(e) {
            console.warn("Could not check camera capabilities", e);
        }
        
        setHasTorch(torchSupported);
        if (!torchSupported) {
             setFlashMode('off');
        }

        setStream(newStream);
        if (videoRef.current) {
            videoRef.current.srcObject = newStream;
        }
    } catch (err) {
        console.error("Camera access denied", err);
        alert("Unable to access camera. Please check permissions.");
    }
  };

  const startCamera = async (field: keyof Booking) => {
    setActiveCaptureField(field);
    setShowCamera(true);
    await initCamera(facingMode);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setActiveCaptureField(null);
    setFlashMode('off'); 
    setScreenFlash(false);
  };

  const switchCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    await initCamera(newMode);
  };

  const toggleFlash = async () => {
    if (!stream) return;
    
    const modes: ('off' | 'on' | 'torch' | 'auto')[] = ['off', 'on', 'torch', 'auto'];
    const nextIndex = (modes.indexOf(flashMode) + 1) % modes.length;
    const nextMode = modes[nextIndex];
    setFlashMode(nextMode);

    if (hasTorch) {
        const track = stream.getVideoTracks()[0];
        try {
            if (nextMode === 'torch') {
                await track.applyConstraints({ advanced: [{ torch: true }] } as any);
            } else {
                await track.applyConstraints({ advanced: [{ torch: false }] } as any);
            }
        } catch (e) {
            console.error("Error toggling torch", e);
        }
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && activeCaptureField && stream) {
        if (flashMode === 'on' || flashMode === 'auto') {
            setScreenFlash(true);
            setTimeout(() => setScreenFlash(false), 300); 
        }

        const track = stream.getVideoTracks()[0];
        let didTorch = false;
        if ((flashMode === 'on' || flashMode === 'auto') && hasTorch) {
            try {
                await track.applyConstraints({ advanced: [{ torch: true }] } as any);
                didTorch = true;
                await new Promise(r => setTimeout(r, 400)); 
            } catch (e) {
                console.error("Flash error", e);
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            
            if (didTorch) {
                try {
                     await track.applyConstraints({ advanced: [{ torch: false }] } as any);
                } catch(e) {}
            }

            setIsDirty(true);
            setFormData(prev => {
                if (activeCaptureField === 'clientPhoto') {
                    return { ...prev, [activeCaptureField]: dataUrl };
                } else {
                    const current = prev[activeCaptureField!] as string[] || [];
                    return { ...prev, [activeCaptureField!]: [...current, dataUrl] };
                }
            });
            
            setNotification('Photo captured!');
            setTimeout(() => setNotification(''), 2000);
            stopCamera();
        }
    }
  };

  const handleChange = (field: keyof Booking, value: any) => {
    setIsDirty(true);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: keyof Booking, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsDirty(true);
      Array.from(files).forEach((file: File) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setFormData(prev => {
                if (field === 'clientPhoto') {
                    return { ...prev, [field]: reader.result as string };
                } else {
                    const current = prev[field] as string[] || [];
                    return { ...prev, [field]: [...current, reader.result as string] };
                }
            });
          };
          reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveFile = (field: keyof Booking, index: number) => {
      setIsDirty(true);
      setFormData(prev => {
          const current = prev[field] as string[] || [];
          const updated = current.filter((_, i) => i !== index);
          return { ...prev, [field]: updated };
      });
  };

  const handleClearClientPhoto = () => {
    setIsDirty(true);
    setFormData(prev => ({ ...prev, clientPhoto: undefined }));
  };

  const handleAction = (status: BookingStatus) => {
    // Check for mandatory fields only if not saving as draft
    if (status !== BookingStatus.DRAFT) {
        if (!formData.carId) {
            setNotification('⚠️ Select a car to proceed');
            setTimeout(() => setNotification(''), 3000);
            return;
        }

        if (!formData.clientPhoto) {
            setNotification('⚠️ Client Photo is mandatory');
            setTimeout(() => setNotification(''), 3000);
            return;
        }

        if (!formData.houseType) {
            setNotification('⚠️ Residence Type is mandatory');
            setTimeout(() => setNotification(''), 3000);
            return;
        }
    }

    setIsSubmitted(true);
    const finalData = { ...formData, status } as Booking;
    onSave(finalData);
    if (mode === 'draft' || mode === 'new') {
        clearDraft();
    }
  };

  const handleExportXLSX = () => {
    try {
        const car = cars.find(c => c.id === formData.carId);
        const dataToExport = [{
            'Booking ID': formData.id || 'NEW',
            'Status': formData.status || 'DRAFT',
            'Booking Created At': formData.createdAt ? new Date(formData.createdAt).toLocaleString() : new Date().toLocaleString(),
            // 1. Vehicle Details
            'Vehicle Name': car ? car.name : 'Unknown',
            'Plate Number': car ? car.plateNumber : 'Unknown',
            'Car ID': formData.carId,
            // 2. Location & GPS
            'GPS Location': formData.gpsLocation || '',
            'Address': formData.address,
            // 3. Trip Duration
            'Start Date': formData.startDate,
            'Start Time': formData.startTime,
            'End Date': formData.endDate,
            'End Time': formData.endTime,
            'Total Days': formData.totalDays,
            'Total Time': formData.totalTime || '',
            // 4. Odometer (KM)
            'Checkout KM': formData.checkoutKm,
            'Checkin KM': formData.checkinKm,
            'Total KM': formData.totalKmTravelled,
            // 5. Client Details
            'Full Name': formData.fullName,
            'Mobile': formData.mobile,
            'Email': formData.email || '',
            // 6. Documents
            'Aadhar Card ID': formData.aadharCardId || '',
            'PAN Card ID': formData.panCardId || '',
            'Driving License ID': formData.drivingLicenseId || '',
            'Light Bill ID': formData.lightBillId || '',
            'Gas Bill ID': formData.gasBillId || '',
            'Rent Agreement ID': formData.rentAgreementId || '',
            'Passport ID': formData.passportId || '',
            'Other Docs ID': formData.otherDocsId || '',
            // 7. Residence Type
            'House Type': formData.houseType || '',
            // 8. Payment Details
            'Fastag Recharge': formData.fastagRecharge,
            'Fastag Amount': formData.fastagRechargeAmount || 0,
            'Advance Payment': formData.advancePayment,
            'Security Deposit': formData.securityDeposit,
            'Gross Total': formData.grossTotal,
            'Total Paid': formData.totalPaid,
            'Net Balance': formData.netBalance,
            // 9. Remarks
            'Remarks': formData.remarks
        }];

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Booking_Details");
        
        const fileName = `new_booking_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    } catch (error) {
        console.error("XLSX Export Error:", error);
        alert("Failed to export XLSX. Please try again.");
    }
  };

  const formatAadhar = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const truncated = numbers.slice(0, 12);
    return truncated.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const getFlashIcon = () => {
    switch(flashMode) {
        case 'on': return <Zap size={20} className="text-yellow-400 fill-yellow-400" />;
        case 'torch': return <Sun size={20} className="text-orange-400 fill-orange-400" />;
        case 'auto': return <div className="text-white font-bold text-[10px] border border-white rounded px-1">AUTO</div>;
        default: return <ZapOff size={20} className="text-white/70" />;
    }
  };

  return (
    <div className="pb-24 relative">
       {/* Sticky Header */}
       <div className="relative md:sticky md:top-0 z-30 bg-[#1E1E1E]/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800 p-4 flex justify-between items-center px-4 md:px-6 shadow-sm animate-enter transition-colors rounded-t-3xl md:rounded-none mt-2 md:mt-0">
          <h2 className="text-base md:text-xl font-bold text-white tracking-tight truncate pr-2 flex-1">
            {mode === 'complete' ? 'Complete Trip' : mode === 'edit' ? 'Edit Booking' : 'New Booking'}
          </h2>
          <div className="flex items-center gap-2">
                <button 
                    type="button" 
                    onClick={handleExportXLSX}
                    className="p-2 bg-white/10 dark:bg-neutral-800 rounded-lg text-white hover:bg-white/20 transition-colors active:scale-95 flex items-center gap-2 text-xs font-bold"
                    title="Export as XLSX"
                >
                    <Download size={16} /> <span className="hidden sm:inline">Export XLSX</span>
                </button>
                <button type="button" onClick={onCancel} className="p-2 bg-slate-200/50 dark:bg-neutral-800 rounded-full text-slate-600 dark:text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors active:scale-95 shrink-0 ml-2">
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
          </div>
       </div>

       {/* Camera Modal - Floating Card */}
       {showCamera && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4 sm:p-8">
           <div className="pointer-events-auto w-full max-w-md bg-black/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 flex flex-col h-[85vh] relative animate-enter">
               <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-75 z-50 ${screenFlash ? 'opacity-100' : 'opacity-0'}`}></div>

               <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                  <div className="flex gap-4">
                      <button 
                        onClick={toggleFlash}
                        className="bg-black/40 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform border border-white/10"
                      >
                            {getFlashIcon()}
                      </button>
                  </div>
                  <span className="text-white/90 font-bold text-sm tracking-widest uppercase drop-shadow-md">Photo</span>
                  <button 
                    onClick={stopCamera}
                    className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white active:scale-90 transition-transform hover:bg-red-500/50"
                  >
                    <X size={24} />
                  </button>
               </div>
               
               <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className={`w-full h-full object-cover transition-transform duration-500 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  />
                  <div className="absolute inset-0 pointer-events-none opacity-20">
                     <div className="w-full h-full border-2 border-white/20 grid grid-cols-3 grid-rows-3">
                        <div className="border-r border-b border-white/20"></div>
                        <div className="border-r border-b border-white/20"></div>
                        <div className="border-b border-white/20"></div>
                        <div className="border-r border-b border-white/20"></div>
                        <div className="border-r border-b border-white/20"></div>
                        <div className="border-b border-white/20"></div>
                        <div className="border-r border-white/20"></div>
                        <div className="border-r border-white/20"></div>
                        <div></div>
                     </div>
                  </div>
               </div>

               <div className="h-32 bg-black/90 backdrop-blur-sm flex items-center justify-around pb-4 pt-4 px-6">
                  <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20"></div>
                  <button 
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full bg-white border-4 border-slate-300 flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  >
                     <div className="w-16 h-16 rounded-full bg-white border-[3px] border-slate-900" />
                  </button>
                  <button 
                     onClick={switchCamera}
                     className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all active:rotate-180"
                  >
                     <RefreshCw size={20} />
                  </button>
               </div>
           </div>
        </div>
       )}

       {/* Preview Modal */}
       {previewImage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-enter" onClick={() => { setPreviewImage(null); setExtractedText(null); }}>
            <div className="relative max-w-6xl w-full flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-center" onClick={e => e.stopPropagation()}>
                
                {/* Close Button - Mobile (Inside) / Desktop (Outside) */}
                <button 
                    onClick={() => { setPreviewImage(null); setExtractedText(null); }}
                    className="absolute top-2 right-2 md:-top-12 md:right-0 p-2 bg-black/50 md:bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors active:scale-95 z-[60]"
                >
                    <X size={24} />
                </button>
                
                <div className={`relative transition-all duration-300 bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl ${extractedText ? 'w-full md:w-1/2 h-[40vh] md:h-[80vh]' : 'w-full h-[60vh] md:h-[80vh]'}`}>
                    <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
                    
                    {!extractedText && (
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center pb-8">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleExtractText();
                                }}
                                disabled={isExtractingText}
                                className="bg-white text-black px-8 py-4 rounded-full font-bold shadow-xl hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed z-50 text-sm md:text-base"
                            >
                                {isExtractingText ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" /> Extracting...
                                    </>
                                ) : (
                                    <>
                                        <ScanText size={20} /> Extract Text
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {extractedText && (
                    <div className="w-full md:w-1/2 h-[40vh] md:h-[80vh] bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-slide-up">
                        <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center bg-slate-50/50 dark:bg-neutral-800/50 backdrop-blur-sm">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FileText size={18} className="text-blue-500" /> Extracted Text
                            </h3>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleCopyText}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-lg text-slate-600 dark:text-neutral-400 transition-colors"
                                    title="Copy to Clipboard"
                                >
                                    <Copy size={18} />
                                </button>
                                <button 
                                    onClick={() => setExtractedText(null)}
                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"
                                    title="Close Text View"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-neutral-950 font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap select-text">
                            {extractedText}
                        </div>
                    </div>
                )}
            </div>
        </div>
       )}

       {(notification || isSaving) && (
         <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-slate-900/95 dark:bg-neutral-900/95 backdrop-blur text-white px-5 py-3 rounded-full text-sm font-medium z-50 shadow-xl flex items-center gap-3 transition-all duration-300 border border-slate-700 animate-scale-in">
           {isSaving ? (
             <>
                <Loader2 className="animate-spin text-blue-400" size={18} />
                <span>Saving draft...</span>
             </>
           ) : (
             <>
                <CheckCircle size={18} className="text-emerald-400" />
                <span>{notification}</span>
             </>
           )}
         </div>
       )}

       <div className="px-5 mt-5">
        
        {/* Customer Lookup Section */}
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md p-5 rounded-3xl shadow-md border border-black dark:border-crm-border mb-5 animate-enter relative z-30">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-4 border-b border-black dark:border-crm-border pb-3">
                <div className="bg-slate-100 dark:bg-neutral-800 p-1.5 rounded-lg text-slate-700 dark:text-neutral-300">
                    <Users size={16} /> 
                </div>
                Customer Lookup
            </h3>
            
            <div className="relative z-50">
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search by name or mobile to auto-fill..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-neutral-800 border border-black dark:border-neutral-700 rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-neutral-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all text-slate-800 dark:text-white font-medium"
                    />
                     {searchTerm && (
                        <button 
                            onClick={() => { setSearchTerm(''); setShowLookupResults(false); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {showLookupResults && filteredCustomers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-slate-200 dark:border-neutral-700 overflow-hidden animate-scale-in">
                        {filteredCustomers.map(customer => (
                            <div 
                                key={customer.id}
                                onClick={() => handleSelectCustomer(customer)}
                                className="p-3 border-b border-slate-100 dark:border-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer flex items-center gap-3 transition-colors last:border-0"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden border border-slate-200 dark:border-neutral-700 shrink-0">
                                    {customer.clientPhoto ? (
                                        <img src={customer.clientPhoto} className="w-full h-full object-cover" alt="client"/>
                                    ) : (
                                        <User size={20} className="w-full h-full p-2 text-slate-400"/>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate">{customer.fullName}</h4>
                                    <p className="text-xs text-slate-500 dark:text-neutral-400">{customer.mobile}</p>
                                </div>
                                <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-[10px] font-bold px-2 py-1 rounded">
                                    SELECT
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <Section title="Client Photo" icon={User} className="delay-75">
            <div className="col-span-1 md:col-span-2">
                <ClientPhotoUpload 
                    value={formData.clientPhoto}
                    onCapture={() => startCamera('clientPhoto')}
                    onUpload={(e: any) => handleFileUpload('clientPhoto', e)}
                    onClear={handleClearClientPhoto}
                />
            </div>
        </Section>

        <Section title="Vehicle Details" icon={CarIcon} className="delay-100">
            <div className="col-span-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 mb-2 block ml-1">
                Select Car <span className="text-red-500">*</span>
            </label>
            <select 
                className={`w-full p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border ${!formData.carId && isSubmitted ? 'border-red-500' : 'border-black dark:border-neutral-700'} outline-none font-medium text-slate-700 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all`}
                value={formData.carId}
                onChange={(e) => {
                    const car = cars.find(c => c.id === e.target.value);
                    handleChange('carId', e.target.value);
                    if(car && mode === 'new') handleChange('checkoutKm', car.currentKm);
                }}
            >
                <option value="">-- Choose Car --</option>
                {cars.map(c => <option key={c.id} value={c.id}>{c.name} - {c.plateNumber}</option>)}
            </select>
            </div>
        </Section>
        
        <Section title="Location & GPS" icon={MapPin} className="delay-150">
            <div className="col-span-1 md:col-span-2">
                <div className="relative group rounded-2xl overflow-hidden shadow-sm border border-black dark:border-neutral-700 h-[400px]">
                    <MapContainer 
                        center={mapCenter} 
                        zoom={15} 
                        style={{ height: '100%', width: '100%', zIndex: 0 }}
                        attributionControl={false}
                    >
                        {mapMode === 'street' ? (
                             <TileLayer
                                key="street-layer"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                        ) : (
                             <TileLayer
                                key="satellite-layer"
                                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            />
                        )}
                        <MapController center={mapCenter} />
                        <LocationMarker 
                            position={mapCenter} 
                            setPosition={setMapCenter}
                            onLocationSelect={(lat, lng) => handleChange('gpsLocation', `${lat},${lng}`)}
                            isLocked={isLocationLocked}
                        />
                    </MapContainer>

                    {/* Search Box Overlay */}
                    <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col gap-1">
                        <div className="relative shadow-lg rounded-xl bg-white dark:bg-neutral-900 border border-transparent focus-within:border-blue-500 transition-all flex items-center">
                             <input
                                 type="text"
                                 value={mapSearchQuery}
                                 onChange={handleMapInputChange}
                                 placeholder="Search location..."
                                 disabled={isLocationLocked}
                                 className="w-full pl-4 pr-10 py-3 bg-transparent outline-none text-sm font-medium text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
                             />
                             <div className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-slate-400">
                                {isSearchingMap ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                             </div>
                        </div>
                        
                        {/* Suggestions Dropdown */}
                        {showMapResults && mapSearchResults.length > 0 && (
                            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-slate-200 dark:border-neutral-800 overflow-hidden max-h-60 overflow-y-auto animate-enter">
                                {mapSearchResults.map((result, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSelectMapLocation(result)}
                                        className="w-full text-left px-4 py-3 text-xs border-b border-slate-100 dark:border-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-neutral-300 last:border-0 transition-colors flex items-start gap-2 group/item"
                                    >
                                        <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400 group-hover/item:text-blue-500 transition-colors" />
                                        <span className="line-clamp-2">{result.display_name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Layer Switch Button */}
                    <button
                        type="button"
                        onClick={() => setMapMode(prev => prev === 'street' ? 'satellite' : 'street')}
                        className="absolute bottom-34 right-3 w-12 h-12 bg-white dark:bg-neutral-800 text-slate-700 dark:text-white flex items-center justify-center rounded-full shadow-lg active:scale-95 transition-all z-[1000] border-2 border-white dark:border-neutral-700"
                        title="Switch Map Mode"
                    >
                        {mapMode === 'street' ? <Satellite size={20} /> : <Layers size={20} />}
                    </button>

                    {/* Lock Location Button */}
                    <button
                        type="button"
                        onClick={() => setIsLocationLocked(!isLocationLocked)}
                        className={`absolute bottom-20 right-3 w-12 h-12 flex items-center justify-center rounded-full shadow-lg active:scale-95 transition-all z-[1000] border-2 ${isLocationLocked ? 'bg-red-500 text-white border-red-600' : 'bg-white dark:bg-neutral-800 text-slate-700 dark:text-white border-white dark:border-neutral-700'}`}
                        title={isLocationLocked ? "Unlock Location" : "Lock Location"}
                    >
                        {isLocationLocked ? <Lock size={20} /> : <Unlock size={20} />}
                    </button>

                    {/* My Location Button */}
                    <button
                        type="button"
                        onClick={handleMyLocation}
                        className="absolute bottom-6 right-3 w-12 h-12 bg-blue-600 text-white flex items-center justify-center rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all z-[1000] border-2 border-white dark:border-neutral-800"
                        title="My Location"
                    >
                        {isLocating ? <Loader2 size={24} className="animate-spin" /> : <Locate size={24} />}
                    </button>

                     {/* Location Data Overlay */}
                     <div className="absolute bottom-6 left-3 bg-white/90 dark:bg-black/80 backdrop-blur px-3 py-1.5 rounded-lg border border-white/20 dark:border-white/10 text-[10px] font-mono text-slate-600 dark:text-neutral-400 shadow-sm z-[1000] pointer-events-none">
                        {mapCenter.lat.toFixed(6)}, {mapCenter.lng.toFixed(6)}
                    </div>
                </div>
            </div>
        </Section>

        <Section title="Trip Duration" icon={Calendar} className="delay-150">
            <div className="col-span-1 md:col-span-2">
                <Input 
                    label="Booking Created At" 
                    readOnly 
                    value={new Date(formData.createdAt || Date.now()).toLocaleString()} 
                    onChange={() => {}}
                    icon={Calendar}
                />
            </div>
            <Input label="Start Date" type="date" value={formData.startDate} onChange={(v:any) => handleChange('startDate', v)} action="Now" onAction={() => handleSetCurrentDateTime('start')} icon={Calendar} />
            <Input label="Start Time" type="time" value={formData.startTime} onChange={(v:any) => handleChange('startTime', v)} action="Now" onAction={() => handleSetCurrentDateTime('start')} icon={Clock} />
            <Input label="End Date" type="date" value={formData.endDate} onChange={(v:any) => handleChange('endDate', v)} action="Now" onAction={() => handleSetCurrentDateTime('end')} icon={Calendar} />
            <Input label="End Time" type="time" value={formData.endTime} onChange={(v:any) => handleChange('endTime', v)} action="Now" onAction={() => handleSetCurrentDateTime('end')} icon={Clock} />
            <Input label="Total Days" readOnly value={formData.totalDays} onChange={() => {}} icon={Clock} />
            <Input label="Total Time" readOnly value={formData.totalTime} onChange={() => {}} icon={Clock} />
        </Section>

        <Section title="Odometer (KM)" icon={Clock} className="delay-200">
            <Input label="Checkout KM" type="number" value={formData.checkoutKm} onChange={(v:any) => handleChange('checkoutKm', Number(v))} icon={CarIcon} />
            <Input label="Check-in KM" type="number" value={formData.checkinKm} onChange={(v:any) => handleChange('checkinKm', Number(v))} icon={CarIcon} />
            <Input label="Total KM" readOnly value={formData.totalKmTravelled} onChange={() => {}} icon={CarIcon} />
        </Section>

        <Section title="Client Details" icon={User} className="delay-300">
            <Input label="Full Name" value={formData.fullName} onChange={(v:any) => handleChange('fullName', v)} icon={User} />
            <Input label="Mobile" type="tel" value={formData.mobile} onChange={(v:any) => handleChange('mobile', v)} icon={Phone} />
            <Input label="Email" type="email" value={formData.email} onChange={(v:any) => handleChange('email', v)} icon={Mail} />
            <div className="col-span-1 md:col-span-2">
                <Input label="Address" value={formData.address} onChange={(v:any) => handleChange('address', v)} icon={MapPin} />
            </div>
        </Section>

        <Section title="Documents" icon={Upload} className="delay-400">
            <div className="col-span-1 md:col-span-2 space-y-3">
                <DocumentRow 
                    label="Aadhar Card" 
                    placeholder="XXXX XXXX XXXX"
                    idValue={formData.aadharCardId as string} 
                    files={formData.aadharCard as string[]} 
                    onIdChange={(v) => handleChange('aadharCardId', formatAadhar(v))}
                    onFileUpload={(e) => handleFileUpload('aadharCard', e)}
                    onCameraCapture={() => startCamera('aadharCard')}
                    onFileRemove={(i) => handleRemoveFile('aadharCard', i)}
                    onPreview={setPreviewImage}
                    onExtractText={handleFileExtract}
                />
                <DocumentRow 
                    label="PAN Card" 
                    placeholder="ABCDE1234F"
                    idValue={formData.panCardId as string} 
                    files={formData.panCard as string[]} 
                    onIdChange={(v) => handleChange('panCardId', v)}
                    onFileUpload={(e) => handleFileUpload('panCard', e)}
                    onCameraCapture={() => startCamera('panCard')}
                    onFileRemove={(i) => handleRemoveFile('panCard', i)}
                    onPreview={setPreviewImage}
                    onExtractText={handleFileExtract}
                />
                <DocumentRow 
                    label="Driving License" 
                    placeholder="MH01 20200001234"
                    idValue={formData.drivingLicenseId as string}
                    files={formData.drivingLicense as string[]} 
                    onIdChange={(v) => handleChange('drivingLicenseId', v)}
                    onFileUpload={(e) => handleFileUpload('drivingLicense', e)}
                    onCameraCapture={() => startCamera('drivingLicense')}
                    onFileRemove={(i) => handleRemoveFile('drivingLicense', i)}
                    onPreview={setPreviewImage}
                    onExtractText={handleFileExtract}
                />
                <DocumentRow 
                    label="Light Bill" 
                    idValue={formData.lightBillId as string}
                    files={formData.lightBill as string[]} 
                    onIdChange={(v) => handleChange('lightBillId', v)}
                    onFileUpload={(e) => handleFileUpload('lightBill', e)}
                    onCameraCapture={() => startCamera('lightBill')}
                    onFileRemove={(i) => handleRemoveFile('lightBill', i)}
                    onPreview={setPreviewImage}
                    onExtractText={handleFileExtract}
                />
                 <DocumentRow 
                    label="Gas Bill" 
                    idValue={formData.gasBillId as string}
                    files={formData.gasBill as string[]} 
                    onIdChange={(v) => handleChange('gasBillId', v)}
                    onFileUpload={(e) => handleFileUpload('gasBill', e)}
                    onCameraCapture={() => startCamera('gasBill')}
                    onFileRemove={(i) => handleRemoveFile('gasBill', i)}
                    onPreview={setPreviewImage}
                    onExtractText={handleFileExtract}
                />
                 <DocumentRow 
                    label="Rent Agreement" 
                    idValue={formData.rentAgreementId as string}
                    files={formData.rentAgreement as string[]} 
                    onIdChange={(v) => handleChange('rentAgreementId', v)}
                    onFileUpload={(e) => handleFileUpload('rentAgreement', e)}
                    onCameraCapture={() => startCamera('rentAgreement')}
                    onFileRemove={(i) => handleRemoveFile('rentAgreement', i)}
                    onPreview={setPreviewImage}
                    onExtractText={handleFileExtract}
                />
                 <DocumentRow 
                    label="Passport" 
                    idValue={formData.passportId as string}
                    files={formData.passport as string[]} 
                    onIdChange={(v) => handleChange('passportId', v)}
                    onFileUpload={(e) => handleFileUpload('passport', e)}
                    onCameraCapture={() => startCamera('passport')}
                    onFileRemove={(i) => handleRemoveFile('passport', i)}
                    onPreview={setPreviewImage}
                    onExtractText={handleFileExtract}
                />
                <DocumentRow 
                    label="Other Docs" 
                    idValue={formData.otherDocsId as string}
                    files={formData.otherDocs as string[]} 
                    onIdChange={(v) => handleChange('otherDocsId', v)}
                    onFileUpload={(e) => handleFileUpload('otherDocs', e)}
                    onCameraCapture={() => startCamera('otherDocs')}
                    onFileRemove={(i) => handleRemoveFile('otherDocs', i)}
                    onPreview={setPreviewImage}
                    onExtractText={handleFileExtract}
                />
                
                {/* House Type Dropdown Added Here */}
                <div className="bg-slate-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-black dark:border-neutral-700 shadow-sm animate-enter transition-all hover:border-blue-200 dark:hover:border-blue-800">
                    <label className="text-xs font-bold text-slate-700 dark:text-neutral-200 uppercase tracking-wide flex items-center gap-2 mb-3">
                       <Home size={16} className="text-blue-500" /> Residence Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.houseType || ''}
                        onChange={(e) => handleChange('houseType', e.target.value)}
                        className={`w-full p-3 bg-white dark:bg-neutral-900 rounded-xl border ${!formData.houseType && isSubmitted ? 'border-red-500' : 'border-black dark:border-neutral-600'} text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all text-slate-700 dark:text-white`}
                    >
                        <option value="">-- Select Residence Type --</option>
                        <option value="Owned House">Owned House</option>
                        <option value="Rented House">Rented House</option>
                    </select>
                </div>
            </div>
        </Section>

        <Section title="Payment Details" icon={CreditCard} className="delay-500">
             <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="col-span-1 sm:col-span-2">
                     <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 mb-2 block ml-1">Fastag Recharge By</label>
                     <select
                        value={formData.fastagRecharge || 'Client'}
                        onChange={(e) => handleChange('fastagRecharge', e.target.value)}
                        className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-black dark:border-neutral-700 outline-none font-medium text-slate-700 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all"
                     >
                        <option value="Client">Client</option>
                        <option value="Vehicle Owner">Vehicle Owner</option>
                     </select>
                 </div>
                 
                 <div className="col-span-1 sm:col-span-2">
                    <Input label="Fastag Amount" type="number" value={formData.fastagRechargeAmount} onChange={(v:any) => handleChange('fastagRechargeAmount', Number(v))} icon={IndianRupee} />
                 </div>

                 <Input label="Advance Payment" type="number" value={formData.advancePayment} onChange={(v:any) => handleChange('advancePayment', Number(v))} icon={IndianRupee} />
                 <Input label="Security Deposit" type="number" value={formData.securityDeposit} onChange={(v:any) => handleChange('securityDeposit', Number(v))} icon={IndianRupee} />
                 <Input label="Gross Total" type="number" value={formData.grossTotal} onChange={(v:any) => handleChange('grossTotal', Number(v))} icon={IndianRupee} />
                 <Input label="Total Paid" type="number" value={formData.totalPaid} onChange={(v:any) => handleChange('totalPaid', Number(v))} icon={IndianRupee} />
                 
                 <div className="col-span-1 sm:col-span-2 bg-slate-100 dark:bg-neutral-800 p-4 rounded-2xl border border-black dark:border-neutral-700 flex justify-between items-center">
                     <span className="text-sm font-bold text-slate-600 dark:text-neutral-300 uppercase">Net Balance</span>
                     <span className={`text-xl font-extrabold ${(formData.netBalance || 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        ₹{formData.netBalance?.toLocaleString() || 0}
                     </span>
                 </div>
             </div>
        </Section>

        <Section title="Remarks" icon={FileEdit} className="delay-600">
             <div className="col-span-1 md:col-span-2">
                <textarea 
                    placeholder="Any additional notes about the trip or vehicle condition..."
                    className="w-full p-4 bg-slate-50 dark:bg-neutral-800 rounded-xl border border-black dark:border-neutral-700 outline-none text-sm min-h-[100px] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    value={formData.remarks}
                    onChange={(e) => handleChange('remarks', e.target.value)}
                ></textarea>
             </div>
        </Section>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-8 mb-6 animate-enter delay-700">
             <button 
                type="button"
                onClick={onCancel}
                className="col-span-1 py-3 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors active:scale-95"
             >
                Cancel
             </button>

             {mode === 'edit' && initialData?.status === BookingStatus.COMPLETED ? (
                 <button 
                    type="button"
                    onClick={() => handleAction(BookingStatus.COMPLETED)}
                    className="col-span-1 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-blue-700"
                 >
                    <FileEdit size={18} /> Update Booking
                 </button>
             ) : (
                 <>
                     <button 
                        type="button"
                        onClick={() => handleAction(BookingStatus.DRAFT)}
                        className="col-span-1 py-3 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-bold rounded-2xl hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-colors active:scale-95 flex items-center justify-center gap-2 border border-amber-200 dark:border-amber-800"
                     >
                        <FileEdit size={18} /> Save Draft
                     </button>

                     <button 
                        type="button"
                        onClick={() => handleAction(BookingStatus.PRE_BOOKING)}
                        className="col-span-2 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-blue-700"
                     >
                        <Clock size={20} /> {mode === 'edit' ? 'Update Pre-Booking' : 'Save as Pre-Booking'}
                     </button>

                     <button 
                        type="button"
                        onClick={() => handleAction(BookingStatus.COMPLETED)}
                        className="col-span-2 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-emerald-700"
                     >
                        <CheckCircle size={20} /> {mode === 'edit' ? 'Update & Complete' : 'Save as Completed'}
                     </button>
                 </>
             )}
        </div>

       </div>
    </div>
  );
};

export default BookingForm;