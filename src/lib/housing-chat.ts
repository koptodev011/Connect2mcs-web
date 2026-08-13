export interface HousingChatTarget {
  ownerId: string;
  host: string;
  ownerEmail?: string;
  propertyId: string;
  propertyTitle: string;
  propertyPrice: string;
  propertyLocation: string;
}

export function housingChatHref(target: HousingChatTarget) {
  const params = new URLSearchParams({
    source: 'housing',
    user: target.host,
    ownerId: target.ownerId,
    propertyId: target.propertyId,
    propertyTitle: target.propertyTitle,
    propertyPrice: target.propertyPrice,
    propertyLocation: target.propertyLocation,
  });

  if (target.ownerEmail) params.set('email', target.ownerEmail);
  return `/chat?${params.toString()}`;
}
