import type { Tone } from '@/lib/tokens';
import type { SceneKind } from '@/components/Scenes';

export type Condition = 'New' | 'Like new' | 'Good' | 'Used';

export interface MarketplaceListing {
  id: string;
  title: string;
  price: string;
  currency: string;
  condition: Condition;
  city: string;
  seller: string;
  cat: string;
  when: string;
  tone: Tone;
  kind: SceneKind;
  mandal: string;
  sold?: boolean;
  featured?: boolean;
}

export const marketplaceListings: MarketplaceListing[] = [
  { id: 'bike',     title: 'Trek FX3 Disc Hybrid Bike — barely used',                price: '$480',    currency: '$',   condition: 'Like new', city: 'Boston, MA',    seller: 'Rohan B.',    cat: 'Vehicles',    when: '2h ago',  tone: 'saffron', kind: 'job',     mandal: 'Boston MM', featured: true },
  { id: 'sofa',     title: 'IKEA KIVIK 3-seat sofa — grey, 2 years old',             price: '$180',    currency: '$',   condition: 'Good',     city: 'Edison, NJ',    seller: 'Sai K.',      cat: 'Furniture',   when: '4h ago',  tone: 'brick',   kind: 'housing', mandal: 'BMM NJ'    },
  { id: 'laptop',   title: 'MacBook Air M2 2024 — 16GB 512GB, mint',                 price: '$1,100',  currency: '$',   condition: 'Like new', city: 'Toronto',       seller: 'Mihir A.',    cat: 'Electronics', when: '5h ago',  tone: 'blue',    kind: 'study',   mandal: 'MMT'       },
  { id: 'books',    title: 'V.S. Khandekar · P.L. Deshpande Collection — 24 books', price: '$30',     currency: '$',   condition: 'Good',     city: 'Cambridge, MA', seller: 'Anuja K.',    cat: 'Books',       when: '1d ago',  tone: 'gold',    kind: 'study',   mandal: 'Boston MM' },
  { id: 'dining',   title: 'Solid wood dining table with 6 chairs',                  price: '£220',    currency: '£',   condition: 'Good',     city: 'London',        seller: 'Prashant G.', cat: 'Furniture',   when: '1d ago',  tone: 'green',   kind: 'housing', mandal: 'MML'       },
  { id: 'pram',     title: 'Chicco stroller + car seat combo — excellent condition', price: 'C$260',   currency: 'C$',  condition: 'Like new', city: 'Toronto',       seller: 'Maya J.',     cat: 'Kids & Toys', when: '2d ago',  tone: 'pink',    kind: 'people',  mandal: 'MMT'       },
  { id: 'kadhai',   title: 'Prestige pressure cooker + kadhai set — barely used',    price: '₹1,800',  currency: '₹',   condition: 'Like new', city: 'Pune, IN',      seller: 'Suhas D.',    cat: 'Kitchen',     when: '2d ago',  tone: 'saffron', kind: 'food',    mandal: 'BMM'       },
  { id: 'ps5',      title: 'PlayStation 5 disc edition + 3 games',                  price: 'A$620',   currency: 'A$',  condition: 'Good',     city: 'Sydney',        seller: 'Santosh W.',  cat: 'Electronics', when: '3d ago',  tone: 'sand',    kind: 'group',   mandal: 'MMS'       },
  { id: 'saree',    title: 'Paithani silk saree · peacock motif · unused',           price: '₹12,000', currency: '₹',   condition: 'New',      city: 'Mumbai, IN',    seller: 'Snehal J.',   cat: 'Clothing',    when: '3d ago',  tone: 'brick',   kind: 'dance',   mandal: 'BMM'       },
  { id: 'books2',   title: 'GMAT + GRE official prep books — 2024 editions',        price: '$40',     currency: '$',   condition: 'Good',     city: 'Boston, MA',    seller: 'Tejas M.',    cat: 'Books',       when: '4d ago',  tone: 'blue',    kind: 'study',   mandal: 'Boston MM' },
  { id: 'chair',    title: 'Herman Miller Aeron task chair — fully adjustable',     price: '$680',    currency: '$',   condition: 'Good',     city: 'Seattle, WA',   seller: 'Rohan Bh.',   cat: 'Furniture',   when: '5d ago',  tone: 'gold',    kind: 'job',     mandal: 'Seattle MM'},
  { id: 'instapot', title: 'Instant Pot Duo 7-in-1 · 8-quart · like new',          price: 'C$65',    currency: 'C$',  condition: 'Like new', city: 'Mississauga',   seller: 'Vivek A.',    cat: 'Kitchen',     when: '6d ago',  tone: 'green',   kind: 'food',    mandal: 'MMT'       },
];
