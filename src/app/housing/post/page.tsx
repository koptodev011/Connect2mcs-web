'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Plus, X } from 'lucide-react';
import styles from '../housing.module.css';

type FormState = {
  title: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  rent: string;
  rentPeriod: 'Daily' | 'Monthly' | 'Weekly';
  countryId: string;
  cityId: string;
  city: string;
  area: string;
  availableFrom: string;
  availableUntil: string;
  genderPreference: string;
  maxOccupants: string;
  description: string;
  agencyName: string;
  businessId: string;
  siteUrl: string;
  status: 'Active' | 'Booked' | 'Draft' | 'Inactive';
  amenities: string[];
};

const initialForm: FormState = {
  title: '',
  propertyType: 'PG',
  bedrooms: '',
  bathrooms: '',
  rent: '',
  rentPeriod: 'Monthly',
  countryId: '',
  cityId: '',
  city: '',
  area: '',
  availableFrom: '',
  availableUntil: '',
  genderPreference: 'Any',
  maxOccupants: '',
  description: '',
  agencyName: '',
  businessId: '',
  siteUrl: '',
  status: 'Draft',
  amenities: [],
};

const amenityKeys: Record<string, string> = {
  WiFi: 'SP_Has_WiFi',
  Parking: 'SP_Has_Parking',
  Furnished: 'SP_Is_Furnished',
  'A/C': 'SP_Has_AC',
  Laundry: 'SP_Has_Laundry',
  Kitchen: 'SP_Has_Kitchen_Access',
};

type UserBusiness = { id: string; name: string };
type LocationOption = { id: string; name: string };
type PropertyImage = { file: File; preview: string };

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.substring(result.indexOf(',') + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

async function uploadPropertyImage(file: File) {
  const response = await fetch('/api/v1/models/ad_image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, data: await fileToBase64(file) }),
  });
  const result = (await response.json()) as { id?: number | string; error?: string };
  if (!response.ok || !result.id) {
    throw new Error(result.error || `Could not upload ${file.name}.`);
  }
  return `/api/image/${result.id}`;
}

