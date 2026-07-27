'use client';

import React from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { Mandal } from '@/data/mandals';
import { C } from '@/lib/tokens';
import { useRouter } from 'next/navigation';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

interface Props {
  mandals: Mandal[];
}

// Very basic geocoding approximation for major cities just to plot them nicely on world map
const cityCoordinates: Record<string, [number, number]> = {
  'Boston': [-71.0589, 42.3601],
  'Mumbai': [72.8777, 19.0760],
  'London': [-0.1276, 51.5074],
  'Sydney': [151.2093, -33.8688],
  'Dubai': [55.2708, 25.2048],
  'Pune': [73.8567, 18.5204],
  'San Francisco': [-122.4194, 37.7749],
  'Toronto': [-79.3832, 43.6532],
  'Singapore': [103.8198, 1.3521],
};

export default function MandalMap({ mandals }: Props) {
  const router = useRouter();

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ComposableMap
        projectionConfig={{ scale: 140 }}
        width={800}
        height={400}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="rgba(120,86,36,0.1)"
                stroke="#fff"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none', fill: "rgba(120,86,36,0.2)" },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>
        {mandals.map((m) => {
          const coords = cityCoordinates[m.city];
          if (!coords) return null;
          return (
            <Marker 
              key={m.code} 
              coordinates={coords} 
              onClick={() => router.push(`/mandals/${m.code}`)}
              style={{
                default: { cursor: 'pointer' },
                hover: { cursor: 'pointer' },
                pressed: { cursor: 'pointer' },
              }}
            >
              <circle r={4} fill={C.saffron} stroke="#fff" strokeWidth={1.5} />
              <text
                textAnchor="middle"
                y={-8}
                style={{ fontFamily: 'inherit', fontSize: 8, fill: C.ink, fontWeight: 600, pointerEvents: 'none' }}
              >
                {m.name}
              </text>
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
}
