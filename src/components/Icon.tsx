'use client';

export type IconName =
  | 'home' | 'map' | 'work' | 'cal' | 'chat' | 'people' | 'book' | 'spark'
  | 'home2' | 'moon' | 'lamp' | 'news' | 'search' | 'bell' | 'pin' | 'star'
  | 'chev' | 'chevR' | 'chevL' | 'plus' | 'heart' | 'share' | 'filter'
  | 'grid' | 'list' | 'cart' | 'verify' | 'clock' | 'globe' | 'user'
  | 'arrow' | 'fire' | 'bag' | 'money' | 'grad' | 'help' | 'settings'
  | 'car' | 'tiffin' | 'apple' | 'playstore' | 'phone' | 'link';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  s?: number;
}

export default function Icon({ name, size = 20, color = 'currentColor', s = 1.7, style }: IconProps) {
  const map: Record<IconName, React.ReactNode> = {
    home:     <path d="M3 10l7-6 7 6v8H3z M8 18v-5h4v5" stroke={color} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    map:      <g stroke={color} strokeWidth={s} fill="none" strokeLinejoin="round"><path d="M3 5l5-2 4 2 5-2v12l-5 2-4-2-5 2z"/><path d="M8 3v14M12 5v14"/></g>,
    work:     <g stroke={color} strokeWidth={s} fill="none" strokeLinejoin="round"><rect x="3" y="6" width="14" height="11" rx="1.5"/><path d="M7 6V4.5A1.5 1.5 0 018.5 3h3A1.5 1.5 0 0113 4.5V6"/><path d="M3 11h14"/></g>,
    cal:      <g stroke={color} strokeWidth={s} fill="none"><rect x="3" y="4.5" width="14" height="13" rx="1.5"/><path d="M3 8.5h14M7 3v3M13 3v3" strokeLinecap="round"/></g>,
    chat:     <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v7a2 2 0 01-2 2H8l-4 3v-3H5a2 2 0 01-2-2z" stroke={color} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    people:   <g stroke={color} strokeWidth={s} fill="none"><circle cx="7" cy="7" r="2.7"/><path d="M2 16c0-2.5 2.2-4 5-4s5 1.5 5 4M13 6.5a2.3 2.3 0 11.01 0M13 12c2.5 0 4.5 1.2 4.5 3" strokeLinecap="round"/></g>,
    book:     <path d="M3 4h6a3 3 0 013 3v10a3 3 0 00-3-3H3z M17 4h-6a3 3 0 00-3 3v10a3 3 0 013-3h6z" stroke={color} strokeWidth={s} fill="none"/>,
    spark:    <path d="M10 2v4M10 14v4M2 10h4M14 10h4M5 5l3 3M12 12l3 3M15 5l-3 3M5 15l3-3" stroke={color} strokeWidth={s} strokeLinecap="round"/>,
    home2:    <g stroke={color} strokeWidth={s} fill="none"><path d="M3 17V8l7-5 7 5v9z"/><path d="M3 11h14M8 17v-3M12 17v-3"/></g>,
    moon:     <path d="M14 11A6 6 0 016 4a6 6 0 108 7z" stroke={color} strokeWidth={s} fill="none"/>,
    lamp:     <g stroke={color} strokeWidth={s} fill="none"><path d="M5 14c0-3 2-5 5-5s5 2 5 5M5 14h10v2H5zM10 9V4M8 4h4" strokeLinecap="round"/></g>,
    news:     <g stroke={color} strokeWidth={s} fill="none"><rect x="3" y="4" width="14" height="13" rx="1.5"/><path d="M6 8h8M6 11h8M6 14h5"/></g>,
    search:   <g stroke={color} strokeWidth={s} fill="none"><circle cx="9" cy="9" r="5.5"/><path d="M13 13l4.5 4.5" strokeLinecap="round"/></g>,
    bell:     <g stroke={color} strokeWidth={s} fill="none"><path d="M5 14h10l-1.5-2V8a3.5 3.5 0 00-7 0v4z" strokeLinejoin="round"/><path d="M8.5 17a1.7 1.7 0 003 0"/></g>,
    pin:      <g stroke={color} strokeWidth={s} fill="none"><path d="M10 2C7 2 4.5 4.2 4.5 7c0 4 5.5 10 5.5 10s5.5-6 5.5-10C15.5 4.2 13 2 10 2z" strokeLinejoin="round"/><circle cx="10" cy="7" r="2"/></g>,
    star:     <path d="M10 2.5l2.4 5 5.5.6-4 3.8 1.1 5.4L10 14.6l-5 2.7L6.1 12 2 8.1l5.5-.6z" fill={color}/>,
    chev:     <path d="M5 8l5 5 5-5" stroke={color} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    chevR:    <path d="M8 5l5 5-5 5" stroke={color} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    chevL:    <path d="M12 5l-5 5 5 5" stroke={color} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    plus:     <path d="M10 4v12M4 10h12" stroke={color} strokeWidth={s} strokeLinecap="round"/>,
    heart:    <path d="M10 17s-6-3.7-6-9a3.5 3.5 0 016-2.5A3.5 3.5 0 0116 8c0 5.3-6 9-6 9z" stroke={color} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    share:    <g stroke={color} strokeWidth={s} fill="none"><circle cx="5" cy="10" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="15" cy="15" r="2"/><path d="M7 9l6-3M7 11l6 3"/></g>,
    filter:   <path d="M3 5h14l-5 6v5l-4 1v-6z" stroke={color} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    grid:     <g stroke={color} strokeWidth={s} fill="none"><rect x="3" y="3" width="6" height="6"/><rect x="11" y="3" width="6" height="6"/><rect x="3" y="11" width="6" height="6"/><rect x="11" y="11" width="6" height="6"/></g>,
    list:     <g stroke={color} strokeWidth={s} fill="none" strokeLinecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></g>,
    cart:     <path d="M3 4h2l2 10h9l2-7H6" stroke={color} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    verify:   <g><circle cx="10" cy="10" r="8" fill={color}/><path d="M6.5 10l2.5 2.5L14 7.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></g>,
    clock:    <g stroke={color} strokeWidth={s} fill="none"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.5 2" strokeLinecap="round"/></g>,
    globe:    <g stroke={color} strokeWidth={s} fill="none"><circle cx="10" cy="10" r="7.5"/><ellipse cx="10" cy="10" rx="3" ry="7.5"/><path d="M2.5 10h15"/></g>,
    user:     <g stroke={color} strokeWidth={s} fill="none"><circle cx="10" cy="7" r="3"/><path d="M3 17c0-3.3 3-5 7-5s7 1.7 7 5"/></g>,
    arrow:    <path d="M4 10h12M11 5l5 5-5 5" stroke={color} strokeWidth={s} strokeLinecap="round" fill="none"/>,
    fire:     <path d="M10 18c-3 0-5-2.2-5-5 0-2 1-3 1.5-4 .5 1 1.5 1 1.5 0 0-2.5 1-4.5 3-6 .2 2.5 1.5 3 2.5 4.5 1 1.5 1.5 3 1.5 5 0 3-2.5 5.5-5 5.5z" stroke={color} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    bag:      <g stroke={color} strokeWidth={s} fill="none"><path d="M4 7h12l-1 11H5z" strokeLinejoin="round"/><path d="M7 7V5a3 3 0 016 0v2"/></g>,
    money:    <g stroke={color} strokeWidth={s} fill="none"><rect x="2" y="6" width="16" height="9" rx="1.5"/><circle cx="10" cy="10.5" r="2"/><path d="M5 10.5h.5M14.5 10.5h.5"/></g>,
    grad:     <path d="M2 7l8-3 8 3-8 3zM6 9v4c0 1.5 2 2.5 4 2.5s4-1 4-2.5V9M17 8v5" stroke={color} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    help:     <g stroke={color} strokeWidth={s} fill="none"><circle cx="10" cy="10" r="7.5"/><path d="M8 8c0-1 1-2 2-2s2 .8 2 2c0 1.5-2 2-2 3" strokeLinecap="round"/><circle cx="10" cy="14" r="0.5" fill={color}/></g>,
    settings: <g stroke={color} strokeWidth={s} fill="none"><circle cx="10" cy="10" r="2.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.5 4.5l1.5 1.5M14 14l1.5 1.5M4.5 15.5L6 14M14 6l1.5-1.5"/></g>,
    car:     <g fill="none"><path d="M3 13v2h14v-2l-2.5-6h-9z" stroke={color} strokeWidth={s} strokeLinejoin="round"/><line x1="3" y1="13" x2="17" y2="13" stroke={color} strokeWidth={s} strokeLinecap="round"/><circle cx="6.5" cy="15.5" r="1.5" fill={color}/><circle cx="13.5" cy="15.5" r="1.5" fill={color}/></g>,
    tiffin:  <g stroke={color} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9" width="12" height="7" rx="1.5"/><path d="M4 12h12"/><path d="M7 9V7M10 9V6.5M13 9V7"/><path d="M7.5 6.5h5"/></g>,
    apple:   <path d="M319.1 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7-55.8 .9-115.1 44.5-115.1 133.2 0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM262.5 104.5c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" fill={color}/>,
    playstore:<path d="M293.6 234.3L72.9 13 353.7 174.2 293.6 234.3zM15.3 0C2.3 6.8-6.4 19.2-6.4 35.3l0 441.3c0 16.1 8.7 28.5 21.7 35.3L271.9 255.9 15.3 0zM440.5 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM72.9 499L353.7 337.8 293.6 277.7 72.9 499z" fill={color}/>,
    phone:   <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke={color} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    link:    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke={color} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
  };
  
  const viewBoxes: Partial<Record<IconName, string>> = {
    apple: '0 0 384 512',
    playstore: '0 0 512 512',
    phone: '0 0 24 24',
    link: '0 0 24 24',
  };
  
  return <svg width={size} height={size} viewBox={viewBoxes[name] || "0 0 20 20"} style={style}>{map[name]}</svg>;
}
