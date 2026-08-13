import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@/lib/firebase';

export interface AccommodationChatContext {
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  propertyId: string;
  propertyTitle: string;
  propertyPrice: string;
  propertyLocation: string;
}

interface CommunityUser {
  uid: string;
  name?: string;
  displayName?: string;
  email?: string;
  erpUserId?: string | number;
  adUserId?: string | number;
}

function normalized(value?: string | number) {
  return String(value ?? '').trim().toLowerCase();
}

export async function getOrCreateAccommodationChat(
  currentUser: User,
  context: AccommodationChatContext,
) {
  const snapshot = await getDocs(collection(db, 'users'));
  const users = snapshot.docs.map(
    (entry) => ({ uid: entry.id, ...entry.data() }) as CommunityUser,
  );
  const ownerEmail = normalized(context.ownerEmail);
  const ownerId = normalized(context.ownerId);
  const ownerName = normalized(context.ownerName);
  const owner = users.find((user) => {
    const ids = [user.uid, user.erpUserId, user.adUserId].map(normalized);
    return (
      (ownerEmail && normalized(user.email) === ownerEmail) ||
      (ownerId && ids.includes(ownerId)) ||
      (ownerName &&
        [user.name, user.displayName].map(normalized).includes(ownerName))
    );
  });

  if (!owner) {
    throw new Error('The property owner has not activated chat yet.');
  }
  if (owner.uid === currentUser.uid) {
    throw new Error('You cannot start a chat with yourself.');
  }

  const participants = [currentUser.uid, owner.uid].sort();
  const chatSnapshot = await getDocs(
    query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
    ),
  );
  const existing = chatSnapshot.docs.find((entry) => {
    const values = (entry.data().participants as unknown[] | undefined) || [];
    return values.map(String).sort().join('|') === participants.join('|');
  });

  const currentDetails = {
    name: currentUser.displayName || currentUser.email || 'Community Member',
    email: currentUser.email || '',
  };
  const ownerDetails = {
    uid: owner.uid,
    name: owner.name || owner.displayName || context.ownerName,
    email: owner.email || context.ownerEmail || '',
    userType: 'Property Host',
    propertyId: context.propertyId,
    propertyTitle: context.propertyTitle,
    propertyPrice: context.propertyPrice,
    propertyLocation: context.propertyLocation,
  };

  if (existing) {
    await setDoc(
      existing.ref,
      {
        memberDetails: {
          [currentUser.uid]: currentDetails,
          [owner.uid]: ownerDetails,
        },
        updatedAt: new Date(),
      },
      { merge: true },
    );
    return existing.id;
  }

  const chatRef = doc(collection(db, 'chats'));
  await setDoc(chatRef, {
    id: chatRef.id,
    participants,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessage: null,
    lastMessageTime: null,
    lastMessageSenderId: null,
    unreadCount: { [currentUser.uid]: 0, [owner.uid]: 0 },
    deletedBy: { [currentUser.uid]: false, [owner.uid]: false },
    lastSeenBy: { [currentUser.uid]: new Date(), [owner.uid]: new Date() },
    memberDetails: {
      [currentUser.uid]: currentDetails,
      [owner.uid]: ownerDetails,
    },
  });
  return chatRef.id;
}
