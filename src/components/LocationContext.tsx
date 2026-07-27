'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Location {
  city: string;
  country: string;
  region?: string;
}

interface LocationContextType {
  location: Location;
  setLocation: (loc: Location) => void;
}

const DEFAULT_LOCATION: Location = { city: 'Boston', country: 'USA', region: 'MA' };

const LocationContext = createContext<LocationContextType>({
  location: DEFAULT_LOCATION,
  setLocation: () => {},
});

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<Location>(DEFAULT_LOCATION);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mcs_location');
      if (saved) setLocationState(JSON.parse(saved));
    } catch {}
  }, []);

  const setLocation = (loc: Location) => {
    setLocationState(loc);
    try { localStorage.setItem('mcs_location', JSON.stringify(loc)); } catch {}
  };

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
