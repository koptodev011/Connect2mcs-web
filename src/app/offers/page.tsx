'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import QRCode from 'qrcode';
import { C } from '@/lib/tokens';
import Icon from '@/components/Icon';
import { Btn, Card, Pill, Tag, ImgPh, SectionHead, PageHeader, Modal, Field, useGlobalToast } from '@/components/primitives';
import type { Offer } from '@/data/offers';
import { NotifyMeModal } from '@/components/FormModals';
import { useLocation } from '@/components/LocationContext';
import styles from './page.module.css';

const PAGE_SIZE = 6;

type ModelRef = { id?: number; identifier?: string };
interface ApiCategory { id: number; IsActive?: boolean; Name?: string }
interface SelectOption { id: string; name: string }
interface ApiOffer {
  id: number; IsActive?: boolean; Name?: string;
  MCS_Offers_Category_ID?: ModelRef; C_BPartner_ID?: ModelRef;
  MCS_PromoCode?: string; ValidFrom?: string; ValidTo?: string; MCS_Savings?: number; MCS_TotalQuantity?: number;
  Description?: string; MCS_description?: string; MCS_ClaimedCount?: number; MCS_IsNew?: boolean;
  AD_Image_ID?: ModelRef; AD_User_ID?: ModelRef | number; C_Country_ID?: ModelRef; C_City_ID?: ModelRef;
}
type OfferView = Offer & { image?: string; imageId?: number; ownerId?: number; categoryId?: number; description: string; savingsValue: number; totalQuantity: number; validFrom: string; validTo: string; countryId: string; cityId: string };
interface OffersResponse {
  records?: ApiOffer[];
  'row-count'?: number;
}
interface CreateOfferForm {
  name: string; description: string; promoCode: string; savings: string; totalQuantity: string;
  validFrom: string; validTo: string; categoryId: string; countryId: string; cityId: string; imageId: string;
}
const emptyCreateForm: CreateOfferForm = {
  name: '', description: '', promoCode: '', savings: '0', totalQuantity: '0',
  validFrom: '', validTo: '', categoryId: '', countryId: '', cityId: '', imageId: '',
};

function SearchableSelect({ label, options, value, onChange, placeholder, disabled, loading }: {
  label: string; options: SelectOption[]; value: string; onChange: (value: string) => void;
  placeholder: string; disabled?: boolean; loading?: boolean;
}) {
  const listId = `offer-${label.toLowerCase().replace(/\s+/g, '-')}-options`;
  const selected = options.find(option => option.id === value);
  const [query, setQuery] = useState(selected?.name || '');


  return (
    <label className={styles.searchField}>
      <span>{label}</span>
      <input
        list={listId}
        value={query}
        disabled={disabled}
        placeholder={loading ? 'Loading...' : placeholder}
        onChange={event => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          const match = options.find(option => option.name.toLowerCase() === nextQuery.trim().toLowerCase());
          onChange(match?.id || '');
        }}
      />
      <datalist id={listId}>
        {options.map(option => <option key={option.id} value={option.name} />)}
      </datalist>
    </label>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.substring(result.indexOf(',') + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read the selected image'));
    reader.readAsDataURL(file);
  });
}
const presentationByCategory: Record<string, Pick<Offer, 'tone' | 'kind'>> = {
  'Food & Dining': { tone: 'brick', kind: 'food' }, Travel: { tone: 'saffron', kind: 'event' },
  Finance: { tone: 'blue', kind: 'job' }, Grocery: { tone: 'green', kind: 'food' },
  Health: { tone: 'pink', kind: 'people' }, Legal: { tone: 'sand', kind: 'study' }, Tech: { tone: 'green', kind: 'news' },
};

