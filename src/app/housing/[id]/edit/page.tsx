'use client';

import { FormEvent, use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { AccommodationRecord, ModelReference } from '../../housing-data';
import styles from '../../housing.module.css';

const amenities = [
  ['SP_Has_WiFi', 'WiFi'],
  ['SP_Has_Kitchen_Access', 'Kitchen Access'],
  ['SP_Has_Laundry', 'Laundry'],
  ['SP_Is_Furnished', 'Furnished'],
  ['SP_Has_Parking', 'Parking'],
  ['SP_Has_AC', 'A/C'],
] as const;

function code(value: ModelReference | string | number | undefined) {
  return typeof value === 'object' && value
    ? String(value.id || '')
    : String(value || '');
}

type LocationOption = { id: string; name: string };

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [record, setRecord] = useState<AccommodationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/data/countries', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Could not load countries')))
      .then((records: LocationOption[]) => setCountries(Array.isArray(records) ? records : []))
      .catch((loadError) => { if (!controller.signal.aborted) console.error('Unable to load countries:', loadError); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/v1/models/MCS_Accommodation/${id}`, { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Property not found.')))
      .then(async (data: AccommodationRecord) => {
        setRecord(data);
        const countryId = code(data.C_Country_ID);
        if (!countryId) return;
        setCitiesLoading(true);
        try {
          const response = await fetch(`/api/v1/models/C_City?countryId=${encodeURIComponent(countryId)}`, { cache: 'no-store' });
          const payload = response.ok ? await response.json() as { records?: LocationOption[] } : { records: [] };
          setCities(Array.isArray(payload.records) ? payload.records : []);
        } finally {
          setCitiesLoading(false);
        }
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : 'Could not load property.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);

  const update = (key: keyof AccommodationRecord, value: unknown) => {
    setRecord((current) => current ? { ...current, [key]: value } : current);
  };

  const selectCountry = async (countryId: string) => {
    update('C_Country_ID', countryId ? { id: countryId } : undefined);
    update('C_City_ID', undefined);
    update('City', '');
    setCities([]);
    if (!countryId) return;
    setCitiesLoading(true);
    try {
      const response = await fetch(`/api/v1/models/C_City?countryId=${encodeURIComponent(countryId)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load cities');
      const payload = (await response.json()) as { records?: LocationOption[] };
      setCities(Array.isArray(payload.records) ? payload.records : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load cities.');
    } finally {
      setCitiesLoading(false);
    }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!record) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/models/MCS_Accommodation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not update property.');
      router.push('/housing');
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update property.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.empty}>Loading property...</div>;
  if (!record) return <div className={styles.empty}>{error || 'Property not found.'}</div>;

  return (
    <div className={styles.formShell}>
      <div className={styles.detailTop}>
        <Link className={styles.back} href={`/housing/${id}`}><ArrowLeft size={17} /> Edit Property</Link>
      </div>
      {error && <div className={styles.formError}>{error}</div>}
      <form className={styles.formCard} onSubmit={submit}>
        <div className={styles.fields}>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="title">Property Title</label>
            <input id="title" required value={record.Name || ''} onChange={(event) => update('Name', event.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="listingType">Listing Type</label>
            <select id="listingType" value={code(record.MCS_ListingType) || 'P'} onChange={(event) => update('MCS_ListingType', event.target.value)}>
              <option value="P">Personal</option><option value="B">Business</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="propertyType">Property Type</label>
            <select id="propertyType" value={code(record.SP_Accommodation_Type) || 'PG'} onChange={(event) => update('SP_Accommodation_Type', event.target.value)}>
              <option value="PG">PG / Paying Guest</option><option value="Shared Apartment">Shared Apartment</option><option value="Single Room">Single Room</option>
            </select>
          </div>
          <div className={styles.field}><label htmlFor="beds">Bedrooms</label><input id="beds" type="number" min="0" value={String(record.MCS_Bedrooms ?? '')} onChange={(event) => update('MCS_Bedrooms', Number(event.target.value))} /></div>
          <div className={styles.field}><label htmlFor="baths">Bathrooms</label><input id="baths" type="number" min="0" value={String(record.MCS_Bathrooms ?? '')} onChange={(event) => update('MCS_Bathrooms', Number(event.target.value))} /></div>
          <div className={styles.field}><label htmlFor="rent">Rent Amount</label><input id="rent" required type="number" min="1" value={String(record.SP_Rent_Amount ?? '')} onChange={(event) => update('SP_Rent_Amount', Number(event.target.value))} /></div>
          <div className={styles.field}><label htmlFor="period">Rent Period</label><select id="period" value={code(record.SP_Rent_Period) || 'Monthly'} onChange={(event) => update('SP_Rent_Period', event.target.value)}><option>Daily</option><option>Monthly</option><option>Weekly</option></select></div>
          <div className={styles.field}>
            <label htmlFor="country">Country</label>
            <select id="country" required value={code(record.C_Country_ID)} onChange={(event) => selectCountry(event.target.value)}>
              <option value="">Select country</option>{countries.map((country) => <option value={country.id} key={country.id}>{country.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="city">City</label>
            <select id="city" required value={code(record.C_City_ID)} disabled={!code(record.C_Country_ID) || citiesLoading} onChange={(event) => { const cityId = event.target.value; update('C_City_ID', cityId ? { id: cityId } : undefined); update('City', cities.find((city) => city.id === cityId)?.name || ''); }}>
              <option value="">{citiesLoading ? 'Loading cities...' : 'Select city'}</option>{cities.map((city) => <option value={city.id} key={city.id}>{city.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="status">Listing Status</label>
            <select id="status" value={code(record.SP_Listing_Status) || 'Draft'} onChange={(event) => update('SP_Listing_Status', event.target.value)}>
              <option value="Active">Active</option><option value="Booked">Booked</option><option value="Draft">Draft</option><option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className={styles.field}><label htmlFor="area">Area (sqft)</label><input id="area" type="number" min="0" value={String(record.SP_Area ?? '')} onChange={(event) => update('SP_Area', Number(event.target.value))} /></div>
          <div className={styles.field}><label htmlFor="occupants">Max Occupants</label><input id="occupants" type="number" min="1" value={String(record.SP_Max_Occupants ?? '')} onChange={(event) => update('SP_Max_Occupants', Number(event.target.value))} /></div>
          <div className={styles.field}><label htmlFor="from">Available From</label><input id="from" type="date" value={record.SP_Available_From?.slice(0, 10) || ''} onChange={(event) => update('SP_Available_From', event.target.value)} /></div>
          <div className={styles.field}><label htmlFor="until">Available Until</label><input id="until" type="date" value={record.SP_Available_Until?.slice(0, 10) || ''} onChange={(event) => update('SP_Available_Until', event.target.value)} /></div>
          <div className={`${styles.field} ${styles.fieldFull}`}><label>Amenities</label><div className={styles.chips}>{amenities.map(([key, text]) => <label className={styles.chip} key={key}><input type="checkbox" checked={record[key] === true} onChange={(event) => update(key, event.target.checked)} /><span>{text}</span></label>)}</div></div>
          <div className={`${styles.field} ${styles.fieldFull}`}><label htmlFor="description">Description</label><textarea id="description" required value={record.Description || ''} onChange={(event) => { update('Description', event.target.value); update('SP_Additional_Info', event.target.value); }} /></div>
        </div>
        <button className={styles.submit} type="submit" disabled={saving}>
          {saving ? 'Saving changes...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}








