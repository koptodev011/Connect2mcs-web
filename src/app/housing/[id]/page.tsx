'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Armchair,
  ArrowLeft,
  Bath,
  BedDouble,
  Car,
  ChevronRight,
  CookingPot,
  Trash2,
  MapPin,
  MessageCircle,
  Pencil,
  Ruler,
  Share2,
  Snowflake,
  WashingMachine,
  Wifi,
} from 'lucide-react';
import styles from '../housing.module.css';
import { housingChatHref } from '@/lib/housing-chat';
import {
  accommodationRecordsFromPayload,
  accommodationToHousingCard,
  type HousingCard,
} from '../housing-data';

interface HousingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function HousingDetailPage({ params }: HousingDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<HousingCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [currentUserId] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const user = JSON.parse(localStorage.getItem('mcs_user') || '{}') as {
        id?: number | string;
      };
      return String(user.id || '');
    } catch {
      return '';
    }
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/v1/models/MCS_Accommodation?top=100', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error('Could not load accommodation')),
      )
      .then((payload: unknown) => {
        const listing = accommodationRecordsFromPayload(payload)
          .map(accommodationToHousingCard)
          .find((record) => record.id === id);
        setItem(listing ?? null);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error('Unable to load accommodation details:', error);
          setItem(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return <div className={styles.empty}>Loading property details...</div>;
  }

  if (!item) {
    return (
      <div className={styles.empty}>
        Property not found. <Link href="/housing">Back to Housing</Link>
      </div>
    );
  }

  const photos = item.images;

  const deleteProperty = async () => {
    if (
      !window.confirm(
        'Delete this property permanently? This action cannot be undone.',
      )
    ) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/v1/models/MCS_Accommodation/${id}`, {
        method: 'DELETE',
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || 'Could not delete property.');
      }
      router.push('/housing');
      router.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Could not delete property.',
      );
      setDeleting(false);
    }
  };
  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: item.title, url: window.location.href });
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className={styles.shell}>
      <div className={styles.detailTop}>
        <Link className={styles.back} href="/housing">
          <ArrowLeft size={17} />
          Property Details
        </Link>
        <div className={styles.detailActions}>
          {currentUserId && currentUserId === item.ownerId && (
            <>
              <Link
                className={styles.editPropertyButton}
                href={`/housing/${item.id}/edit`}
              >
                <Pencil size={15} />
                Edit
              </Link>
              <button
                className={styles.detailDeleteButton}
                type="button"
                disabled={deleting}
                onClick={deleteProperty}
              >
                <Trash2 size={15} />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
          <button
            className={styles.roundButton}
            type="button"
            onClick={share}
            aria-label="Share"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {deleteError && <div className={styles.formError}>{deleteError}</div>}

      <div className={styles.detailGrid}>
        <div className={styles.gallery}>
          <div className={styles.heroPhoto}>
            <img src={item.image} alt={item.title} />
          </div>
          <div className={styles.thumbs}>
            {photos.map((photo, index) => (
              <img
                src={photo}
                alt={`Property view ${index + 1}`}
                key={photo}
              />
            ))}
          </div>
        </div>

        <aside className={styles.panel}>
          <div className={styles.detailPrice}>
            {item.rent} <small></small>
          </div>
          <h1 className={styles.detailTitle}>{item.title}</h1>
          <div className={styles.location}>
            <MapPin size={12} />
            {item.city}
          </div>

          <div className={styles.specs}>
            <div>
              <BedDouble size={18} />
              <b>{item.beds}</b>
              <span>Bedrooms</span>
            </div>
            <div>
              <Bath size={18} />
              <b>{item.baths}</b>
              <span>Bathrooms</span>
            </div>
            <div>
              <Ruler size={18} />
              <b>{item.area}</b>
              <span>Area</span>
            </div>
          </div>

          <div className={styles.block}>
            <h3>Amenities</h3>
            {item.amenities.length > 0 ? (
              <div className={styles.amenityGrid}>
                {item.amenities.map((amenity) => (
                  <div className={styles.amenityItem} key={amenity}>
                    {amenity === 'WiFi' && <Wifi size={16} />}
                    {amenity === 'Kitchen Access' && <CookingPot size={16} />}
                    {amenity === 'Laundry' && <WashingMachine size={16} />}
                    {amenity === 'Furnished' && <Armchair size={16} />}
                    {amenity === 'Parking' && <Car size={16} />}
                    {amenity === 'A/C' && <Snowflake size={16} />}
                    {amenity}
                  </div>
                ))}
              </div>
            ) : (
              <p>No amenities listed.</p>
            )}
          </div>

          <div className={styles.block}>
            <h3>About this Property</h3>
            <p>{item.description}</p>
          </div>

          <div className={styles.block}>
            <h3>Posted by</h3>
            <div className={styles.poster}>
              <div className={styles.avatar}>
                {item.host
                  .split(' ')
                  .map((name) => name[0])
                  .join('')}
              </div>
              <div className={styles.posterDetails}>
                {item.host}
                <small>Community member · Identity verified</small>
              </div>
              <Link
                className={styles.posterChatButton}
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
                <MessageCircle size={15} />
                Chat
              </Link>
              <ChevronRight size={16} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
