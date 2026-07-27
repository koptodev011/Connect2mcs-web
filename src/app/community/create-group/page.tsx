'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import { Btn, Card, Field, PageHeader, useGlobalToast } from '@/components/primitives';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function CreateGroupPage() {
  const router = useRouter();
  const toast = useGlobalToast();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auth Guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        const saved = localStorage.getItem('mcs_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setCurrentUser({ uid: parsed.name, displayName: parsed.name, email: parsed.name + '@connect2mcs.com' });
          } catch {
            router.push('/login');
          }
        } else {
          router.push('/login');
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !address.trim()) {
      toast.add('Please fill in all fields', 'error');
      return;
    }
    if (!currentUser) return;

    setSubmitting(true);
    try {
      const groupData = {
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        members: [currentUser.uid],
        adminId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add document to groups
      const docRef = await addDoc(collection(db, 'groups'), groupData);
      
      // Update with the generated ID inside document
      await updateDoc(doc(db, 'groups', docRef.id), {
        id: docRef.id
      });

      toast.add(`Community group "${name}" created!`, 'success');
      router.push('/community');
    } catch (err) {
      console.error(err);
      toast.add('Failed to create group', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600, margin: '0 auto' }}>
      <PageHeader
        title="Create Group"
        marathi="गट तयार करा"
        subtitle="Start a new local or interest-based Marathi group"
        actions={
          <Btn kind="outline" size="md" iconL="arrowLeft" onClick={() => router.push('/community')}>
            Back
          </Btn>
        }
      />

      <Card style={{ padding: 28 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <Field
            label="Group Name"
            value={name}
            onChange={setName}
            placeholder="e.g. Pune Tech Founders, Edison Marathi Mandal"
          />

          <Field
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="What is the purpose of this group?"
            multiline
          />

          <Field
            label="Location / Address"
            value={address}
            onChange={setAddress}
            placeholder="e.g. Edison, NJ or Online"
          />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Btn kind="outline" size="md" onClick={() => router.push('/community')} disabled={submitting}>
              Cancel
            </Btn>
            <Btn kind="primary" size="md" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Group'}
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}
