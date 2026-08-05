'use client';

import { useState } from 'react';
import { Modal, Btn, Field } from './primitives';
import { useGlobalToast } from './primitives';
import { C, F } from '@/lib/tokens';
import Icon from './Icon';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

// ── Post a Job Modal ──────────────────────────────────────────────────────────
export function PostJobModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const toast = useGlobalToast();
  const [form, setForm] = useState({ role: '', company: '', location: '', type: 'Full-time', pay: '', exp: '', desc: '', email: '' });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function submit() {
    if (!form.role || !form.company) { toast.add('Please fill in role and company', 'error'); return; }
    toast.add('Job posted successfully! It will be reviewed within 24h.', 'success');
    onClose();
    setForm({ role: '', company: '', location: '', type: 'Full-time', pay: '', exp: '', desc: '', email: '' });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post a Job" marathi="नोकरी जाहीर करा" width={560}>
      <Field label="Job title / Role" value={form.role} onChange={set('role')} placeholder="Senior Software Engineer"/>
      <Field label="Company name" value={form.company} onChange={set('company')} placeholder="Infosys, TCS, your startup…"/>
      <Field label="Location" value={form.location} onChange={set('location')} placeholder="Boston, MA or Remote"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Job type</div>
          <select value={form.type} onChange={e => set('type')(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', background: '#fff', outline: 'none' }}>
            {['Full-time', 'Part-time', 'Contract', 'Internship', 'Volunteer'].map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        <Field label="Pay range" value={form.pay} onChange={set('pay')} placeholder="$80K–$120K or ₹15–20 LPA"/>
      </div>
      <Field label="Experience required" value={form.exp} onChange={set('exp')} placeholder="3–5 years, freshers OK…"/>
      <Field label="Job description" value={form.desc} onChange={set('desc')} multiline placeholder="What does this role involve? Who are you looking for?"/>
      <Field label="Contact email" value={form.email} onChange={set('email')} type="email" placeholder="hr@company.com"/>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn kind="primary" size="md" full onClick={submit}>Post job listing</Btn>
        <Btn kind="ghost" size="md" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── Add Mandal Modal ──────────────────────────────────────────────────────────
export function AddMandalModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const toast = useGlobalToast();
  const [form, setForm] = useState({ name: '', city: '', country: '', est: '', desc: '', contact: '', website: '' });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function submit() {
    if (!form.name || !form.city || !form.country) { toast.add('Please fill name, city, and country', 'error'); return; }
    toast.add('Mandal submitted for review. We\'ll verify and list it within 3 days.', 'success');
    onClose();
    setForm({ name: '', city: '', country: '', est: '', desc: '', contact: '', website: '' });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add a Mandal" marathi="मंडळ जोडा" width={560}>
      <Field label="Organisation name" value={form.name} onChange={set('name')} placeholder="Maharashtra Mandal Toronto"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="City" value={form.city} onChange={set('city')} placeholder="Toronto"/>
        <Field label="Country" value={form.country} onChange={set('country')} placeholder="Canada"/>
      </div>
      <Field label="Year established" value={form.est} onChange={set('est')} placeholder="1985"/>
      <Field label="About the Mandal" value={form.desc} onChange={set('desc')} multiline placeholder="Brief description of the organisation, its activities, and community…"/>
      <Field label="Contact email" value={form.contact} onChange={set('contact')} type="email" placeholder="contact@mandal.org"/>
      <Field label="Website (optional)" value={form.website} onChange={set('website')} placeholder="https://mandal.org"/>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn kind="primary" size="md" full onClick={submit}>Submit for review</Btn>
        <Btn kind="ghost" size="md" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── Host Event Modal ──────────────────────────────────────────────────────────
export function HostEventModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const toast = useGlobalToast();
  const [form, setForm] = useState({ title: '', date: '', time: '', venue: '', city: '', desc: '', organiser: '', price: '', link: '', free: false });
  const set = (k: keyof typeof form) => (v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  function submit() {
    if (!form.title || !form.date || !form.venue) { toast.add('Please fill title, date, and venue', 'error'); return; }
    toast.add('Event submitted! It will appear in the listing after review.', 'success');
    onClose();
    setForm({ title: '', date: '', time: '', venue: '', city: '', desc: '', organiser: '', price: '', link: '', free: false });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Host an Event" marathi="कार्यक्रम आयोजित करा" width={560}>
      <Field label="Event title" value={form.title} onChange={set('title')} placeholder="Gudhi Padwa Celebration 2026"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Date" value={form.date} onChange={set('date')} type="date"/>
        <Field label="Time" value={form.time} onChange={set('time')} placeholder="11:00 AM – 9:00 PM"/>
      </div>
      <Field label="Venue / Location" value={form.venue} onChange={set('venue')} placeholder="Edison Convention Centre"/>
      <Field label="City" value={form.city} onChange={set('city')} placeholder="Edison, NJ"/>
      <Field label="Description" value={form.desc} onChange={set('desc')} multiline placeholder="What's happening? Who's it for? Any highlights…"/>
      <Field label="Organiser / Mandal name" value={form.organiser} onChange={set('organiser')} placeholder="BMM New Jersey"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Ticket price (leave blank if free)" value={form.price} onChange={set('price')} placeholder="$25"/>
        <Field label="External link (RSVP / tickets)" value={form.link} onChange={set('link')} placeholder="https://eventbrite.com/…"/>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn kind="primary" size="md" full onClick={submit}>Submit event</Btn>
        <Btn kind="ghost" size="md" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── Post Listing Modal ────────────────────────────────────────────────────────
export function PostListingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const toast = useGlobalToast();
  const [form, setForm] = useState({ title: '', price: '', cat: 'Electronics', condition: 'Good', city: '', desc: '' });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function submit() {
    if (!form.title || !form.price) { toast.add('Please fill in title and price', 'error'); return; }
    toast.add('Listing posted! Buyers can now contact you.', 'success');
    onClose();
    setForm({ title: '', price: '', cat: 'Electronics', condition: 'Good', city: '', desc: '' });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post a Listing" marathi="जाहिरात द्या" width={520}>
      <Field label="Item title" value={form.title} onChange={set('title')} placeholder="MacBook Pro 2022, Kadhai set…"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Price" value={form.price} onChange={set('price')} placeholder="$250 or Free"/>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Category</div>
          <select value={form.cat} onChange={e => set('cat')(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', background: '#fff', outline: 'none' }}>
            {['Electronics', 'Furniture', 'Books', 'Vehicles', 'Kitchen', 'Clothing', 'Kids & Toys', 'Other'].map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Condition</div>
          <select value={form.condition} onChange={e => set('condition')(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', background: '#fff', outline: 'none' }}>
            {['New', 'Like new', 'Good', 'Used'].map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
        <Field label="Your city" value={form.city} onChange={set('city')} placeholder="Boston, MA"/>
      </div>
      <Field label="Description" value={form.desc} onChange={set('desc')} multiline placeholder="Describe the item, any defects, reason for selling…"/>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn kind="primary" size="md" full onClick={submit}>Post listing</Btn>
        <Btn kind="ghost" size="md" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── Contact Seller Modal ──────────────────────────────────────────────────────
export function ContactModal({ isOpen, onClose, title, subtitle }: { isOpen: boolean; onClose: () => void; title: string; subtitle?: string }) {
  const toast = useGlobalToast();
  const [msg, setMsg] = useState('');

  function submit() {
    if (!msg.trim()) { toast.add('Please write a message', 'error'); return; }
    toast.add('Message sent! You\'ll hear back soon.', 'success');
    setMsg('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width={480}>
      {subtitle && <p style={{ margin: '0 0 16px', fontSize: 13.5, color: C.ink2, fontWeight: 500 }}>{subtitle}</p>}
      <Field label="Your message" value={msg} onChange={setMsg} multiline placeholder="Hi, I'm interested. Is this still available?"/>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn kind="primary" size="md" full onClick={submit}>Send message</Btn>
        <Btn kind="ghost" size="md" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── List Business Modal ───────────────────────────────────────────────────────
export function ListBusinessModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const toast = useGlobalToast();
  const [form, setForm] = useState({ name: '', cat: 'Legal', owner: '', desc: '', city: '', phone: '', website: '', services: '' });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function submit() {
    if (!form.name || !form.owner) { toast.add('Please fill business name and owner name', 'error'); return; }
    toast.add('Business submitted! We\'ll verify and list it within 48h.', 'success');
    onClose();
    setForm({ name: '', cat: 'Legal', owner: '', desc: '', city: '', phone: '', website: '', services: '' });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="List Your Business" marathi="व्यवसाय नोंदवा" width={560}>
      <Field label="Business name" value={form.name} onChange={set('name')} placeholder="Sharma Law Associates"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Category</div>
          <select value={form.cat} onChange={e => set('cat')(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.lineMid}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', background: '#fff', outline: 'none' }}>
            {['Legal', 'Medical', 'Real Estate', 'Finance', 'IT & Tech', 'Restaurant', 'Education', 'Travel', 'Other'].map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
        <Field label="Owner name" value={form.owner} onChange={set('owner')} placeholder="Suresh Sharma"/>
      </div>
      <Field label="City" value={form.city} onChange={set('city')} placeholder="Boston, MA"/>
      <Field label="Services offered" value={form.services} onChange={set('services')} placeholder="Immigration law, visa, green card…"/>
      <Field label="About your business" value={form.desc} onChange={set('desc')} multiline placeholder="Brief description of your services and experience…"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Phone" value={form.phone} onChange={set('phone')} placeholder="+1 617-555-0100" type="tel"/>
        <Field label="Website (optional)" value={form.website} onChange={set('website')} placeholder="https://"/>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn kind="primary" size="md" full onClick={submit}>Submit listing</Btn>
        <Btn kind="ghost" size="md" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── Book / Request Modal (generic) ────────────────────────────────────────────
export function BookModal({ isOpen, onClose, title, marathi, fields, submitLabel = 'Submit request', initialValues, onSubmit }: {
  isOpen: boolean; onClose: () => void; title: string; marathi?: string;
  fields: { key: string; label: string; placeholder?: string; type?: string; multiline?: boolean; options?: { value: string; label: string }[] }[];
  submitLabel?: string;
  initialValues?: Record<string, string>;
  onSubmit?: (form: Record<string, string>) => Promise<void> | void;
}) {
  const toast = useGlobalToast();
  const [form, setForm] = useState<Record<string, string>>(initialValues || {});
  const [submitting, setSubmitting] = useState(false);
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit?.(form);
      toast.add(`${submitLabel} sent successfully!`, 'success');
      setForm({});
      onClose();
    } catch (error) {
      toast.add(error instanceof Error ? error.message : 'Could not send request', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} marathi={marathi} width={480}>
      {fields.map(f => (
        <Field key={f.key} label={f.label} value={form[f.key] || ''} onChange={set(f.key)} placeholder={f.placeholder} type={f.type} multiline={f.multiline} options={f.options}/>
      ))}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn kind="primary" size="md" full onClick={submit}>{submitting ? 'Sending...' : submitLabel}</Btn>
        <Btn kind="ghost" size="md" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── Create Group Modal ────────────────────────────────────────────────────────
export function CreateGroupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const toast = useGlobalToast();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim()) {
      toast.add('Group name is required', 'error');
      return;
    }
    setLoading(true);
    try {
      const newGroup = {
        name: name.trim(),
        members: 1,
        posts: '1 post today',
        tone: ['saffron', 'brick', 'green', 'blue', 'gold'][Math.floor(Math.random() * 5)],
        kind: 'group',
        description: desc.trim(),
        category: cat.trim(),
      };
      await setDoc(doc(db, 'groups', newGroup.name), newGroup);
      toast.add(`Group "${newGroup.name}" created successfully!`, 'success');
      setName('');
      setDesc('');
      setCat('');
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      toast.add('Failed to create group. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a Group" marathi="गट तयार करा" width={480}>
      <Field label="Group name" value={name} onChange={setName} placeholder="Pune Alumni Network"/>
      <Field label="Description" value={desc} onChange={setDesc} multiline placeholder="What is this group about?"/>
      <Field label="Category" value={cat} onChange={setCat} placeholder="Alumni, Culture, Professional, Family…"/>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Btn kind="primary" size="md" full onClick={submit} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Creating...' : 'Create group'}
        </Btn>
        <Btn kind="ghost" size="md" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── Become a Mentor Modal ─────────────────────────────────────────────────────
export function BecomeMentorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BookModal
      isOpen={isOpen} onClose={onClose}
      title="Become a Mentor" marathi="मार्गदर्शक व्हा"
      submitLabel="Apply to mentor"
      fields={[
        { key: 'expertise', label: 'Areas of expertise', placeholder: 'Engineering, Career transitions, Immigration...' },
        { key: 'role', label: 'Current role', placeholder: 'Senior Engineer at Google' },
        { key: 'field', label: 'Field of expertise', placeholder: 'Tech, Design, Medicine…' },
        { key: 'avail', label: 'Availability', placeholder: 'Weekends, 1h/week' },
        { key: 'bio', label: 'Bio / Why you want to mentor', placeholder: '', multiline: true },
      ]}
    />
  );
}

// ── Book a Session Modal ──────────────────────────────────────────────────────
export function BookSessionModal({ isOpen, onClose, mentorName }: { isOpen: boolean; onClose: () => void; mentorName?: string }) {
  const toast = useGlobalToast();
  const [slot, setSlot] = useState('');
  const [msg, setMsg] = useState('');
  const slots = ['Mon 7 Jul · 10:00 AM', 'Mon 7 Jul · 3:00 PM', 'Wed 9 Jul · 11:00 AM', 'Fri 11 Jul · 5:00 PM', 'Sat 12 Jul · 9:00 AM'];

  function submit() {
    if (!slot) { toast.add('Please select a time slot', 'error'); return; }
    toast.add(`Session booked with ${mentorName || 'mentor'} on ${slot}!`, 'success');
    setSlot(''); setMsg(''); onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Book session${mentorName ? ` with ${mentorName}` : ''}`} width={460}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Available slots</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {slots.map(s => (
            <button key={s} onClick={() => setSlot(s)} style={{ padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${slot === s ? C.saffron : C.line}`, background: slot === s ? C.saffronLt : '#fff', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: slot === s ? 700 : 500, color: slot === s ? C.saffronDk : C.ink, fontFamily: 'inherit', transition: 'all 0.12s' }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <Field label="Message for mentor (optional)" value={msg} onChange={setMsg} multiline placeholder="What do you want to discuss?"/>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn kind="primary" size="md" full onClick={submit}>Confirm booking</Btn>
        <Btn kind="ghost" size="md" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── Rate Alert Modal ──────────────────────────────────────────────────────────
export function RateAlertModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BookModal
      isOpen={isOpen} onClose={onClose}
      title="Set a Rate Alert" marathi="दर सूचना"
      submitLabel="Set alert"
      fields={[
        { key: 'currency', label: 'Currency pair', placeholder: 'USD → INR' },
        { key: 'threshold', label: 'Alert me when rate reaches', placeholder: '86.50' },
        { key: 'email', label: 'Email for alerts', placeholder: 'you@email.com', type: 'email' },
      ]}
    />
  );
}

// ── Notify me Modal (offers) ──────────────────────────────────────────────────
export function NotifyMeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BookModal
      isOpen={isOpen} onClose={onClose}
      title="Notify me of new offers"
      submitLabel="Subscribe"
      fields={[
        { key: 'email', label: 'Your email', placeholder: 'you@email.com', type: 'email' },
        { key: 'cats', label: 'Offer categories (optional)', placeholder: 'Food, Travel, Finance…' },
      ]}
    />
  );
}

// ── Partner with us Modal ─────────────────────────────────────────────────────
export function PartnerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BookModal
      isOpen={isOpen} onClose={onClose}
      title="Partner with Connect2MCS"
      submitLabel="Send inquiry"
      fields={[
        { key: 'biz', label: 'Business name', placeholder: 'Your company' },
        { key: 'desc', label: 'Tell us about the partnership', multiline: true, placeholder: 'What offer or deal do you want to feature?' },
      ]}
    />
  );
}

// ── Post Housing Modal ────────────────────────────────────────────────────────
export function PostHousingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BookModal
      isOpen={isOpen} onClose={onClose}
      title="Post a Room / Property" marathi="घर नोंदवा"
      submitLabel="Post listing"
      fields={[
        { key: 'title', label: 'Listing title', placeholder: '2BR near Harvard, roommate wanted' },
        { key: 'city', label: 'City', placeholder: 'Boston, MA' },
        { key: 'rent', label: 'Monthly rent', placeholder: '$1,200 / mo' },
        { key: 'type', label: 'Type', placeholder: 'Roommate / Whole place / Short stay' },
        { key: 'desc', label: 'Description', multiline: true, placeholder: 'Furnishing, rules, nearby transit, move-in date…' },
      ]}
    />
  );
}

// ── Become a Provider Modal (Tiffin) ──────────────────────────────────────────
export function BecomeProviderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BookModal
      isOpen={isOpen} onClose={onClose}
      title="Become a Tiffin Provider" marathi="डबा पुरवठादार"
      submitLabel="Apply"
      fields={[
        { key: 'city', label: 'City', placeholder: 'Boston, MA' },
        { key: 'cuisine', label: 'Cuisine / Speciality', placeholder: 'Maharashtrian home-style, Jain options…' },
        { key: 'capacity', label: 'Daily capacity (meals)', placeholder: '20 tiffins/day' },
        { key: 'price', label: 'Price per meal', placeholder: '$12/meal or $250/month' },
      ]}
    />
  );
}

// ── Tiffin Subscribe Modal ────────────────────────────────────────────────────
export function TiffinSubscribeModal({ isOpen, onClose, providerName, basePrice }: { isOpen: boolean; onClose: () => void; providerName: string; basePrice: string }) {
  const toast = useGlobalToast();
  const [plan, setPlan] = useState('');
  const [meals, setMeals] = useState(1);
  const [addons, setAddons] = useState<Set<string>>(new Set());
  const [address, setAddress] = useState('');

  const plans = [
    { id: 'trial', label: 'Trial Box', price: basePrice, desc: 'One-time box to taste the food before committing.' },
    { id: 'weekly', label: 'Weekly', price: basePrice, desc: '5 days of meals. Cancel anytime week-to-week.' },
    { id: 'monthly', label: 'Monthly', price: basePrice, desc: '20 days of meals. Best value, save 10%.' },
  ];

  const addonList = [
    { id: 'extra-roti', label: 'Extra Roti', price: '+₹20' },
    { id: 'dessert', label: 'Dessert', price: '+₹40' },
    { id: 'salad', label: 'Fresh Salad', price: '+₹30' },
    { id: 'buttermilk', label: 'Buttermilk', price: '+₹15' },
  ];

  const toggleAddon = (id: string) => setAddons(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  function submit() {
    if (!plan) { toast.add('Please select a plan', 'error'); return; }
    if (!address.trim()) { toast.add('Please enter your delivery address', 'error'); return; }
    toast.add(`Subscribed to ${providerName} (${plans.find(p => p.id === plan)?.label}, ${meals} meal${meals > 1 ? 's' : ''}/day)!`, 'success');
    setPlan(''); setMeals(1); setAddons(new Set()); setAddress(''); onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Subscribe to ${providerName}`} width={480}>
      {/* Plan selection */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Choose Plan</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {plans.map(p => (
            <button key={p.id} onClick={() => setPlan(p.id)} style={{
              padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${plan === p.id ? C.saffron : C.line}`,
              background: plan === p.id ? C.saffronLt : '#fff', cursor: 'pointer', textAlign: 'left',
              fontFamily: 'inherit', transition: 'all 0.12s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: plan === p.id ? 700 : 600, color: plan === p.id ? C.saffronDk : C.ink }}>{p.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: plan === p.id ? C.saffronDk : C.ink2 }}>{p.price}</span>
              </div>
              <div style={{ fontSize: 12, color: C.ink3, fontWeight: 500, marginTop: 3 }}>{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Meals per day */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Meals per Day</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3].map(n => (
            <button key={n} onClick={() => setMeals(n)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: `1.5px solid ${meals === n ? C.saffron : C.line}`,
              background: meals === n ? C.saffronLt : '#fff', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 14, fontWeight: meals === n ? 700 : 600, color: meals === n ? C.saffronDk : C.ink,
              transition: 'all 0.12s',
            }}>
              {n} meal{n > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Add-ons */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11.5, color: C.ink3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Add-ons (optional)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {addonList.map(a => {
            const active = addons.has(a.id);
            return (
              <button key={a.id} onClick={() => toggleAddon(a.id)} style={{
                padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${active ? C.saffron : C.line}`,
                background: active ? C.saffronLt : '#fff', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? C.saffronDk : C.ink,
                transition: 'all 0.12s', display: 'flex', gap: 6, alignItems: 'center',
              }}>
                <span>{a.label}</span>
                <span style={{ fontSize: 11, color: C.ink3 }}>{a.price}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Delivery address */}
      <Field label="Delivery Address" value={address} onChange={setAddress} multiline placeholder="Full delivery address with apartment number, zip code..."/>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn kind="primary" size="md" full onClick={submit}>Confirm Subscription</Btn>
        <Btn kind="ghost" size="md" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── New Chat Modal ────────────────────────────────────────────────────────────
export function NewChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const toast = useGlobalToast();
  const people = ['Rahul Deshmukh', 'Priya Joshi', 'Suresh Patil', 'Anita Kulkarni', 'Vijay Bhosale', 'Meena Gaikwad'];
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const filtered = people.filter(p => p.toLowerCase().includes(search.toLowerCase()));

  function start() {
    if (!selected) { toast.add('Please select a person', 'error'); return; }
    toast.add(`Chat started with ${selected}`, 'success');
    setSelected(''); setSearch(''); onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Chat" width={400}>
      <Field label="Search people" value={search} onChange={setSearch} placeholder="Name…"/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {filtered.map(p => (
          <button key={p} onClick={() => setSelected(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${selected === p ? C.saffron : C.line}`, background: selected === p ? C.saffronLt : '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.12s' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.saffron, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{p[0]}</div>
            <span style={{ fontSize: 14, fontWeight: selected === p ? 700 : 500, color: selected === p ? C.saffronDk : C.ink }}>{p}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn kind="primary" size="md" full onClick={start}>Start chat</Btn>
        <Btn kind="ghost" size="md" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── Info Modal ───────────────────────────────────────────────────────────────
export function InfoModal({ isOpen, onClose, title, content }: { isOpen: boolean; onClose: () => void; title: string; content: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,14,12,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 24, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>{title}</h2>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: C.bgDeep, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 24, color: C.ink2 }}>
            &times;
          </button>
        </div>
        <div style={{ padding: '32px', fontSize: 14, color: C.ink2, lineHeight: 1.6 }}>
          {content}
        </div>
        <div style={{ padding: '20px 32px', borderTop: `1px solid ${C.line}`, background: C.surfaceAlt, display: 'flex', justifyContent: 'flex-end' }}>
          <Btn kind="primary" size="lg" onClick={onClose}>Got it</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Filter Modal ─────────────────────────────────────────────────────────────
export function FilterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BookModal
      isOpen={isOpen} onClose={onClose}
      title="Advanced Filters" marathi="फिल्टर्स"
      submitLabel="Apply filters"
      fields={[
        { key: 'city', label: 'City', placeholder: 'Boston, MA' },
        { key: 'type', label: 'Accommodation type', placeholder: 'Shared, Private room, Entire place' },
        { key: 'price', label: 'Max Monthly Rent ($)', placeholder: '1500' },
      ]}
    />
  );
}

// ── Apply Modal (Learn Page) ──────────────────────────────────────────────────
export function ApplyModal({ isOpen, onClose, itemName, onSubmit }: { isOpen: boolean; onClose: () => void; itemName: string; onSubmit: (data: { sop: string, link: string }) => void }) {
  const toast = useGlobalToast();
  const [form, setForm] = useState({ sop: '', link: '' });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function submit() {
    if (!form.sop) { toast.add('Please provide a Statement of Purpose', 'error'); return; }
    onSubmit(form);
    toast.add(`Application submitted for ${itemName}!`, 'success');
    onClose();
    setForm({ sop: '', link: '' });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Apply for ${itemName}`} width={560} marathi="अर्ज करा">
      <Field label="Statement of Purpose / Cover Letter" value={form.sop} onChange={set('sop')} multiline placeholder="Why are you a good fit? What are your goals? (Min 100 words)"/>
      <Field label="Portfolio / Resume Link (Optional)" value={form.link} onChange={set('link')} placeholder="https://linkedin.com/in/..."/>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn kind="primary" size="md" full onClick={submit}>Submit Application</Btn>
        <Btn kind="ghost" size="md" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}

// ── Article Modal (News Page) ─────────────────────────────────────────────────
export function ArticleModal({ isOpen, onClose, story }: { isOpen: boolean; onClose: () => void; story: any }) {
  if (!isOpen || !story) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,14,12,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 24, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, width: 32, height: 32, borderRadius: '50%', background: C.bgDeep, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, color: C.ink2 }}>
          &times;
        </button>
        <div style={{ height: 220, background: 'linear-gradient(135deg, #1A1A1A 0%, #333 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)' }}>
          IMAGE PLACEHOLDER
        </div>
        <div style={{ padding: '32px 40px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronDk, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            {story.cat}
          </div>
          <h2 style={{ margin: '0 0 16px', fontFamily: F.display, fontSize: 32, fontWeight: 700, color: C.ink, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            {story.title}
          </h2>
          <div style={{ display: 'flex', gap: 12, fontSize: 13, color: C.ink3, fontWeight: 500, marginBottom: 24, borderBottom: `1px solid ${C.line}`, paddingBottom: 24 }}>
            <span style={{ fontWeight: 600, color: C.ink }}>By {story.author}</span>
            <span>·</span><span>{story.when}</span>
            <span>·</span><span>{story.read}</span>
          </div>
          <p style={{ margin: '0 0 20px', fontSize: 16, color: C.ink2, lineHeight: 1.6 }}>
            {story.excerpt}
          </p>
          <p style={{ margin: '0 0 20px', fontSize: 16, color: C.ink2, lineHeight: 1.6 }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <p style={{ margin: '0', fontSize: 16, color: C.ink2, lineHeight: 1.6 }}>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </div>
      </div>
    </div>
  );
}
