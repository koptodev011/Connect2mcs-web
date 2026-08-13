'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Btn, Field, Modal, useGlobalToast } from '@/components/primitives';

export type EditableWebinar = { id: string; title: string; description: string; help: string; topic: string; date: string; time: string; timeZone: string; paid: boolean; price: number; currencyId: string; imageId: string; statusCode: string; registrationUrl: string };

type Currency = { id: number; Name?: string; ISO_Code?: string; CurSymbol?: string; Description?: string };

const empty = {
  name: '',
  description: '',
  help: '',
  topic: '',
  date: '',
  time: '',
  zone: 'Asia/Kolkata',
  paid: 'false',
  price: '0',
  currencyId: '',
  status: 'D',
  registrationUrl: '',
};

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

export default function CreateWebinarModal({
  isOpen,
  onClose,
  onCreated,
  webinar,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
  webinar?: EditableWebinar | null;
}) {
  const [form, setForm] = useState(() => webinar ? { name: webinar.title, description: webinar.description, help: webinar.help, topic: webinar.topic, date: webinar.date.substring(0, 10), time: webinar.time.replace('Z', '').substring(0, 5), zone: webinar.timeZone || 'Asia/Kolkata', paid: String(webinar.paid), price: String(webinar.price || 0), currencyId: webinar.currencyId, status: webinar.statusCode || 'D', registrationUrl: webinar.registrationUrl || '' } : empty);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useGlobalToast();
  const set = (key: keyof typeof empty, value: string) => setForm(current => ({ ...current, [key]: value }));


  useEffect(() => {
    if (!isOpen || currencies.length) return;
    const controller = new AbortController();

    fetch('/api/v1/models/C_Currency', { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Could not load currencies')))
      .then((data: { records?: Currency[] }) => setCurrencies((data.records || []).filter(currency => currency.id)))
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        toast.add(error instanceof Error ? error.message : 'Could not load currencies.', 'error');
      })
      .finally(() => setCurrenciesLoading(false));
    return () => controller.abort();
  }, [currencies.length, isOpen, toast]);

  const close = () => {
    if (busy) return;
    setImageFile(null);
    onClose();
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let user: { id?: number; isGuest?: boolean; linkedProfileIds?: { MCS_Mentor_ID?: string | number } } = {};
    try { user = JSON.parse(localStorage.getItem('mcs_user') || '{}'); } catch {}
    if (!Number(user.id) || user.isGuest) {
      router.push('/login');
      return;
    }

    const mentorId = Number(localStorage.getItem('MCS_Mentor_ID') || user.linkedProfileIds?.MCS_Mentor_ID);
    if (!mentorId) {
      toast.add('Only users with an active mentor profile can create webinars.', 'error');
      return;
    }

    setBusy(true);
    try {
      let imageId = 0;
      if (imageFile) {
        if (!imageFile.type.startsWith('image/')) throw new Error('Please select a valid image file.');
        if (imageFile.size > 5 * 1024 * 1024) throw new Error('Image size must be 5 MB or less.');

        const imageResponse = await fetch('/api/v1/models/ad_image', {
          method: webinar ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: imageFile.name,
            data: await fileToBase64(imageFile),
          }),
        });
        const imageResult = await imageResponse.json();
        if (!imageResponse.ok) throw new Error(imageResult.error || 'Could not upload webinar image');
        imageId = Number(imageResult.id || imageResult.AD_Image_ID);
        if (!imageId) throw new Error('Image upload did not return an image ID');
      }

      const response = await fetch(webinar ? '/api/v1/models/MCS_MentorWebinar/' + webinar.id : '/api/v1/models/MCS_MentorWebinar', {
        method: webinar ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Name: form.name,
          Description: form.description,
          Help: form.help,
          MCS_Mentor_ID: { id: mentorId },
          MCS_Topic: form.topic,
          MCS_StartDate: new Date(`${form.date}T${form.time || '00:00'}:00`).toISOString(),
          MCS_time: `${form.time || '00:00'}:00Z`,
          MCS_TimeZone: form.zone,
          MCS_IsPaid: form.paid === 'true',
          Price: form.paid === 'true' ? Number(form.price) : 0,
          C_Currency_ID: { id: Number(form.currencyId) },
          AD_Image_ID: imageId ? { id: imageId } : undefined,
          MCS_Status: form.status,
          URL: form.registrationUrl.trim(),
          IsActive: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (webinar ? 'Could not update webinar' : 'Could not create webinar'));
      toast.add(webinar ? 'Webinar updated successfully.' : 'Webinar created successfully.', 'success');
      setForm(empty);
      setImageFile(null);
      onClose();
      await onCreated();
    } catch (error) {
      toast.add(error instanceof Error ? error.message : 'Could not create webinar.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title={webinar ? "Edit webinar" : "Create webinar"} width={760}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Field label="Webinar name" value={form.name} onChange={value => set('name', value)} />
          <Field label="Topic" value={form.topic} onChange={value => set('topic', value)} />
          <Field label="Status" value={form.status} onChange={value => set('status', value)} options={[{ value: 'D', label: 'Draft' }, { value: 'P', label: 'Published' }, { value: 'C', label: 'Completed' }]} />
          <Field label="Start date" type="date" value={form.date} onChange={value => set('date', value)} />
          <Field label="Time" type="time" value={form.time} onChange={value => set('time', value)} />
          <Field label="Time zone" value={form.zone} onChange={value => set('zone', value)} />
          <Field label="Registration URL" type="url" value={form.registrationUrl} onChange={value => set('registrationUrl', value)} placeholder="https://example.com/register" />
          <Field label="Pricing" value={form.paid} onChange={value => set('paid', value)} options={[{ value: 'false', label: 'Free' }, { value: 'true', label: 'Paid' }]} />
          {form.paid === 'true' && <Field label="Price" type="number" value={form.price} onChange={value => set('price', value)} />}
          {form.paid === 'true' && <Field label="Currency" value={form.currencyId} onChange={value => set('currencyId', value)} options={currencies.map(currency => ({ value: String(currency.id), label: [currency.ISO_Code, currency.CurSymbol, currency.Name || currency.Description].filter(Boolean).join(' · ') || 'Currency ' + currency.id }))} placeholder={currenciesLoading ? 'Loading currencies...' : 'Select currency'} />}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 7, color: '#3a342b', fontSize: 12, fontWeight: 700 }}>
            Webinar image
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={event => setImageFile(event.target.files?.[0] || null)}
              style={{ padding: 10, border: '1px solid rgba(15,14,12,.14)', borderRadius: 10, background: '#fff' }}
            />
            <small style={{ color: '#6b6256', fontWeight: 500 }}>
              {imageFile ? `${imageFile.name} (${(imageFile.size / 1024).toFixed(1)} KB)` : 'JPEG, PNG, WebP or GIF up to 5 MB'}
            </small>
          </label>
        </div>
        <Field label="Description" multiline value={form.description} onChange={value => set('description', value)} />
        <Field label="Host note" multiline value={form.help} onChange={value => set('help', value)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn kind="ghost" size="md" disabled={busy} onClick={event => { event.preventDefault(); close(); }}>Cancel</Btn>
          <Btn kind="primary" size="md" disabled={busy} onClick={() => undefined}>{busy ? (imageFile ? 'Uploading image...' : webinar ? 'Saving...' : 'Creating...') : webinar ? 'Save changes' : 'Create webinar'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
