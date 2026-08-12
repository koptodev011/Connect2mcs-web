'use client';

import { FormEvent, useState } from 'react';
import { Btn, Modal, useGlobalToast } from '@/components/primitives';
import { Job } from '@/data/jobs';
import styles from './JobApplicationModal.module.css';

export interface ApplicantProfile {
  name: string;
  email: string;
  phone: string;
}

interface JobApplicationModalProps {
  isOpen: boolean;
  job: Job | null;
  initialProfile: ApplicantProfile;
  onClose: () => void;
  onSubmitted: (jobId: string) => void;
}

export function JobApplicationModal({ isOpen, job, initialProfile, onClose, onSubmitted }: JobApplicationModalProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useGlobalToast();


  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!job || submitting) return;

    const token = localStorage.getItem('mcs_token');
    if (!token) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId: job.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          ...(resume ? { resumeName: resume.name } : {}),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not submit job application');

      onSubmitted(job.id);
      toast.add(result.alreadyApplied ? 'Application already sent' : 'Application sent successfully!', result.alreadyApplied ? 'info' : 'success');
      onClose();
    } catch (error) {
      toast.add(error instanceof Error ? error.message : 'Could not submit job application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !submitting && onClose()} title={`Apply for ${job?.role || 'job'}`} width={540}>
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.field}>
          <span>Name</span>
          <input required value={profile.name} onChange={event => setProfile(current => ({ ...current, name: event.target.value }))} autoComplete="name" />
        </label>
        <label className={styles.field}>
          <span>Email</span>
          <input required type="email" value={profile.email} onChange={event => setProfile(current => ({ ...current, email: event.target.value }))} autoComplete="email" />
        </label>
        <label className={styles.field}>
          <span>Phone</span>
          <input required type="tel" value={profile.phone} onChange={event => setProfile(current => ({ ...current, phone: event.target.value }))} autoComplete="tel" />
        </label>
        <label className={styles.field}>
          <span>Resume <small>Optional</small></span>
          <input type="file" accept=".pdf,.doc,.docx" onChange={event => setResume(event.target.files?.[0] || null)} />
          <small className={styles.hint}>PDF, DOC, or DOCX</small>
        </label>
        <div className={styles.actions}>
          <Btn kind="ghost" size="lg" onClick={event => { event.preventDefault(); onClose(); }} disabled={submitting}>Cancel</Btn>
          <Btn kind="primary" size="lg" onClick={() => {}} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit application'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
