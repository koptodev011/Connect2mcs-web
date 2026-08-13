'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { useLocation } from '@/components/LocationContext';
import { Avatar, Btn, Card, Field, Modal, PageHeader, Pill, Rating, SectionHead, Tag, useGlobalToast } from '@/components/primitives';
import { drivers as fallbackDrivers, TaxiDriver } from '@/data/taxi';
import styles from './page.module.css';

type CityOption = { id: string; name: string };
type LanguageOption = { code: string; name: string };
type ModelRef = { id?: number | string; identifier?: string };
interface ApiTaxiDriver {
  id: number | string;
  IsActive?: boolean;
  MCS_Vehicle?: string;
  MCS_VehicleType?: string;
  MCS_Languages?: string;
  AD_Language?: ModelRef | string;
  MCS_ServiceAreas?: string;
  Rate?: number;
  MCS_BaseFare?: number;
  Rating?: number;
  Counter?: number;
  IsAvailable?: boolean;
  ContactDescription?: string;
  C_City_ID?: ModelRef;
  AD_User_ID?: ModelRef;
}
interface TaxiResponse {
  records?: ApiTaxiDriver[];
  'row-count'?: number;
}
interface RideForm { countryId: string; cityId: string; pickup: string; drop: string; passengers: string; tripDate: string; tripTime: string; userQuote: string; description: string }
interface TaxiRequest { id: string; MCS_Pickup?: string; MCS_Drop?: string; MCS_TripDate?: string; MCS_TripStatus?: ModelRef | string; MCS_UserQuote?: number; MCS_PassengerCount?: number; AD_User_ID?: ModelRef }
interface TaxiQuote { id: string; Name?: string; MCS_QuotedFare?: number | string; MCS_Status?: ModelRef | string; C_Currency_ID?: ModelRef; MCS_TaxiDriver_ID?: ModelRef; MCS_Taxi_Service_Request_ID?: ModelRef }
const emptyRideForm: RideForm = { countryId: '', cityId: '', pickup: '', drop: '', passengers: '', tripDate: '', tripTime: '', userQuote: '', description: '' };
const refId = (value?: ModelRef | string) => typeof value === 'object' && value ? String(value.id || '') : String(value || '');

interface DriverForm {
  vehicle: string;
  vehicleType: string;
  baseFare: string;
  city: string;
  serviceAreaIds: string[];
  countryId: string;
  cityId: string;
  phone: string;
  complementaryFood: string;
  language: string;
}

const taxiTones: TaxiDriver['tone'][] = ['blue', 'brick', 'saffron', 'green', 'gold'];

function toTaxiDriver(record: ApiTaxiDriver): TaxiDriver {
  const parts = (record.ContactDescription || '')
    .replace(/\u00c2\u00b7/g, '\u00b7')
    .split('\u00b7')
    .map(part => part.trim())
    .filter(Boolean);
  const hash = String(record.id).split('').reduce((total, character) => total + character.charCodeAt(0), 0);
  return {
    id: String(record.id),
    name: record.AD_User_ID?.identifier || parts[0] || `Driver #${record.id}`,
    city: record.C_City_ID?.identifier || parts[1] || 'City',
    areas: record.MCS_ServiceAreas || parts[2] || 'Metro Area',
    vehicle: record.MCS_Vehicle?.trim() || 'Sedan',
    type: record.MCS_VehicleType || 'Standard',
    langs: (typeof record.AD_Language === 'object' ? record.AD_Language.identifier : record.AD_Language || record.MCS_Languages)?.split(',').map(language => language.trim()).filter(Boolean) || ['Marathi', 'English'],
    rate: record.Rate != null ? `$${record.Rate}/mi` : 'Standard',
    base: record.MCS_BaseFare != null ? `$${record.MCS_BaseFare}` : '-',
    rating: Number(record.Rating || 0),
    trips: Number(record.Counter || 0),
    available: record.IsAvailable !== false,
    mandal: '-',
    tone: taxiTones[hash % taxiTones.length],
    since: '2022',
    note: '',
  };
}

const toneClasses: Record<string, string> = {
  saffron: styles.toneSaffron,
  brick: styles.toneBrick,
  green: styles.toneGreen,
  blue: styles.toneBlue,
  gold: styles.toneGold,
  pink: styles.tonePink,
  sand: styles.toneSand,
};