export default function PostPropertyPage() {
  const router = useRouter();
  const [business, setBusiness] = useState(false);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [businesses, setBusinesses] = useState<UserBusiness[]>([]);
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/data/countries', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Could not load countries')))
      .then((records: LocationOption[]) => setCountries(Array.isArray(records) ? records : []))
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          console.error('Unable to load countries:', loadError);
          setCountries([]);
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLocationsLoading(false); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!business) return;

    const controller = new AbortController();
    fetch('/api/v1/models/user-businesses', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error('Could not load businesses')),
      )
      .then((payload: { records?: UserBusiness[] }) =>
        setBusinesses(Array.isArray(payload.records) ? payload.records : []),
      )
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          console.error('Unable to load user businesses:', loadError);
          setBusinesses([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusinessesLoading(false);
      });

    return () => controller.abort();
  }, [business]);
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const selectCountry = async (countryId: string) => {
    setForm((current) => ({ ...current, countryId, cityId: '', city: '' }));
    setCities([]);
    if (!countryId) return;
    setCitiesLoading(true);
    try {
      const response = await fetch(`/api/v1/models/C_City?countryId=${encodeURIComponent(countryId)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load cities');
      const payload = (await response.json()) as { records?: LocationOption[] };
      setCities(Array.isArray(payload.records) ? payload.records : []);
    } catch (loadError) {
      console.error('Unable to load cities:', loadError);
      setCities([]);
      setError('Could not load cities for the selected country.');
    } finally {
      setCitiesLoading(false);
    }
  };
  const addImages = (files: FileList | null) => {
    if (!files) return;

    const selected = Array.from(files).slice(0, MAX_IMAGES - images.length);
    const invalid = selected.find(
      (file) => !file.type.startsWith('image/') || file.size > MAX_IMAGE_BYTES,
    );
    if (invalid) {
      setError('Each photo must be an image and no larger than 5 MB.');
      return;
    }

    setError(null);
    setImages((current) => [
      ...current,
      ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  };

  const removeImage = (index: number) => {
    setImages((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((_, imageIndex) => imageIndex !== index);
    });
  };
  const toggleAmenity = (amenity: string) => {
    update(
      'amenities',
      form.amenities.includes(amenity)
        ? form.amenities.filter((item) => item !== amenity)
        : [...form.amenities, amenity],
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      if (images.length === 0) {
        throw new Error('Add at least one property photo.');
      }

      const uploadedImageUrls = await Promise.all(
        images.map(({ file }) => uploadPropertyImage(file)),
      );
      const amenities = Object.fromEntries(
        Object.entries(amenityKeys).map(([label, key]) => [
          key,
          form.amenities.includes(label),
        ]),
      );
      const payload = {
        Name: form.title,
        Description: form.description,
        C_Country_ID: Number(form.countryId),
        C_City_ID: Number(form.cityId),
        City: form.city,
        MCS_ListingType: business ? 'B' : 'P',
        MCS_AgencyName: business ? form.agencyName : undefined,
        MCS_siteUrl: uploadedImageUrls.join('|'),
        MCS_Bedrooms: Number(form.bedrooms),
        MCS_Bathrooms: Number(form.bathrooms),
        SP_Accommodation_Type: form.propertyType,
        SP_Area: Number(form.area) || undefined,
        SP_Available_From: form.availableFrom || undefined,
        SP_Available_Until: form.availableUntil || undefined,
        SP_Gender_Preference: form.genderPreference,
        SP_Max_Occupants: Number(form.maxOccupants) || undefined,
        SP_Rent_Amount: Number(form.rent),
        SP_Rent_Period: form.rentPeriod,
        SP_Listing_Status: form.status,
        SP_Additional_Info: form.description,
        ...amenities,
      };
      const response = await fetch('/api/v1/models/MCS_Accommodation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not post property');

      setForm(initialForm);
      router.push('/housing');
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not post property',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.formShell}>
      <div className={styles.detailTop}>
        <Link className={styles.back} href="/housing">
          <ArrowLeft size={17} />
          Post Property
        </Link>
      </div>

      {message && <div className={styles.formSuccess}>{message}</div>}
      {error && <div className={styles.formError}>{error}</div>}

      <form className={styles.formCard} onSubmit={submit}>
        <p className={styles.formSectionTitle}>Listing Type</p>
        <div className={styles.typeSwitch}>
          <button
            type="button"
            onClick={() => setBusiness(false)}
            className={`${styles.typeButton} ${!business ? styles.typeActive : ''}`}
          >
            Personal<small>Free</small>
          </button>
          <button
            type="button"
            onClick={() => {
              setBusiness(true);
              setBusinessesLoading(true);
            }}
            className={`${styles.typeButton} ${business ? styles.typeActive : ''}`}
          >
            Business<small>Entrepreneurs &amp; agencies only</small>
          </button>
        </div>

        <section className={styles.formSection}>
          <p className={styles.formSectionTitle}>
            Property Photos <span>(up to 4)</span>
          </p>
          <div className={styles.uploadRow}>
            {Array.from({ length: MAX_IMAGES }, (_, index) => {
              const image = images[index];
              return image ? (
                <div className={styles.imageUploadPreview} key={image.preview}>
                  <img src={image.preview} alt={`Property preview ${index + 1}`} />
                  <button
                    type="button"
                    aria-label={`Remove property photo ${index + 1}`}
                    onClick={() => removeImage(index)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className={styles.upload} key={`upload-${index}`}>
                  {index === images.length ? <Camera size={20} /> : <Plus size={18} />}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    multiple
                    disabled={index !== images.length}
                    required={index === 0 && images.length === 0}
                    onChange={(event) => {
                      addImages(event.target.files);
                      event.target.value = '';
                    }}
                  />
                </label>
              );
            })}
          </div>
          <small className={styles.fieldHint}>
            JPG, PNG, WebP, or GIF. Maximum 5 MB per image.
          </small>
        </section>

        <div className={styles.fields}>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="propertyTitle">Property Title</label>
            <input
              id="propertyTitle"
              required
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder="e.g. Spacious 2BHK — Marathi family preferred"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="propertyType">Property Type</label>
            <select
              id="propertyType"
              value={form.propertyType}
              onChange={(event) => update('propertyType', event.target.value)}
            >
              <option value="PG">PG / Paying Guest</option>
              <option value="Shared Apartment">Shared Apartment</option>
              <option value="Single Room">Single Room</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="gender">Gender Preference</label>
            <select
              id="gender"
              value={form.genderPreference}
              onChange={(event) => update('genderPreference', event.target.value)}
            >
              {['Any', 'Female only', 'Male only', 'Family'].map((gender) => (
                <option key={gender}>{gender}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="bedrooms">Bedrooms</label>
            <input id="bedrooms" type="number" min="0" required value={form.bedrooms} onChange={(event) => update('bedrooms', event.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="bathrooms">Bathrooms</label>
            <input id="bathrooms" type="number" min="0" required value={form.bathrooms} onChange={(event) => update('bathrooms', event.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="rent">Rent Amount</label>
            <input id="rent" type="number" min="1" required value={form.rent} onChange={(event) => update('rent', event.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="rentPeriod">Rent Period</label>
            <select
              id="rentPeriod"
              value={form.rentPeriod}
              onChange={(event) =>
                update(
                  'rentPeriod',
                  event.target.value as FormState['rentPeriod'],
                )
              }
            >
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="area">Area (sqft)</label>
            <input id="area" type="number" min="0" value={form.area} onChange={(event) => update('area', event.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="country">Country</label>
            <select id="country" required value={form.countryId} disabled={locationsLoading} onChange={(event) => selectCountry(event.target.value)}>
              <option value="">{locationsLoading ? 'Loading countries...' : 'Select country'}</option>
              {countries.map((country) => <option value={country.id} key={country.id}>{country.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="city">City</label>
            <select id="city" required value={form.cityId} disabled={!form.countryId || citiesLoading} onChange={(event) => { const cityId = event.target.value; update('cityId', cityId); update('city', cities.find((city) => city.id === cityId)?.name || ''); }}>
              <option value="">{citiesLoading ? 'Loading cities...' : form.countryId ? 'Select city' : 'Select country first'}</option>
              {cities.map((city) => <option value={city.id} key={city.id}>{city.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="status">Listing Status</label>
            <select id="status" value={form.status} onChange={(event) => update('status', event.target.value as FormState['status'])}>
              <option value="Active">Active</option><option value="Booked">Booked</option><option value="Draft">Draft</option><option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="availableFrom">Available From</label>
            <input id="availableFrom" type="date" value={form.availableFrom} onChange={(event) => update('availableFrom', event.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="availableUntil">Available Until</label>
            <input id="availableUntil" type="date" value={form.availableUntil} onChange={(event) => update('availableUntil', event.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="occupants">Max Occupants</label>
            <input id="occupants" type="number" min="1" value={form.maxOccupants} onChange={(event) => update('maxOccupants', event.target.value)} />
          </div>
          {business && (
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label htmlFor="businessId">Business</label>
              <div className={styles.businessSelectRow}>
                <select
                  id="businessId"
                  required
                  value={form.businessId}
                  disabled={businessesLoading}
                  onChange={(event) => {
                    const businessId = event.target.value;
                    const selected = businesses.find(
                      (item) => item.id === businessId,
                    );
                    setForm((current) => ({
                      ...current,
                      businessId,
                      agencyName: selected?.name || '',
                    }));
                  }}
                >
                  <option value="">
                    {businessesLoading
                      ? 'Loading your businesses...'
                      : businesses.length
                        ? 'Select your business'
                        : 'No businesses found'}
                  </option>
                  {businesses.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <Link
                  href="/businesses"
                  className={styles.addBusinessButton}
                  aria-label="Add a business"
                  title="Add a business"
                >
                  <Plus size={18} />
                </Link>
              </div>
              {!businessesLoading && businesses.length === 0 && (
                <small className={styles.fieldHint}>
                  Add your business first, then return to post this listing.
                </small>
              )}
            </div>
          )}
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Amenities</label>
            <div className={styles.chips}>
              {Object.keys(amenityKeys).map((amenity) => (
                <label className={styles.chip} key={amenity}>
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                  />
                  <span>{amenity}</span>
                </label>
              ))}
            </div>
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="description">Description</label>
            <textarea id="description" required value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe the property — rules, preferences, surroundings..." />
          </div>
        </div>

        <button className={styles.submit} type="submit" disabled={submitting}>
          {submitting ? 'Posting property...' : 'Post Property →'}
        </button>
      </form>
    </div>
  );
}












