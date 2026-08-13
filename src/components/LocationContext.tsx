'use client';

import React, { createContext, useContext, useSyncExternalStore, ReactNode } from 'react';

interface Location {
  city: string;
  country: string;
  region?: string;
  countryId?: string;
}

interface LocationContextType {
  location: Location;
  setLocation: (loc: Location) => void;
}

const DEFAULT_LOCATION: Location = { city: 'All', country: 'All' };
const LOCATION_EVENT = 'mcs_location_change';
let cachedRaw: string | null | undefined;
let cachedLocation: Location = DEFAULT_LOCATION;

function getLocationSnapshot(): Location {
  try {
    const raw = localStorage.getItem('mcs_location');
    if (raw === cachedRaw) return cachedLocation;
    cachedRaw = raw;
    cachedLocation = raw ? JSON.parse(raw) as Location : DEFAULT_LOCATION;
    return cachedLocation;
  } catch {
    return DEFAULT_LOCATION;
  }
}

function subscribeToLocation(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(LOCATION_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(LOCATION_EVENT, callback);
  };
}

function persistLocation(loc: Location) {
  try {
    const raw = JSON.stringify(loc);
    localStorage.setItem('mcs_location', raw);
    document.cookie = `mcs_country=${encodeURIComponent(loc.country)}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = 'mcs_country_id=' + encodeURIComponent(loc.countryId || '') + '; path=/; max-age=31536000; SameSite=Lax';
    cachedRaw = raw;
    cachedLocation = loc;
    window.dispatchEvent(new Event(LOCATION_EVENT));
  } catch {}
}

const LocationContext = createContext<LocationContextType>({
  location: DEFAULT_LOCATION,
  setLocation: persistLocation,
});

export function LocationProvider({ children }: { children: ReactNode }) {
  const location = useSyncExternalStore(
    subscribeToLocation,
    getLocationSnapshot,
    () => DEFAULT_LOCATION,
  );

  return (
    <LocationContext.Provider value={{ location, setLocation: persistLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}