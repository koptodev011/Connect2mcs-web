import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@/lib/firebase';

export interface MarketplaceChatContext {
  ownerId: string;
  sellerName: string;
  listingId: string;
  listingTitle: string;
  listingPrice: string;
  listingLocation: string;
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

export function marketplaceChatHref(context: MarketplaceChatContext) {
  const params = new URLSearchParams({
    source: 'marketplace',
    user: context.sellerName,
    ownerId: context.ownerId,
    listingId: context.listingId,
    listingTitle: context.listingTitle,
    listingPrice: context.listingPrice,
    listingLocation: context.listingLocation,
  });
  return `/chat?${params.toString()}`;
}

export async function getOrCreateMarketplaceChat(
  currentUser: User,
  context: MarketplaceChatContext,
) {
  const snapshot = await getDocs(collection(db, 'users'));
  const users = snapshot.docs.map(
    (entry) => ({ uid: entry.id, ...entry.data() }) as CommunityUser,
  );
  const sellerId = normalized(context.ownerId);
  const sellerName = normalized(context.sellerName);
  const seller = users.find((user) => {
    const ids = [user.uid, user.erpUserId, user.adUserId].map(normalized);
    return (
      (sellerId && ids.includes(sellerId)) ||
      (sellerName &&
        [user.name, user.displayName].map(normalized).includes(sellerName))
    );
  });

  // Sellers that have not signed into chat yet fall back to the app-wide
  // name-based identity (the same scheme used for non-Firebase users).
  const sellerUid = seller ? seller.uid : context.sellerName.trim();
  if (!sellerUid) {
    throw new Error('Could not open a chat with this seller.');
  }
  if (sellerUid === currentUser.uid) {
    throw new Error('You cannot start a chat with yourself.');
  }

  const participants = [currentUser.uid, sellerUid].sort();
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
  const sellerDetails = {
    uid: sellerUid,
    name: seller?.name || seller?.displayName || context.sellerName,
    email: seller?.email || '',
    userType: 'Seller',
    listingId: context.listingId,
    listingTitle: context.listingTitle,
    listingPrice: context.listingPrice,
    listingLocation: context.listingLocation,
  };

  if (existing) {
    await setDoc(
      existing.ref,
      {
        memberDetails: {
          [currentUser.uid]: currentDetails,
          [sellerUid]: sellerDetails,
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
    unreadCount: { [currentUser.uid]: 0, [sellerUid]: 0 },
    deletedBy: { [currentUser.uid]: false, [sellerUid]: false },
    lastSeenBy: { [currentUser.uid]: new Date(), [sellerUid]: new Date() },
    memberDetails: {
      [currentUser.uid]: currentDetails,
      [sellerUid]: sellerDetails,
    },
  });
  return chatRef.id;
}