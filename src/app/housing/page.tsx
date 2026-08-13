'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocation } from '@/components/LocationContext';
import {
  Bath,
  BedDouble,
  Car,
  MapPin,
  Maximize2,
  MessageSquare,
  Plus,
  Search,
  SlidersHorizontal,
  Utensils,
  Wifi,
} from 'lucide-react';
import styles from './housing.module.css';
import { housingChatHref } from '@/lib/housing-chat';
import {
  accommodationRecordsFromPayload,
  accommodationToHousingCard,
  type HousingCard,
} from './housing-data';

const PAGE_SIZE = 3;

function relativeTime(value?: string) {
  if (!value) return 'Recently';

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Recently';

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return 'Just now';

  const units = [
    { seconds: 31_536_000, suffix: 'y' },
    { seconds: 2_592_000, suffix: 'mo' },
    { seconds: 604_800, suffix: 'w' },
    { seconds: 86_400, suffix: 'd' },
    { seconds: 3_600, suffix: 'h' },
    { seconds: 60, suffix: 'm' },
  ];
  const unit = units.find((candidate) => elapsedSeconds >= candidate.seconds);
  if (!unit) return 'Just now';

  return `${Math.floor(elapsedSeconds / unit.seconds)}${unit.suffix} ago`;
}

export default function HousingPage() {
  const { location } = useLocation();
  const [housingData, setHousingData] = useState<HousingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [active] = useState('All');
  const [query, setQuery] = useState('');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('All cities');
  const [citySearch, setCitySearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const availableCities = useMemo(
    () =>
      housingData
        .filter(
          (item) =>
            location.country === 'All' ||
            item.city.split(',').at(-1)?.trim() === location.country,
        )
        .map((item) => item.city)
        .filter((city, index, cities) => cities.indexOf(city) === index)
        .sort(),
    [housingData, location.country],
  );

  const effectiveCity =
    selectedCity === 'All cities' || availableCities.includes(selectedCity)
      ? selectedCity
      : 'All cities';

  const modalCities = availableCities.filter((city) =>
    city.toLowerCase().includes(citySearch.trim().toLowerCase()),
  );

  const listings = useMemo(
    () =>
      housingData.filter((item) => {
        const normalizedQuery = query.toLowerCase();
        const matchesSearch = `${item.title} ${item.city} ${item.type}`
          .toLowerCase()
          .includes(normalizedQuery);
        const matchesFilter =
          active === 'All' ||
          (active === 'Near Me' && item.nearMe) ||
          (active === 'PG' && item.type === 'PG') ||
          (active === 'Room Share' && item.type === 'Room Share') ||
          (active === 'Whole Place' && item.type === 'Whole place') ||
          (active === '₹10K–₹20K' && item.rent.includes('14,000'));
        const matchesCountry =
          location.country === 'All' ||
          item.city.split(',').at(-1)?.trim() === location.country;
        const matchesCity =
          effectiveCity === 'All cities' || item.city === effectiveCity;

        return matchesSearch && matchesFilter && matchesCountry && matchesCity;
      }),
    [active, effectiveCity, housingData, location.country, query],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccommodation() {
      try {
        setLoading(true);
        setLoadError(null);
        const response = await fetch('/api/v1/models/MCS_Accommodation?top=100', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Accommodation API returned ${response.status}`);
        }

        const payload: unknown = await response.json();
        const records = accommodationRecordsFromPayload(payload);
        setHousingData(
          records
            .filter((record) => record.IsActive !== false)
            .map(accommodationToHousingCard)
            .filter((listing) => Boolean(listing.id)),
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Unable to load accommodation listings:', error);
        setHousingData([]);
        setLoadError('Live accommodation listings are temporarily unavailable.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAccommodation();
    return () => controller.abort();
  }, []);
  const visibleListings = listings.slice(0, visibleCount);
  const hasMore = visibleCount < listings.length;

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) =>
            Math.min(count + PAGE_SIZE, listings.length),
          );
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, listings.length]);

  const selectCity = (city: string) => {
    setSelectedCity(city);
    setVisibleCount(PAGE_SIZE);
    setLocationModalOpen(false);
  };

  return (
    <div className={styles.shell}>
      <div className={styles.topRow}>
        <div>
          <p className={styles.eyebrow}>Trusted community listings</p>
          <h1 className={styles.title}>Housing &amp; PG</h1>
          <p className={styles.subtitle}>
            Find trusted accommodation in your city
          </p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.postButton} href="/housing/post">
            <Plus size={16} />
            Post Property
          </Link>
        </div>
      </div>

      <div className={styles.search}>
        <Search size={17} color="#9a8d7e" />
        <input
          aria-label="Search housing"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search city, area, property type..."
        />
        <button
          type="button"
          className={styles.locationFilterButton}
          aria-label="Filter by country and city"
          onClick={() => setLocationModalOpen(true)}
        >
          <SlidersHorizontal size={17} />
          {effectiveCity !== 'All cities' && <span />}
        </button>
      </div>

      <div className={styles.trustBanner}>
        <div>
          <strong>Find a home away from home {'\u{1F3E0}'}</strong>
          <span>Verified listings from trusted community members</span>
        </div>
        <div className={styles.stats}>
          <div>
            <b>500+</b>
            <small>Listings</small>
          </div>
          <div>
            <b>48 cities</b>
            <small>Worldwide</small>
          </div>
          <div>
            <b>Zero fees</b>
            <small>Community-first</small>
          </div>
        </div>
      </div>

      <div className={styles.filters} />

      <div className={styles.sectionHead}>
        <div>
          <h2>Listings Near You</h2>
          <p>{listings.length} verified homes available</p>
        </div>
        <span className={styles.subtitle}>Newest first</span>
      </div>

      {loadError && <div className={styles.loadWarning}>{loadError}</div>}

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.empty}>Loading accommodation listings...</div>
        ) : listings.length ? (
          visibleListings.map((item) => (
            <article className={styles.card} key={item.id}>
              <Link href={`/housing/${item.id}`} className={styles.photoWrap}>
                <img
                  className={styles.photo}
                  src={item.image}
                  alt={item.title}
                />
                <div className={styles.cardBadges} />
                <span className={styles.availableBadge}>
                  From {item.availableFrom
                    ? new Date(item.availableFrom).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : ""}
                </span>
              </Link>

              <div className={styles.cardBody}>
                <div className={styles.cardTitleRow}>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <span className={styles.price}>{item.rent}</span>
                </div>

                <div className={styles.propertyFacts}>
                  <span>
                    <MapPin size={13} />
                    {item.city}
                  </span>
                  <span>
                    <BedDouble size={14} />
                    {item.beds.toLowerCase()}
                  </span>
                  <span>
                    <Bath size={14} />
                    {item.baths.toLowerCase()}
                  </span>
                  <span>
                    <Maximize2 size={13} />
                    {item.area}
                  </span>
                </div>

                <div className={styles.amenities}>
                  {item.amenities.slice(0, 3).map((amenity) => {
                    const isFoodAmenity =
                      amenity.toLowerCase().includes('food') ||
                      amenity.toLowerCase().includes('meal');

                    return (
                      <span key={amenity}>
                        {amenity === 'WiFi' ? (
                          <Wifi size={13} />
                        ) : isFoodAmenity ? (
                          <Utensils size={13} />
                        ) : (
                          <Car size={13} />
                        )}
                        {amenity.replace('/Meals', '')}
                      </span>
                    );
                  })}
                </div>

                <div className={styles.host}>
                  <div className={styles.avatar}>{'\u2659'}</div>
                  <span className={styles.hostName}>
                    {item.host}
                    <small>{relativeTime(item.created)}</small>
                  </span>
                  <Link
                    className={styles.chatAction}
                    href={housingChatHref({
                      ownerId: item.ownerId,
                      host: item.host,
                      ownerEmail: item.ownerEmail,
                      propertyId: item.id,
                      propertyTitle: item.title,
                      propertyPrice: item.rent,
                      propertyLocation: item.city,
                    })}
                  >
                    <MessageSquare size={13} />
                    Chat
                  </Link>
                  <Link
                    className={styles.miniAction}
                    href={`/housing/${item.id}`}
                  >
                    View
                  </Link>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className={styles.empty}>
            No listings match your search. Try another city or filter.
          </div>
        )}
      </div>

      {!loading && hasMore && (
        <div
          ref={loadMoreRef}
          className={styles.loadMore}
          role="status"
          aria-label="Loading more properties"
        >
          <span />
          <span />
          <span />
        </div>
      )}

      {!loading && !hasMore && listings.length > PAGE_SIZE && (
        <p className={styles.endMessage}>
          You have viewed all available properties
        </p>
      )}

      {locationModalOpen && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={() => setLocationModalOpen(false)}
        >
          <div
            className={styles.locationModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="housing-location-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 id="housing-location-title">Select a city</h2>
                <p>
                  {location.country === 'All'
                    ? 'Search cities across all countries'
                    : `Showing cities in ${location.country}`}
                </p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                aria-label="Close city filter"
                onClick={() => setLocationModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <label className={styles.modalSearch}>
              <Search size={16} />
              <input
                type="search"
                value={citySearch}
                onChange={(event) => setCitySearch(event.target.value)}
                placeholder={
                  location.country === 'All'
                    ? 'Search all cities...'
                    : `Search cities in ${location.country}...`
                }
                autoFocus
              />
            </label>

            <div className={styles.cityList}>
              <button
                type="button"
                className={`${styles.cityOption} ${
                  effectiveCity === 'All cities' ? styles.cityActive : ''
                }`}
                onClick={() => selectCity('All cities')}
              >
                {location.country === 'All'
                  ? 'All cities'
                  : `All cities in ${location.country}`}
              </button>

              {modalCities.map((city) => (
                <button
                  type="button"
                  className={`${styles.cityOption} ${
                    effectiveCity === city ? styles.cityActive : ''
                  }`}
                  key={city}
                  onClick={() => selectCity(city)}
                >
                  {city}
                </button>
              ))}

              {modalCities.length === 0 && (
                <div className={styles.noCities}>No matching cities found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
