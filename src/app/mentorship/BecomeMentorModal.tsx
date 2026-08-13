'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Btn, Field, Modal, useGlobalToast } from '@/components/primitives';

type Option = { id: string | number; name?: string; Name?: string; ISO_Code?: string; CurSymbol?: string };
const empty = {
  name: '', description: '', bio: '', industry: '', sessionRate: '0',
  yearsExperience: '', designation: '', companyName: '', languages: '',
  categoryId: '', currencyId: '',
};

export default function BecomeMentorModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated?: () => Promise<void> }) {
  const [form, setForm] = useState(empty);
  const [categories, setCategories] = useState<Option[]>([]);
  const [currencies, setCurrencies] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const toast = useGlobalToast();
  const set = (key: keyof typeof empty, value: string) => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!isOpen || (categories.length && currencies.length)) return;
    const controller = new AbortController();
    Promise.all([
      fetch('/api/data/mentorship-categories', { signal: controller.signal }).then(response => response.ok ? response.json() : Promise.reject(new Error('Could not load mentorship categories'))),
      fetch('/api/v1/models/C_Currency', { signal: controller.signal }).then(response => response.ok ? response.json() : Promise.reject(new Error('Could not load currencies'))),
    ])
      .then(([categoryData, currencyData]: [Option[], { records?: Option[] }]) => {
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        setCurrencies(currencyData.records || []);
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        toast.add(error instanceof Error ? error.message : 'Could not load form options.', 'error');
      })
      .finally(() => setLoadingOptions(false));
    return () => controller.abort();
  }, [categories.length, currencies.length, isOpen, toast]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let user: { id?: number; isGuest?: boolean } = {};
    try { user = JSON.parse(localStorage.getItem('mcs_user') || '{}'); } catch {}
    if (!Number(user.id) || user.isGuest) { router.push('/login'); return; }

    setSubmitting(true);
    try {
      const response = await fetch('/api/v1/models/MCS_Mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          C_Currency_ID: { id: Number(form.currencyId) },
          MCS_Mentorship_Category_ID: { id: Number(form.categoryId) },
          Name: form.name,
          Description: form.description,
          MCS_Bio: form.bio,
          MCS_Industry: form.industry,
          MCS_IsVerified: false,
          MCS_SessionRate: Number(form.sessionRate) || 0,
          MCS_YearsExperience: Number(form.yearsExperience) || 0,
          IsActive: true,
          MCS_Designation: form.designation,
          MCS_CompanyName: form.companyName,
          MCS_Languages: form.languages,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create mentor profile');
      const mentorId = Number(result.id || result.MCS_Mentor_ID);
      if (mentorId) localStorage.setItem('MCS_Mentor_ID', String(mentorId));
      toast.add('Mentor profile created successfully.', 'success');
      setForm(empty);
      onClose();
      await onCreated?.();
    } catch (error) {
      toast.add(error instanceof Error ? error.message : 'Could not create mentor profile.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Become a Mentor" width={760}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Field label="Display name" value={form.name} onChange={value => set('name', value)} placeholder="KotToTech" />
          <Field label="Mentorship category" value={form.categoryId} onChange={value => set('categoryId', value)} options={categories.map(category => ({ value: String(category.id), label: category.name || category.Name || 'Mentorship' }))} placeholder={loadingOptions ? 'Loading...' : 'Select category'} />
          <Field label="Currency" value={form.currencyId} onChange={value => set('currencyId', value)} options={currencies.map(currency => ({ value: String(currency.id), label: [currency.ISO_Code, currency.CurSymbol, currency.Name].filter(Boolean).join(' - ') || 'Currency ' + currency.id }))} placeholder={loadingOptions ? 'Loading...' : 'Select currency'} />
          <Field label="Industry" value={form.industry} onChange={value => set('industry', value)} placeholder="IT Industry" />
          <Field label="Designation" value={form.designation} onChange={value => set('designation', value)} placeholder="Data Scientist" />
          <Field label="Company name" value={form.companyName} onChange={value => set('companyName', value)} placeholder="Google" />
          <Field label="Years of experience" type="number" value={form.yearsExperience} onChange={value => set('yearsExperience', value)} />
          <Field label="Session rate" type="number" value={form.sessionRate} onChange={value => set('sessionRate', value)} />
          <Field label="Languages" value={form.languages} onChange={value => set('languages', value)} placeholder="Marathi, Hindi" />
        </div>
        <Field label="Description" multiline value={form.description} onChange={value => set('description', value)} placeholder="Mentor profile description" />
        <Field label="Bio" multiline value={form.bio} onChange={value => set('bio', value)} placeholder="Tell members about your mentoring experience" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn kind="ghost" size="md" disabled={submitting} onClick={event => { event.preventDefault(); onClose(); }}>Cancel</Btn>
          <Btn kind="primary" size="md" disabled={submitting || loadingOptions} onClick={() => undefined}>{submitting ? 'Creating profile...' : 'Become a mentor'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
