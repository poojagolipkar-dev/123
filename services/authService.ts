
const CREDENTIALS_KEY = 'shree_crm_credentials';
const SESSION_KEY = 'shree_crm_session';
export const RECOVERY_EMAIL = 'shreeselfdriving@gmail.com';
const RECOVERY_KEY = 'SHREE-RECOVER-2026'; // Hardcoded recovery key for the CRM

// Initialize with default credentials if none exist
export const initAuth = () => {
  if (!localStorage.getItem(CREDENTIALS_KEY)) {
    const defaultCreds = { username: 'admin', password: 'admin' };
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(defaultCreds));
  }
};

export const login = (u: string, p: string, remember: boolean) => {
  initAuth(); // Ensure credentials exist
  const stored = localStorage.getItem(CREDENTIALS_KEY);
  if (!stored) return false;
  
  const creds = JSON.parse(stored);
  if (u === creds.username && p === creds.password) {
    const sessionData = JSON.stringify({ loggedIn: true, username: u, timestamp: Date.now() });
    
    if (remember) {
      localStorage.setItem(SESSION_KEY, sessionData);
    } else {
      sessionStorage.setItem(SESSION_KEY, sessionData);
    }
    return true;
  }
  return false;
};

export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
};

export const isAuthenticated = () => {
  return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
};

export const setPin = (pin: string) => {
  localStorage.setItem('shree_pin', pin);
};

export const getPin = (): string | null => {
  return localStorage.getItem('shree_pin');
};

export const verifyPin = (pin: string): boolean => {
  return localStorage.getItem('shree_pin') === pin;
};

export const removePin = () => {
  localStorage.removeItem('shree_pin');
};

export const isAppLocked = (): boolean => {
    return localStorage.getItem('shree_locked') === 'true';
};

export const setAppLocked = (locked: boolean) => {
    if (locked) {
        localStorage.setItem('shree_locked', 'true');
    } else {
        localStorage.removeItem('shree_locked');
    }
};

export const getCredentials = () => {
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    return stored ? JSON.parse(stored) : { username: 'admin', password: 'admin' };
};

export const updateCredentials = (u: string, p: string) => {
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ username: u, password: p }));
  // Update active session if username changed
  const session = isAuthenticated();
  if (session) {
      const sessData = JSON.parse(session);
      sessData.username = u;
      const key = localStorage.getItem(SESSION_KEY) ? SESSION_KEY : SESSION_KEY;
      if (localStorage.getItem(SESSION_KEY)) localStorage.setItem(SESSION_KEY, JSON.stringify(sessData));
      else sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessData));
  }
};

export const resetCredentials = () => {
    const defaultCreds = { username: 'admin', password: 'admin' };
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(defaultCreds));
};

export const verifyRecoveryKey = (key: string): boolean => {
    return key.toUpperCase() === RECOVERY_KEY;
};

export const verifyPassword = (password: string): boolean => {
    const creds = getCredentials();
    return creds.password === password;
};

// --- WebAuthn Helpers ---

const bufferToBase64 = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

const base64ToBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

export const authenticateWithBiometrics = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) {
        console.warn("WebAuthn not supported");
        return false;
    }

    const storedCredentialId = localStorage.getItem('shree_biometric_id');
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    try {
        if (storedCredentialId) {
            // Authenticate existing credential
            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    timeout: 60000,
                    userVerification: 'required',
                    allowCredentials: [{
                        type: 'public-key',
                        id: base64ToBuffer(storedCredentialId),
                        transports: ['internal']
                    }]
                }
            });
            return !!assertion;
        } else {
            // Register new credential (first time use)
            // Note: In a real app, this should probably be explicit in settings, 
            // but for this demo we'll create it on first successful use to enable the feature.
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { 
                        name: "Shree CRM", 
                        // Use current hostname, handling potential port numbers or subdomains
                        id: window.location.hostname 
                    },
                    user: {
                        id: new Uint8Array(16), // Random ID
                        name: "admin",
                        displayName: "Admin User"
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: "public-key" }, // ES256
                        { alg: -257, type: "public-key" } // RS256
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required",
                        requireResidentKey: false
                    },
                    timeout: 60000,
                    attestation: "none"
                }
            }) as PublicKeyCredential;
            
            if (credential) {
                localStorage.setItem('shree_biometric_id', bufferToBase64(credential.rawId));
                return true;
            }
        }
    } catch (error) {
        console.error("Biometric authentication failed or cancelled:", error);
        return false;
    }
    return false;
};