function toOffer(record: ApiOffer): OfferView {
  const cat = record.MCS_Offers_Category_ID?.identifier || 'Other';
  const partner = record.C_BPartner_ID?.identifier || 'MCS Partner';
  const presentation = presentationByCategory[cat] || { tone: 'gold' as const, kind: 'news' as const };
  const expires = record.ValidTo
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${record.ValidTo}T00:00:00Z`))
    : 'While stocks last';
  return {
    id: String(record.id), partner, cat, title: record.Name || 'Exclusive member offer',
    desc: `An exclusive Connect2MCS member offer from ${partner}.`,
    code: record.MCS_PromoCode || 'CONTACT MCS', expires,
    savings: record.MCS_Savings != null ? `Save ${record.MCS_Savings.toLocaleString()}` : 'Member benefit',
    claimed: record.MCS_ClaimedCount || 0, new: record.MCS_IsNew === true,
    image: record.AD_Image_ID?.id ? '/api/image/' + record.AD_Image_ID.id : undefined, imageId: record.AD_Image_ID?.id,
    ownerId: Number(typeof record.AD_User_ID === 'object' ? record.AD_User_ID?.id : record.AD_User_ID) || undefined,
    categoryId: record.MCS_Offers_Category_ID?.id, description: record.MCS_description || record.Description || '',
    savingsValue: record.MCS_Savings || 0, totalQuantity: record.MCS_TotalQuantity || 0, validFrom: record.ValidFrom || '', validTo: record.ValidTo || '',
    countryId: String(record.C_Country_ID?.id || ''), cityId: String(record.C_City_ID?.id || ''), ...presentation,
  };
}

export default function OffersPage() {
  const [offersData, setOffersData] = useState<OfferView[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [countries, setCountries] = useState<SelectOption[]>([]);
  const [cities, setCities] = useState<SelectOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeCat, setActiveCat] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState(0);
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);
  const [qrOffer, setQrOffer] = useState<OfferView | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrExpiresAt, setQrExpiresAt] = useState(0);
  const [creating, setCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [createForm, setCreateForm] = useState<CreateOfferForm>(emptyCreateForm);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const toast = useGlobalToast();
  const router = useRouter();
  const { location } = useLocation();

  const loadOffers = useCallback(async (skip: number, replace: boolean, signal?: AbortSignal) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);
    try {
      const response = await fetch(`/api/v1/models/MCS_Offers?top=${PAGE_SIZE}&skip=${skip}&_=${Date.now()}`, { signal, cache: 'no-store' });
      if (!response.ok) throw new Error(`Offers request failed: ${response.status}`);
      const data = await response.json() as OffersResponse;
      const records = (data.records || []).filter(record => record.IsActive !== false).map(toOffer);
      setOffersData(current => replace ? records : [...current, ...records]);
      setHasMore(skip + records.length < (data['row-count'] || 0));
      setLoadError(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Could not load offers:', error);
      setLoadError(true);
    } finally {
      if (replace) setLoading(false);
      else setLoadingMore(false);
    }
  }, []);


  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try { setCurrentUserId(Number(JSON.parse(localStorage.getItem('mcs_user') || '{}').id) || 0); } catch { setCurrentUserId(0); }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void loadOffers(0, true, controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadOffers, location.country]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/v1/models/MCS_Offers_Category', { signal: controller.signal })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`Offer categories request failed: ${res.status}`)))
      .then((data: { records?: ApiCategory[] } | ApiCategory[]) => {
        const records = Array.isArray(data) ? data : data.records || [];
        setCategories(records.filter(category => category.IsActive !== false && category.Name?.trim()));
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Could not load offer categories:', error);
      });
    return () => controller.abort();
  }, []);


  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/data/countries', { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Countries request failed')))
      .then((records: Array<{ id: string; name: string }>) => setCountries(records.map(record => ({ id: String(record.id), name: record.name })).filter(record => record.name)))
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Could not load countries:', error);
      })
      .finally(() => setCountriesLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!createForm.countryId) return;
    const controller = new AbortController();
    fetch(`/api/v1/models/C_City?countryId=${encodeURIComponent(createForm.countryId)}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Cities request failed')))
      .then((data: { records?: SelectOption[] }) => setCities(data.records || []))
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Could not load cities:', error);
        setCities([]);
      })
      .finally(() => setCitiesLoading(false));
    return () => controller.abort();
  }, [createForm.countryId]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) void loadOffers(offersData.length, false);
    }, { rootMargin: '240px 0px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadOffers, loading, loadingMore, offersData.length]);

  const filtered = activeCat === 'All' ? offersData : offersData.filter(offer => offer.cat === activeCat);
  const sortedOffers = [...filtered].sort((a, b) => sortBy === 'Popular' ? b.claimed - a.claimed : 0);


  const updateCreateForm = (field: keyof CreateOfferForm, value: string) => {
    setCreateForm(current => ({ ...current, [field]: value }));
  };

  const openCreateModal = () => {
    let user: { id?: string | number; countryId?: string; isGuest?: boolean } = {};
    try { user = JSON.parse(localStorage.getItem('mcs_user') || '{}'); } catch {}
    if (!Number(user.id) || user.isGuest) {
      router.push('/login');
      return;
    }
    setEditingOfferId(null);
    setCities([]);
    setImageFile(null);
    setCitiesLoading(Boolean(user.countryId));
    setCreateForm({
      ...emptyCreateForm,
      countryId: String(user.countryId || ''),
    });
    setCreateOpen(true);
  };

  const openEditModal = (offer: OfferView) => {
    setEditingOfferId(offer.id);
    setImageFile(null);
    setCities([]);
    setCitiesLoading(Boolean(offer.countryId));
    setCreateForm({
      name: offer.title,
      description: offer.description,
      promoCode: offer.code,
      savings: String(offer.savingsValue),
      totalQuantity: String(offer.totalQuantity),
      validFrom: offer.validFrom,
      validTo: offer.validTo,
      categoryId: String(offer.categoryId || ''),
      countryId: offer.countryId,
      cityId: offer.cityId,
      imageId: String(offer.imageId || ''),
    });
    setCreateOpen(true);
  };

  const openQrModal = async (offer: OfferView) => {
    try {
      const response = await fetch('/api/offers/claim-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: Number(offer.id) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not generate claim QR');
      const dataUrl = await QRCode.toDataURL(result.claimUrl, { width: 320, margin: 2, errorCorrectionLevel: 'H' });
      setQrOffer(offer);
      setQrDataUrl(dataUrl);
      setQrExpiresAt(Number(result.expiresAt));
    } catch (error) {
      console.error('QR generation failed:', error);
      toast.add(error instanceof Error ? error.message : 'Could not generate the offer QR code.', 'error');
    }
  };

  const handleDeleteOffer = async (offer: OfferView) => {
    if (!window.confirm(`Delete "${offer.title}"? This cannot be undone.`)) return;
    setDeletingOfferId(offer.id);
    try {
      const response = await fetch(`/api/v1/models/MCS_Offers/${offer.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not delete offer');
      setOffersData(current => current.filter(item => item.id !== offer.id));
      toast.add('Offer deleted.', 'success');
    } catch (error) {
      toast.add(error instanceof Error ? error.message : 'Could not delete offer.', 'error');
    } finally {
      setDeletingOfferId(null);
    }
  };

  const handleCreateOffer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const category = categories.find(item => String(item.id) === createForm.categoryId);
    let userId = '';
    try { userId = String(JSON.parse(localStorage.getItem('mcs_user') || '{}').id || ''); } catch {}
    if (!userId) {
      toast.add('Please sign in before creating an offer.', 'error');
      return;
    }

    setCreating(true);
    try {
      let uploadedImage: { id: number; uid?: string } | null = null;
      if (imageFile) {
        if (!imageFile.type.startsWith('image/')) throw new Error('Please select a valid image file.');
        if (imageFile.size > 5 * 1024 * 1024) throw new Error('Image size must be 5 MB or less.');
        const imageResponse = await fetch('/api/v1/models/ad_image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: imageFile.name, data: await fileToBase64(imageFile) }),
        });
        const imageResult = await imageResponse.json();
        if (!imageResponse.ok) throw new Error(imageResult.error || 'Could not upload image');
        const imageId = Number(imageResult.id || imageResult.AD_Image_ID);
        if (!imageId) throw new Error('Image upload did not return an image ID');
        uploadedImage = { id: imageId, uid: imageResult.uid };
      }

      const response = await fetch(editingOfferId ? '/api/v1/models/MCS_Offers/' + editingOfferId : '/api/v1/models/MCS_Offers', {
        method: editingOfferId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          AD_Image_ID: uploadedImage ? { id: uploadedImage.id, uid: uploadedImage.uid || '', file_name: imageFile?.name || '', data: '' } : { id: Number(createForm.imageId) || 0 },
          AD_Org_ID: { id: 0, identifier: '*' },
          C_BPartner_ID: { id: 0, identifier: '' },
          Description: createForm.description,
          IsActive: true,
          MCS_ClaimedCount: 0,
          MCS_IsNew: true,
          MCS_Mandals_ID: { id: 0, identifier: '' },
          MCS_Offers_Category_ID: { id: Number(createForm.categoryId), identifier: category?.Name || '' },
          MCS_PromoCode: createForm.promoCode,
          MCS_Savings: Number(createForm.savings) || 0,
          MCS_TotalQuantity: Number(createForm.totalQuantity) || 0,
          MCS_description: createForm.description,
          Name: createForm.name,
          ValidFrom: createForm.validFrom,
          ValidTo: createForm.validTo,
          AD_User_ID: userId,
          C_Country_ID: { id: Number(createForm.countryId) || 0, identifier: countries.find(country => country.id === createForm.countryId)?.name || '' },
          C_City_ID: { id: Number(createForm.cityId) || 0 },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create offer');
      toast.add(editingOfferId ? 'Offer updated successfully.' : 'Offer created successfully.', 'success');
      setCreateOpen(false);
      await loadOffers(0, true);
    } catch (error) {
      console.error(editingOfferId ? 'Update offer failed:' : 'Create offer failed:', error);
      toast.add(error instanceof Error ? error.message : editingOfferId ? 'Could not update offer.' : 'Could not create offer.', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="MCS Offers"
        marathi={'\u0938\u0935\u0932\u0924\u0940'}
        subtitle={`${loading ? '...' : offersData.length} exclusive deals for Connect2MCS members \u00b7 updated monthly`}
        actions={<Btn kind="primary" size="md" iconL="plus" onClick={openCreateModal}>Create offer</Btn>}
      />

      <div className={styles.categories}>
        {['All', ...categories.map(category => category.Name!)].map(category => (
          <Pill key={category} active={activeCat === category} onClick={() => setActiveCat(category)}>{category}</Pill>
        ))}
      </div>

      <section>
        <SectionHead
          title="All offers"
          subtitle={`${sortedOffers.length} deal${sortedOffers.length === 1 ? '' : 's'} \u00b7 ${activeCat}`}
          action={
            <select value={sortBy} onChange={event => setSortBy(event.target.value)} className={styles.sortSelect}>
              <option value="Newest">Sort: Newest</option>
              <option value="Popular">Sort: Popular</option>
            </select>
          }
        />

        {loading ? (
          <div className={styles.message}>Loading offers from iDempiere...</div>
        ) : loadError && offersData.length === 0 ? (
          <Card pad={32} className={styles.stateCard}>
            <div className={styles.stateTitle}>Offers could not be loaded</div>
            <p className={styles.stateText}>Please refresh the page and try again.</p>
          </Card>
        ) : filtered.length === 0 && !hasMore ? (
          <Card pad={32} className={styles.stateCard}>
            <div className={styles.stateTitle}>No offers in this category yet</div>
            <p className={styles.stateText}>Check back soon {'\u2014'} new offers added monthly.</p>
          </Card>
        ) : (
          <div className={`${styles.offerGrid} mob-stack`}>
            {sortedOffers.map(offer => (
              <Card key={offer.id} pad={0} interactive className={styles.offerCard}>
                {offer.new && <div className={styles.newBadge}>NEW</div>}
                <ImgPh kind={offer.kind} tone={offer.tone} height={130} src={offer.image}/>
                <div className={styles.cardBody}>
                  {currentUserId > 0 && offer.ownerId === currentUserId && (
                    <div className={styles.ownerActions}>
                      <button type="button" onClick={() => void openQrModal(offer)}>QR</button>
                      <button type="button" onClick={() => openEditModal(offer)}>Edit</button>
                      <button type="button" className={styles.deleteAction} disabled={deletingOfferId === offer.id} onClick={() => void handleDeleteOffer(offer)}>
                        {deletingOfferId === offer.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                  <div className={styles.offerMeta}>{offer.partner} {'\u00b7'} {offer.cat}</div>
                  <h4 className={styles.offerTitle}>{offer.title}</h4>
                  <p className={styles.offerDescription}>{offer.desc}</p>

                  <div className={styles.codeBlock}>
                    <div className={styles.codeContent}>
                      <div className={styles.codeLabel}>Promo code</div>
                      <div className={styles.code}>{offer.code}</div>
                    </div>
                    <Tag color={C.saffronDk} bg={C.saffronLt}>{offer.savings}</Tag>
                  </div>

                  <div className={styles.cardFooter}>
                    <div>
                      <div className={styles.expiry}><Icon name="clock" size={12} color={C.ink3}/> Expires {offer.expires}</div>
                      <div className={styles.claimed}>{offer.claimed.toLocaleString()} members claimed</div>
                    </div>
                    {/* <Btn kind={claimedOffers.has(offer.id) ? 'soft' : 'primary'} size="sm" onClick={() => handleClaim(offer.id, offer.code)}>
                      {claimedOffers.has(offer.id) ? 'Code Copied \u2713' : 'Claim'}
                    </Btn> */}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div ref={loadMoreRef} className={styles.loadMore} aria-hidden={!hasMore}>
          {loadingMore && 'Loading more offers...'}
          {loadError && offersData.length > 0 && <button type="button" className={styles.retryButton} onClick={() => void loadOffers(offersData.length, false)}>Retry loading</button>}
        </div>
      </section>


      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={editingOfferId ? 'Edit offer' : 'Create offer'} width={760}>
        <form className={styles.createForm} onSubmit={handleCreateOffer}>
          <div className={styles.formGrid}>
            <Field label="Offer name" value={createForm.name} onChange={value => updateCreateForm('name', value)} placeholder="Offer title" />
            <Field label="Promo code" value={createForm.promoCode} onChange={value => updateCreateForm('promoCode', value)} placeholder="MCS20" />
            <Field label="Category" value={createForm.categoryId} onChange={value => updateCreateForm('categoryId', value)} options={categories.map(category => ({ value: String(category.id), label: category.Name || `Category ${category.id}` }))} />
            <Field label="Savings" type="number" value={createForm.savings} onChange={value => updateCreateForm('savings', value)} />
            <Field label="Total quantity" type="number" value={createForm.totalQuantity} onChange={value => updateCreateForm('totalQuantity', value)} />
            <Field label="Valid from" type="date" value={createForm.validFrom} onChange={value => updateCreateForm('validFrom', value)} />
            <Field label="Valid to" type="date" value={createForm.validTo} onChange={value => updateCreateForm('validTo', value)} />
            <SearchableSelect key={`country-${createForm.countryId}-${countries.length}`} label="Country" options={countries} value={createForm.countryId} loading={countriesLoading} placeholder="Search and select country" onChange={value => { setCities([]); setCitiesLoading(Boolean(value)); setCreateForm(current => ({ ...current, countryId: value, cityId: '' })); }} />
            <SearchableSelect key={`city-${createForm.cityId}-${cities.length}`} label="City" options={cities} value={createForm.cityId} loading={citiesLoading} disabled={!createForm.countryId} placeholder={createForm.countryId ? 'Search and select city' : 'Select country first'} onChange={value => updateCreateForm('cityId', value)} />
            <label className={styles.fileField}>
              <span>{editingOfferId ? 'Replace offer image' : 'Offer image'}</span>
              <input type="file" accept="image/*" onChange={event => setImageFile(event.target.files?.[0] || null)} />
              <small>{imageFile ? `${imageFile.name} (${(imageFile.size / 1024).toFixed(1)} KB)` : 'JPEG, PNG, WebP or GIF up to 5 MB'}</small>
            </label>
          </div>
          <Field label="Description" multiline value={createForm.description} onChange={value => updateCreateForm('description', value)} />
          <div className={styles.formActions}>
            <Btn kind="ghost" size="md" onClick={event => { event.preventDefault(); setCreateOpen(false); }}>Cancel</Btn>
            <Btn kind="primary" size="md" disabled={creating} onClick={() => undefined}>{creating ? (imageFile ? 'Uploading image...' : editingOfferId ? 'Saving...' : 'Creating...') : editingOfferId ? 'Save changes' : 'Create offer'}</Btn>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(qrOffer)} onClose={() => { setQrOffer(null); setQrDataUrl(''); setQrExpiresAt(0); }} title="Offer claim QR" width={440}>
        {qrOffer && qrDataUrl && (
          <div className={styles.qrModal}>
            <Image src={qrDataUrl} alt={`QR code to claim ${qrOffer.title}`} width={280} height={280} unoptimized />
            <h3>{qrOffer.title}</h3>
            <p>Other logged-in users can scan this code to claim your offer. It expires at {new Date(qrExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</p>
            <a href={qrDataUrl} download={`offer-${qrOffer.id}-qr.png`}>Download QR code</a>
          </div>
        )}
      </Modal>
      <NotifyMeModal isOpen={notifyOpen} onClose={() => setNotifyOpen(false)}/>
    </div>
  );
}