export default function TaxiPage() {
  const router = useRouter();
  const { location } = useLocation();
  const [driversData, setDriversData] = useState<TaxiDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState('All cities');
  const [contacted, setContacted] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('Rating');
  const [bookOpen, setBookOpen] = useState(false);
  const [rideForm, setRideForm] = useState<RideForm>(emptyRideForm);
  const [submittingRide, setSubmittingRide] = useState(false);
  const [tripsOpen, setTripsOpen] = useState(false);
  const [requests, setRequests] = useState<TaxiRequest[]>([]);
  const [quotes, setQuotes] = useState<TaxiQuote[]>([]);
  const [flowLoading, setFlowLoading] = useState(false);
  const [driverRequestsOpen, setDriverRequestsOpen] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<TaxiRequest[]>([]);
  const [completedTrips, setCompletedTrips] = useState<TaxiRequest[]>([]);
  const [completedTripsOpen, setCompletedTripsOpen] = useState(false);
  const [driverRequestsLoading, setDriverRequestsLoading] = useState(false);
  const [quoteFare, setQuoteFare] = useState<Record<string, string>>({});
  const [quoteSending, setQuoteSending] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<TaxiDriver | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{ quote: TaxiQuote; request?: TaxiRequest } | null>(null);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasTaxiDriverProfile, setHasTaxiDriverProfile] = useState(false);
  const [driverForm, setDriverForm] = useState<DriverForm>({ vehicle: '', vehicleType: '', baseFare: '', city: '', serviceAreaIds: [], countryId: '', cityId: '', phone: '', complementaryFood: '', language: '' });
  const [registrationCountries, setRegistrationCountries] = useState<CityOption[]>([]);
  const [requestCities, setRequestCities] = useState<CityOption[]>([]);
  const [registrationCities, setRegistrationCities] = useState<CityOption[]>([]);
  const [registrationLanguages, setRegistrationLanguages] = useState<LanguageOption[]>([]);
  const [registrationLocationsLoading, setRegistrationLocationsLoading] = useState(false);
  const toast = useGlobalToast();
  const getUserId = () => {
    try { return Number(JSON.parse(localStorage.getItem('mcs_user') || '{}').id) || 0 } catch { return 0 }
  };

  useEffect(() => {
    const updateTaxiDriverProfile = () => {
      try {
        const user = JSON.parse(localStorage.getItem('mcs_user') || '{}') as { linkedProfileIds?: Record<string, string> };
        setHasTaxiDriverProfile(Boolean(localStorage.getItem('MCS_TaxiDriver_ID') || user.linkedProfileIds?.MCS_TaxiDriver_ID));
      } catch {
        setHasTaxiDriverProfile(Boolean(localStorage.getItem('MCS_TaxiDriver_ID')));
      }
    };
    updateTaxiDriverProfile();
    window.addEventListener('storage', updateTaxiDriverProfile);
    window.addEventListener('mcs_auth_change', updateTaxiDriverProfile);
    window.addEventListener('focus', updateTaxiDriverProfile);
    return () => {
      window.removeEventListener('storage', updateTaxiDriverProfile);
      window.removeEventListener('mcs_auth_change', updateTaxiDriverProfile);
      window.removeEventListener('focus', updateTaxiDriverProfile);
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();

    async function loadDrivers() {
      try {
        setLoading(true);
        setLoadError(null);
        const response = await fetch('/api/v1/models/MCS_TaxiDriver?top=100&_=' + Date.now(), {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Taxi API returned ${response.status}`);
        }

        const data = await response.json() as TaxiResponse;
        const records = (data.records || [])
          .filter(record => record.IsActive !== false)
          .map(toTaxiDriver);
        setDriversData(records);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Unable to load taxi drivers:', error);
        setDriversData(fallbackDrivers);
        setLoadError('Live driver data is temporarily unavailable. Showing saved driver information.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDrivers();
    return () => controller.abort();
  }, [location.country, location.countryId, refreshKey]);

  useEffect(() => {
    setActiveCity('All cities');
    setCitySearch('');
    if (location.country === 'All' || !location.countryId) {
      setCities([]);
      return;
    }
    const controller = new AbortController();
    fetch('/api/v1/models/C_City?countryId=' + encodeURIComponent(location.countryId), { cache: 'no-store', signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('City API returned ' + response.status);
        return response.json();
      })
      .then(data => setCities(Array.isArray(data.records) ? data.records : []))
      .catch(error => {
        if (!controller.signal.aborted) {
          console.error('Unable to load cities:', error);
          setCities([]);
        }
      });
    return () => controller.abort();
  }, [location.country, location.countryId]);

  useEffect(() => {
    if ((!registerOpen && !bookOpen) || registrationCountries.length > 0) return;
    const controller = new AbortController();
    setRegistrationLocationsLoading(true);
    fetch('/api/data/countries', { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Countries request failed')))
      .then((records: Array<{ id: string; name: string }>) => setRegistrationCountries(records.map(record => ({ id: String(record.id), name: record.name })).filter(record => record.name)))
      .catch(error => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) toast.add('Could not load countries.', 'error');
      })
      .finally(() => setRegistrationLocationsLoading(false));
    return () => controller.abort();
  }, [bookOpen, registerOpen, registrationCountries.length]);

  useEffect(() => {
    if (!bookOpen || !rideForm.countryId) {
      setRequestCities([]);
      return;
    }
    const controller = new AbortController();
    fetch('/api/v1/models/C_City?countryId=' + encodeURIComponent(rideForm.countryId), { signal: controller.signal, cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Cities request failed')))
      .then((data: { records?: CityOption[] }) => setRequestCities(data.records || []))
      .catch(error => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) toast.add('Could not load cities.', 'error');
      });
    return () => controller.abort();
  }, [bookOpen, rideForm.countryId]);

  useEffect(() => {
    if (!registerOpen || registrationLanguages.length > 0) return;
    const controller = new AbortController();
    fetch('/api/v1/models/AD_Language', { signal: controller.signal, cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Languages request failed')))
      .then((data: { records?: LanguageOption[] }) => setRegistrationLanguages(data.records || []))
      .catch(error => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) toast.add('Could not load languages.', 'error');
      });
    return () => controller.abort();
  }, [registerOpen, registrationLanguages.length]);
  useEffect(() => {
    if (!driverForm.countryId) {
      setRegistrationCities([]);
      return;
    }
    const controller = new AbortController();
    setRegistrationLocationsLoading(true);
    fetch('/api/v1/models/C_City?countryId=' + encodeURIComponent(driverForm.countryId), { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Cities request failed')))
      .then((data: { records?: CityOption[] }) => setRegistrationCities(data.records || []))
      .catch(error => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) toast.add('Could not load cities.', 'error');
      })
      .finally(() => setRegistrationLocationsLoading(false));
    return () => controller.abort();
  }, [driverForm.countryId]);
  const openRegistration = () => {
    if (hasTaxiDriverProfile) return;
    let userId = 0;
    try { userId = Number(JSON.parse(localStorage.getItem('mcs_user') || '{}').id) || 0; } catch {}
    if (!userId) {
      toast.add('Please sign in before becoming a taxi driver.', 'error');
      return;
    }
    setDriverForm(current => ({
      ...current,
      countryId: current.countryId || location.countryId || '',
      city: current.city || (location.city !== 'All' ? location.city : ''),
    }));
    setRegisterOpen(true);
  };

  const registerDriver = async () => {
    if (!driverForm.vehicle.trim() || !driverForm.vehicleType.trim() || !driverForm.countryId || !driverForm.cityId || !driverForm.phone.trim() || !driverForm.language.trim() || driverForm.serviceAreaIds.length === 0) {
      toast.add('Complete all required driver fields.', 'error');
      return;
    }
    setRegistering(true);
    try {
      const response = await fetch('/api/v1/models/MCS_TaxiDriver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          MCS_Vehicle: driverForm.vehicle.trim(),
          MCS_VehicleType: driverForm.vehicleType.trim(),
          MCS_BaseFare: Number(driverForm.baseFare),
          C_Country_ID: Number(driverForm.countryId),
          C_City_ID: Number(driverForm.cityId),
          Phone: driverForm.phone.trim(),
          MCS_ComplementoryFood: driverForm.complementaryFood.trim(),
          AD_Language: driverForm.language.trim(),
          MCS_ServiceAreas: driverForm.serviceAreaIds.map(Number),
          serviceAreaNames: registrationCities.filter(city => driverForm.serviceAreaIds.includes(city.id)).map(city => city.name),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not register taxi driver');
      const createdDriverId = String(data.id || data.MCS_TaxiDriver_ID || 'registered');
      localStorage.setItem('MCS_TaxiDriver_ID', createdDriverId);
      try {
        const savedUser = JSON.parse(localStorage.getItem('mcs_user') || '{}');
        localStorage.setItem('mcs_user', JSON.stringify({ ...savedUser, linkedProfileIds: { ...savedUser.linkedProfileIds, MCS_TaxiDriver_ID: createdDriverId } }));
      } catch {}
      setHasTaxiDriverProfile(true);
      setRegisterOpen(false);
      setDriverForm({ vehicle: '', vehicleType: '', baseFare: '', city: '', serviceAreaIds: [], countryId: '', cityId: '', phone: '', complementaryFood: '', language: '' });
      setRefreshKey(current => current + 1);
      toast.add('Taxi driver profile submitted for verification.', 'success');
    } catch (error) {
      toast.add(error instanceof Error ? error.message : 'Could not register taxi driver', 'error');
    } finally {
      setRegistering(false);
    }
  };
  const loadTaxiFlow = async () => {
    setFlowLoading(true);
    try {
      const [requestResponse, quoteResponse] = await Promise.all([
fetch(`/api/v1/models/MCS_Taxi_Service_Request?userId=${getUserId()}`, { cache: 'no-store' }),
fetch(`/api/v1/models/MCS_Taxi_Service_Quote?userId=${getUserId()}`, { cache: 'no-store' }),
      ]);
      const [requestData, quoteData] = await Promise.all([requestResponse.json(), quoteResponse.json()]);
      if (!requestResponse.ok) throw new Error(requestData.error || 'Could not load taxi requests');
      if (!quoteResponse.ok) throw new Error(quoteData.error || 'Could not load taxi quotes');
      setRequests(requestData.records || []); setQuotes(quoteData.records || []);
    } catch (error) { toast.add(error instanceof Error ? error.message : 'Could not load taxi activity', 'error'); }
    finally { setFlowLoading(false); }
  };
  const openTrips = () => { setTripsOpen(true); void loadTaxiFlow(); };
  const openTaxiChat = (name: string, context?: { requestId?: string; quoteId?: string; fare?: number | string }) => {
    if (!name.trim()) { toast.add('Chat contact is unavailable.', 'error'); return; }
    const params = new URLSearchParams({ user: name.trim() });
    if (context?.requestId) params.set('taxiRequestId', context.requestId);
    if (context?.quoteId) params.set('taxiQuoteId', context.quoteId);
    if (context?.fare != null) params.set('taxiFare', String(context.fare));
    router.push(`/chat?${params.toString()}`);
  };
  const openCompletedTrips = async () => {
    setCompletedTripsOpen(true); setDriverRequestsLoading(true);
    try {
      const response = await fetch(`/api/v1/models/MCS_Taxi_Service_Request?scope=completed&userId=${getUserId()}`, { cache: 'no-store' });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not load completed trips');
      setCompletedTrips(data.records || []);
    } catch (error) { toast.add(error instanceof Error ? error.message : 'Could not load completed trips', 'error'); }
    finally { setDriverRequestsLoading(false); }
  };  const openDriverRequests = async () => {
    setDriverRequestsOpen(true); setDriverRequestsLoading(true);
    try {
const response = await fetch(`/api/v1/models/MCS_Taxi_Service_Request?scope=driver&userId=${getUserId()}`, { cache: 'no-store' });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not load ride requests');
      setIncomingRequests((data.records || []).filter((request: TaxiRequest) => (refId(request.MCS_TripStatus) || 'O') === 'O'));
    } catch (error) { toast.add(error instanceof Error ? error.message : 'Could not load ride requests', 'error'); }
    finally { setDriverRequestsLoading(false); }
  };
  const sendQuote = async (requestId: string) => {
    const fare = Number(quoteFare[requestId]); if (!Number.isFinite(fare) || fare <= 0) { toast.add('Enter a valid fare.', 'error'); return; }
    setQuoteSending(requestId);
    try {
      const response = await fetch('/api/v1/models/MCS_Taxi_Service_Quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: getUserId(), requestId, MCS_QuotedFare: fare, Description: 'Taxi quote created from web' }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not send quote');
      setIncomingRequests(current => current.filter(request => String(request.id) !== requestId));
      toast.add('Quote sent to the passenger.', 'success');
    } catch (error) { toast.add(error instanceof Error ? error.message : 'Could not send quote', 'error'); }
    finally { setQuoteSending(null); }
  };
  const submitRide = async () => {
    if (!rideForm.countryId || !rideForm.cityId || !rideForm.pickup.trim() || !rideForm.drop.trim() || !rideForm.tripDate || !rideForm.tripTime || !Number(rideForm.passengers)) { toast.add('Complete all taxi request fields.', 'error'); return; }
    setSubmittingRide(true);
    try {
      const tripDateTime = new Date(`${rideForm.tripDate}T${rideForm.tripTime}`);
      const response = await fetch('/api/v1/models/MCS_Taxi_Service_Request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: getUserId(), MCS_Pickup: rideForm.pickup.trim(), MCS_Drop: rideForm.drop.trim(), MCS_PassengerCount: Number(rideForm.passengers), MCS_TripDate: tripDateTime.toISOString(), MCS_UserQuote: Number(rideForm.userQuote || 0), Description: rideForm.description.trim(), C_Country_ID: Number(rideForm.countryId), C_City_ID: Number(rideForm.cityId) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not request taxi');
      setRideForm(emptyRideForm); setBookOpen(false); toast.add('Taxi request sent to available drivers.', 'success');
    } catch (error) { toast.add(error instanceof Error ? error.message : 'Could not request taxi', 'error'); } finally { setSubmittingRide(false); }
  };
  const acceptQuote = async (quote: TaxiQuote) => {
    try {
      const response = await fetch('/api/v1/models/MCS_Taxi_Service_Request', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: getUserId(), id: refId(quote.MCS_Taxi_Service_Request_ID), MCS_TripStatus: 'A', MCS_UserQuote: Number(quote.MCS_QuotedFare || 0), quoteId: quote.id }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not accept quote');
      const bookingRequest = requests.find(request => String(request.id) === refId(quote.MCS_Taxi_Service_Request_ID));
      setConfirmedBooking({ quote, request: bookingRequest });
      setTripsOpen(false); toast.add('Quote accepted. Your booking is confirmed.', 'success'); void loadTaxiFlow();
    } catch (error) { toast.add(error instanceof Error ? error.message : 'Could not accept quote', 'error'); }
  };
  const driverCities = useMemo(() => Array.from(new Set(
    driversData.map(driver => driver.city).filter(city => city && city !== 'City'),
  )).sort((first, second) => first.localeCompare(second)), [driversData]);
  const taxiCities = location.country === 'All' ? ['All cities'] : ['All cities', ...cities.map(city => city.name)];
  const modalCities = (location.country === 'All' ? driverCities : cities.map(city => city.name))
    .filter(city => city.toLowerCase().includes(citySearch.trim().toLowerCase()));
  const selectCity = (city: string) => {
    setActiveCity(city);
    setCityModalOpen(false);
    setCitySearch('');
  };

  const filtered = activeCity === 'All cities'
    ? driversData
    : driversData.filter(driver => driver.city === activeCity);

  const sortedDrivers = [...filtered].sort((first, second) => {
    if (sortBy === 'Rating') return second.rating - first.rating;
    if (sortBy === 'Trips') return second.trips - first.trips;
    return 0;
  });

  return (
    <div className={styles.page}>
      <PageHeader
        title="NRI Taxi"
        marathi="टॅक्सी"
        subtitle={`${loading ? '...' : driversData.length} community drivers · vetted by Mandal network · book directly`}
        actions={<>
          {/* <Btn kind="ghost" size="md" iconL="filter" onClick={() => setCityModalOpen(true)}>Filters</Btn> */}
          {/* <Btn kind="dark" size="md" iconL="plus" onClick={openRegistration}>Register as driver</Btn> */}
        </>}
      />
      <div className={`${styles.hero} mob-stack`}>
        <svg className={styles.heroDecoration} width="220" height="220" viewBox="0 0 220 220" aria-hidden="true">
          <g fill="none" stroke="#fff" strokeWidth="1">
            <circle cx="110" cy="110" r="90" />
            <circle cx="110" cy="110" r="66" />
            <circle cx="110" cy="110" r="42" />
          </g>
        </svg>

        <div className={styles.heroContent}>
          <Tag color="#FFD89C" bg="rgba(255,216,156,0.15)">● Community-verified drivers</Tag>
          <h2 className={styles.heroTitle}>
            Need a Trusted<br />community Taxi?
          </h2>

          <div className={styles.heroActions}>
            {hasTaxiDriverProfile ? <>
              <Btn kind="primary" size="md" onClick={openDriverRequests}>Taxi Requests</Btn>
              <Btn kind="soft" size="md" onClick={openCompletedTrips}>Completed Trips</Btn>
            </> : <>
              <Btn kind="primary" size="md" onClick={() => setBookOpen(true)}>Book a Taxi Now</Btn>
              <Btn kind="soft" size="md" onClick={openTrips}>My Trips & Quotes</Btn>
              <Btn kind="primary" size="md" onClick={openRegistration}>Become a Taxi Driver</Btn>
            </>}
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}><strong>{loading ? '...' : driversData.length}</strong><span>Trusted Drivers</span></div>
        <div className={styles.statCard}><strong>{loading ? '...' : driversData.filter(driver => driver.available).length}</strong><span>Active Taxis</span></div>
        <div className={styles.statCard}><strong>Verified</strong><span>Community Safety</span></div>
      </div>

      <div className={styles.cityFilters}>
        {taxiCities.map(city => (
          <Pill key={city} active={activeCity === city} onClick={() => {
            if (location.country === 'All' && city === 'All cities') setCityModalOpen(true);
            else setActiveCity(city);
          }}>
            {city}
          </Pill>
        ))}
        {location.country === 'All' && activeCity !== 'All cities' && (
          <Pill active onClick={() => setCityModalOpen(true)}>{activeCity}</Pill>
        )}
      </div>

      {cityModalOpen && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setCityModalOpen(false)}>
          <div className={styles.cityModal} role="dialog" aria-modal="true" aria-labelledby="taxi-city-title" onMouseDown={event => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div><div id="taxi-city-title" className={styles.modalTitle}>Select a city</div><div className={styles.modalSubtitle}>Search cities with available taxi drivers</div></div>
              <button type="button" className={styles.modalClose} aria-label="Close city selector" onClick={() => setCityModalOpen(false)}>&times;</button>
            </div>
            <input className={styles.citySearch} type="search" value={citySearch} onChange={event => setCitySearch(event.target.value)} placeholder="Search city..." autoFocus />
            <div className={styles.cityList}>
              <button type="button" className={styles.cityOption} onClick={() => selectCity('All cities')}>All cities</button>
              {modalCities.map(city => <button type="button" className={styles.cityOption} key={city} onClick={() => selectCity(city)}>{city}</button>)}
              {modalCities.length === 0 && <div className={styles.noCities}>No matching cities found</div>}
            </div>
          </div>
        </div>
      )}

      <section>
        <SectionHead
          title="Available drivers"
subtitle={`Showing ${filtered.length} driver${filtered.length === 1 ? '' : 's'} ${'\u00b7'} ${activeCity}`}
          action={
            <select
              value={sortBy}
              onChange={event => setSortBy(event.target.value)}
              className={styles.sortSelect}
            >
              <option value="Rating">Sort: Rating</option>
              <option value="Trips">Sort: Trips</option>
            </select>
          }
        />

        {loadError && <div className={styles.loadWarning} role="status">{loadError}</div>}

        {loading ? (
          <div className={styles.statusMessage}>Loading drivers from iDempiere...</div>
        ) : filtered.length === 0 ? (
          <Card pad={32} className={styles.emptyCard}>
            <div className={styles.emptyTitle}>No drivers in this city yet</div>
          </Card>
        ) : (
          <div className={`${styles.driverGrid} mob-stack`}>
            {sortedDrivers.map((driver, index) => {
              const isContacted = contacted.has(driver.id);
              const toneClass = toneClasses[driver.tone] ?? styles.toneSaffron;

              return (
                <Card key={`${driver.id}-${index}`} pad={0} className={styles.driverCard}>
                  <div className={`${styles.toneStrip} ${toneClass}`} />

                  <div className={styles.cardBody}>
                    <div className={styles.driverHeader}>
                      <div className={styles.avatarWrap}>
                        <Avatar name={driver.name} size={52} />
                        <span className={`${styles.availabilityDot} ${driver.available ? styles.available : ''}`} />
                      </div>

                      <div className={styles.driverInfo}>
                        <div className={styles.driverName}>{driver.name}</div>
                        <div className={styles.driverMeta}>{driver.city}</div>
                        <div className={styles.ratingRow}>
                          <Rating value={driver.rating} />
                          <span className={styles.tripCount}>{driver.trips.toLocaleString()} trips</span>
                        </div>
                      </div>


                    </div>

                    <div className={`${styles.vehicle} ${toneClass}`}>
                      <Icon name="car" size={18} color="currentColor" />
                      <div>
                        <div className={styles.vehicleName}>{driver.vehicle}</div>
                        <div className={styles.vehicleType}>{driver.type}</div>
                      </div>
                    </div>

                    <div className={styles.languages}>
                      {driver.langs.map(language => (
                        <Tag
                          key={language}
                          className={undefined}
                        >
                          {language}
                        </Tag>
                      ))}
                    </div>


                    <div className={styles.rateRow}>
                      <div>
                        <span className={styles.rate}>{driver.base}</span>
                      </div>
                      <div className={styles.driverActions}>
                        <Btn kind="ghost" size="sm" onClick={() => setSelectedDriver(driver)}>View details</Btn>
                        <Btn
                        kind={isContacted ? 'soft' : 'primary'}
                        size="sm"
                        onClick={() => {
                          setContacted(current => {
                            const next = new Set(current);
                            if (next.has(driver.id)) {
                              next.delete(driver.id);
                            } else {
                              next.add(driver.id);
                            }
                            return next;
                          });
                          setBookOpen(true);
                        }}
                      >
                        {isContacted ? 'Requested ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“' : 'Book ride'}
                      </Btn>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Modal isOpen={bookOpen} onClose={() => !submittingRide && setBookOpen(false)} title="Request a Taxi" width={680}>
        <div className={styles.requestTaxiForm}>
          <p className={styles.requestSubtitle}>Get community driver quotes for your trip.</p>
          <div className={styles.requestLocationGrid}>
            <Field label="Country" value={rideForm.countryId} placeholder={registrationLocationsLoading ? 'Loading countries...' : 'Select Country'} options={registrationCountries.map(country => ({ value: country.id, label: country.name }))} onChange={value => setRideForm(current => ({ ...current, countryId: value, cityId: '' }))} />
            <Field label="City" value={rideForm.cityId} placeholder={rideForm.countryId ? 'Select City' : 'Select country first'} options={requestCities.map(city => ({ value: city.id, label: city.name }))} onChange={value => setRideForm(current => ({ ...current, cityId: value }))} />
          </div>
          <Field label="Pickup Location" value={rideForm.pickup} placeholder="Enter pickup location" onChange={value => setRideForm(current => ({ ...current, pickup: value }))} />
          <Field label="Drop Location" value={rideForm.drop} placeholder="Enter drop location" onChange={value => setRideForm(current => ({ ...current, drop: value }))} />
          <Field label="Date" type="date" value={rideForm.tripDate} onChange={value => setRideForm(current => ({ ...current, tripDate: value }))} />
          <Field label="Passengers" type="number" value={rideForm.passengers} placeholder="Number of passengers" onChange={value => setRideForm(current => ({ ...current, passengers: value }))} />
          <Field label="Preferred Time" type="time" value={rideForm.tripTime} onChange={value => setRideForm(current => ({ ...current, tripTime: value }))} />
          <Field label="Your Quote" type="number" value={rideForm.userQuote} placeholder="Enter your expected fare" onChange={value => setRideForm(current => ({ ...current, userQuote: value }))} />
          <button type="button" className={styles.submitRequestButton} disabled={submittingRide} onClick={submitRide}>{submittingRide ? 'Submitting...' : 'Submit Request'}</button>
        </div>
      </Modal>

      <Modal isOpen={tripsOpen} onClose={() => setTripsOpen(false)} title="My Taxi Trips & Quotes" width={760}>
        <div className={styles.tripList}>
          {flowLoading && <div className={styles.statusMessage}>Loading taxi activity...</div>}
          {!flowLoading && requests.length === 0 && <div className={styles.statusMessage}>No taxi requests yet.</div>}
          {requests.map(request => {
            const requestQuotes = quotes.filter(quote => refId(quote.MCS_Taxi_Service_Request_ID) === String(request.id));
            const tripStatus = refId(request.MCS_TripStatus) || 'O';
            return <div className={styles.tripCard} key={request.id}>
              <div className={styles.tripHeader}><strong>{request.MCS_Pickup || 'Pickup'} to {request.MCS_Drop || 'Destination'}</strong><Tag>{tripStatus === 'A' ? 'Accepted' : tripStatus === 'C' ? 'Completed' : tripStatus === 'X' ? 'Cancelled' : 'Awaiting quotes'}</Tag></div>
              <div className={styles.tripMeta}>{request.MCS_TripDate ? new Date(request.MCS_TripDate).toLocaleString() : 'Flexible date'} - Budget {request.MCS_UserQuote || 'open'}</div>
              <div className={styles.quoteList}>{requestQuotes.map(quote => {
                const driverName = quote.Name || quote.MCS_TaxiDriver_ID?.identifier || 'Taxi Driver';
                return <div className={styles.quoteRow} key={quote.id}><div><strong>{driverName}</strong><span>{quote.C_Currency_ID?.identifier || 'USD'} {quote.MCS_QuotedFare}</span></div><div className={styles.driverActions}><Btn kind="ghost" size="sm" onClick={() => openTaxiChat(driverName, { requestId: String(request.id), quoteId: String(quote.id), fare: quote.MCS_QuotedFare })}>Chat</Btn>{tripStatus === 'O' && <Btn kind="primary" size="sm" onClick={() => acceptQuote(quote)}>Accept quote</Btn>}</div></div>;
              })}</div>
              {requestQuotes.length === 0 && <div className={styles.noQuotes}>No quotes received yet.</div>}
            </div>;
          })}
        </div>
      </Modal>
      <Modal isOpen={driverRequestsOpen} onClose={() => setDriverRequestsOpen(false)} title="Passenger Ride Requests" width={820}>
        <div className={styles.tripList}>
          <p className={styles.registrationNote}>Review open requests and send a fare quote as a registered taxi driver.</p>
          {driverRequestsLoading && <div className={styles.statusMessage}>Loading passenger requests...</div>}
          {!driverRequestsLoading && incomingRequests.length === 0 && <div className={styles.statusMessage}>No open ride requests.</div>}
          {incomingRequests.map(request => <div className={styles.tripCard} key={request.id}>
            <div className={styles.tripHeader}><strong>{request.MCS_Pickup || 'Pickup'} to {request.MCS_Drop || 'Destination'}</strong><Tag>Awaiting Quotes</Tag></div>
            <div className={styles.tripMeta}>{request.MCS_TripDate ? new Date(request.MCS_TripDate).toLocaleString() : 'Flexible date'} - {request.MCS_PassengerCount || 1} passengers - Expected fare {request.MCS_UserQuote || 'open'}</div>
            <div className={styles.quoteComposer}>
              <input type="number" min="1" value={quoteFare[String(request.id)] || ''} onChange={event => setQuoteFare(current => ({ ...current, [String(request.id)]: event.target.value }))} placeholder="Enter your fare" />
              <Btn kind="ghost" size="sm" onClick={() => openTaxiChat(request.AD_User_ID?.identifier || '')}>Chat</Btn><Btn kind="primary" size="sm" disabled={quoteSending === String(request.id)} onClick={() => sendQuote(String(request.id))}>{quoteSending === String(request.id) ? 'Sending...' : 'Send Quote'}</Btn>
            </div>
          </div>)}
        </div>
      </Modal>

      <Modal isOpen={completedTripsOpen} onClose={() => setCompletedTripsOpen(false)} title="Completed Trips" width={820}>
        <div className={styles.tripList}>
          {driverRequestsLoading && <div className={styles.statusMessage}>Loading completed trips...</div>}
          {!driverRequestsLoading && completedTrips.length === 0 && <div className={styles.statusMessage}>No completed trips.</div>}
          {completedTrips.map(request => <div className={styles.tripCard} key={request.id}><div className={styles.tripHeader}><strong>{request.MCS_Pickup || 'Pickup'} to {request.MCS_Drop || 'Destination'}</strong><Tag>Completed</Tag></div><div className={styles.tripMeta}>{request.MCS_TripDate ? new Date(request.MCS_TripDate).toLocaleString() : 'Flexible date'} - {request.MCS_PassengerCount || 1} passengers</div></div>)}
        </div>
      </Modal>
      <Modal isOpen={Boolean(selectedDriver)} onClose={() => setSelectedDriver(null)} title="Taxi Driver Profile" width={720}>
        {selectedDriver && <div className={styles.profilePanel}>
          <div className={styles.profileHero}>
            <Avatar name={selectedDriver.name} size={76} />
            <div><h3>{selectedDriver.name}</h3><span className={styles.verifiedBadge}>Verified Community Driver</span><p>{selectedDriver.city} - Available for direct booking</p></div>
          </div>
          <div className={styles.profileStats}>
            <div><strong>{selectedDriver.rating || 'New'}</strong><span>Rating</span></div>
            <div><strong>{selectedDriver.trips.toLocaleString()}</strong><span>Total Trips</span></div>
            <div><strong>{selectedDriver.available ? 'Online' : 'Offline'}</strong><span>Availability</span></div>
          </div>
          <div className={styles.profileSection}><h4>Vehicle Details</h4><strong>{selectedDriver.vehicle}</strong><p>{selectedDriver.type} - Base fare {selectedDriver.base}</p></div>
          <div className={styles.profileSection}><h4>Languages</h4><div className={styles.languages}>{selectedDriver.langs.map(language => <Tag key={language}>{language}</Tag>)}</div></div>
          <div className={styles.registrationActions}><Btn kind="ghost" size="md" onClick={() => setSelectedDriver(null)}>Close</Btn><Btn kind="primary" size="md" onClick={() => { setRideForm(current => ({ ...current, description: `Preferred driver: ${selectedDriver.name} (#${selectedDriver.id})` })); setSelectedDriver(null); setBookOpen(true); }}>Request This Driver</Btn></div>
        </div>}
      </Modal>

      <Modal isOpen={Boolean(confirmedBooking)} onClose={() => setConfirmedBooking(null)} title="Taxi Booking Confirmed" width={680}>
        {confirmedBooking && <div className={styles.confirmationPanel}>
          <div className={styles.confirmationSuccess}><h3>Booking Confirmed!</h3><p>Your taxi has been booked successfully.</p></div>
          <div className={styles.confirmedDriver}><div><strong>{confirmedBooking.quote.Name || confirmedBooking.quote.MCS_TaxiDriver_ID?.identifier || 'Taxi Driver'}</strong><span>Verified community driver</span></div><strong>{confirmedBooking.quote.C_Currency_ID?.identifier || 'USD'} {confirmedBooking.quote.MCS_QuotedFare}</strong></div>
          <div className={styles.profileSection}><h4>Trip Details</h4><p><strong>From:</strong> {confirmedBooking.request?.MCS_Pickup || 'Pickup location'}</p><p><strong>To:</strong> {confirmedBooking.request?.MCS_Drop || 'Destination'}</p><p><strong>Date:</strong> {confirmedBooking.request?.MCS_TripDate ? new Date(confirmedBooking.request.MCS_TripDate).toLocaleString() : 'Flexible'}</p><p><strong>Passengers:</strong> {confirmedBooking.request?.MCS_PassengerCount || 1}</p></div>
          <div className={styles.registrationActions}><Btn kind="primary" size="md" onClick={() => setConfirmedBooking(null)}>Done</Btn></div>
        </div>}
      </Modal>
      <Modal isOpen={registerOpen} onClose={() => !registering && setRegisterOpen(false)} title="Become a Taxi Driver" width={620}>
        <div className={styles.registrationForm}>
          <p className={styles.registrationNote}>Create your driver profile. It will remain unverified until reviewed by MCS.</p>
          <div className={styles.registrationGrid}>
            <Field label="Vehicle" value={driverForm.vehicle} placeholder="Toyota Camry 2024" onChange={value => setDriverForm(current => ({ ...current, vehicle: value }))} />
            <Field label="Vehicle type" value={driverForm.vehicleType} placeholder="Sedan" onChange={value => setDriverForm(current => ({ ...current, vehicleType: value }))} />
            <Field label="Base fare" type="number" value={driverForm.baseFare} placeholder="6" onChange={value => setDriverForm(current => ({ ...current, baseFare: value }))} />
            <Field label="Phone" type="tel" value={driverForm.phone} placeholder="+91 98765 43210" onChange={value => setDriverForm(current => ({ ...current, phone: value }))} />
            <Field label="Country" value={driverForm.countryId} placeholder={registrationLocationsLoading ? 'Loading...' : 'Select country'} options={registrationCountries.map(country => ({ value: country.id, label: country.name }))} onChange={value => setDriverForm(current => ({ ...current, countryId: value, cityId: '', city: '', serviceAreaIds: [] }))} />
            <Field label="City" value={driverForm.cityId} placeholder={driverForm.countryId ? 'Select city' : 'Select country first'} options={registrationCities.map(city => ({ value: city.id, label: city.name }))} onChange={value => setDriverForm(current => ({ ...current, cityId: value, city: registrationCities.find(city => city.id === value)?.name || '' }))} />
            <Field label="Language" value={driverForm.language} placeholder="Select language" options={registrationLanguages.map(language => ({ value: language.code, label: language.name }))} onChange={value => setDriverForm(current => ({ ...current, language: value }))} />
            <Field label="Complementary food" value={driverForm.complementaryFood} placeholder="Water and snacks" onChange={value => setDriverForm(current => ({ ...current, complementaryFood: value }))} />
          </div>
                    <fieldset className={styles.serviceAreaField} disabled={!driverForm.countryId || registrationCities.length === 0}>
            <legend>Service areas</legend>
            <div className={styles.serviceAreaOptions}>
              {registrationCities.map(city => (
                <label key={city.id} className={styles.serviceAreaOption}>
                  <input
                    type="checkbox"
                    checked={driverForm.serviceAreaIds.includes(city.id)}
                    onChange={event => setDriverForm(current => ({
                      ...current,
                      serviceAreaIds: event.target.checked
                        ? [...current.serviceAreaIds, city.id]
                        : current.serviceAreaIds.filter(id => id !== city.id),
                    }))}
                  />
                  <span>{city.name}</span>
                </label>
              ))}
              {driverForm.countryId && registrationCities.length === 0 && <div className={styles.noServiceAreas}>No cities available.</div>}
            </div>
          </fieldset>          <div className={styles.registrationActions}>
            <Btn kind="ghost" size="md" disabled={registering} onClick={() => setRegisterOpen(false)}>Cancel</Btn>
            <Btn kind="primary" size="md" disabled={registering} onClick={registerDriver}>{registering ? 'Submitting...' : 'Submit profile'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
