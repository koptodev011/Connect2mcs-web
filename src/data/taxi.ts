import type { Tone } from '@/lib/tokens';

export interface TaxiDriver {
  id: string;
  name: string;
  city: string;
  areas: string;
  vehicle: string;
  type: string;
  langs: string[];
  rate: string;
  base: string;
  rating: number;
  trips: number;
  available: boolean;
  mandal: string;
  tone: Tone;
  since: string;
  note: string;
}

export const taxiCities = ['All cities', 'Boston, MA', 'Edison, NJ', 'Toronto', 'London', 'Sydney', 'Dubai'];

export const taxiSuggestions = ['Logan Airport', 'Harvard Square', 'Downtown Boston', 'MIT Campus', 'South Station', 'Fenway Park'];

export const drivers: TaxiDriver[] = [
  {
    id: 'rajesh',   name: 'Rajesh Kulkarni',  city: 'Boston, MA',
    areas: 'Boston · Cambridge · Logan Airport',
    vehicle: 'Toyota Camry 2022',      type: 'Sedan',
    langs: ['मराठी', 'English', 'हिंदी'],
    rate: '$2.50/mi', base: '$5 base', rating: 4.9, trips: 1240,
    available: true, mandal: 'Boston MM', tone: 'saffron', since: '2021',
    note: 'Airport pickups speciality. WhatsApp preferred.',
  },
  {
    id: 'sunil',    name: 'Sunil Deshmukh',   city: 'Edison, NJ',
    areas: 'Edison · Newark · JFK · EWR',
    vehicle: 'Honda Pilot 2021',        type: 'SUV',
    langs: ['मराठी', 'English'],
    rate: '$3.00/mi', base: '$8 base', rating: 4.8, trips: 876,
    available: true, mandal: 'BMM NJ', tone: 'brick', since: '2019',
    note: 'Group travel welcome. Infant seat available.',
  },
  {
    id: 'anil',     name: 'Anil Joshi',       city: 'Boston, MA',
    areas: 'Boston · Brookline · Quincy · Providence',
    vehicle: 'Chrysler Pacifica 2023',  type: 'Minivan',
    langs: ['मराठी', 'English'],
    rate: '$3.50/mi', base: '$8 base', rating: 4.7, trips: 542,
    available: false, mandal: 'Boston MM', tone: 'green', since: '2022',
    note: 'Family van — up to 6 passengers.',
  },
  {
    id: 'vivek',    name: 'Vivek Apte',       city: 'Toronto',
    areas: 'Toronto · Mississauga · Pearson Airport · Hamilton',
    vehicle: 'Toyota Corolla 2023',    type: 'Sedan',
    langs: ['मराठी', 'English', 'Gujarati'],
    rate: 'C$2.80/mi', base: 'C$6 base', rating: 4.9, trips: 2104,
    available: true, mandal: 'MMT', tone: 'blue', since: '2018',
    note: 'Pre-book recommended for airport runs.',
  },
  {
    id: 'prashant', name: 'Prashant Gore',    city: 'London',
    areas: 'London · Heathrow · Gatwick · Luton',
    vehicle: 'Mercedes E-Class 2022',  type: 'Exec Sedan',
    langs: ['मराठी', 'English'],
    rate: '£3.20/mi', base: '£10 base', rating: 5.0, trips: 3210,
    available: true, mandal: 'MML', tone: 'gold', since: '2017',
    note: 'Licensed black cab. Meet-and-greet airport service.',
  },
  {
    id: 'santosh',  name: 'Santosh Wagh',     city: 'Sydney',
    areas: 'Sydney · Parramatta · SYD Airport · Blue Mountains',
    vehicle: 'Hyundai Tucson 2022',    type: 'SUV',
    langs: ['मराठी', 'English'],
    rate: 'A$3.00/mi', base: 'A$7 base', rating: 4.6, trips: 418,
    available: true, mandal: 'MMS', tone: 'pink', since: '2020',
    note: 'Pet-friendly. Multi-stop trips available.',
  },
];
