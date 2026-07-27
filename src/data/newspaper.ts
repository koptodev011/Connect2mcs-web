import type { Tone } from '@/lib/tokens';

export type PaperName = 'Sakal' | 'Loksatta' | 'Maharashtra Times' | 'Pudhari' | 'Kesari';

export interface NewspaperPaper {
  id: string;
  name: string;
  dev: string;
  est: number;
  city: string;
  desc: string;
  url?: string;
  readers: string;
  tone: Tone;
  image?: string;
}

export interface NewspaperHeadline {
  cat: string;
  title: string;
  when: string;
  read: string;
  excerpt: string;
}

export const papers: NewspaperPaper[] = [
  { id: 'Sakal',             name: 'Sakal',             dev: 'सकाळ',           est: 1932, city: 'Pune',     desc: "Maharashtra's most widely read Marathi daily. Comprehensive coverage of state politics, business and culture.",  readers: '1.2M daily',  tone: 'saffron' },
  { id: 'Loksatta',          name: 'Loksatta',          dev: 'लोकसत्ता',        est: 1948, city: 'Mumbai',   desc: "Indian Express group's Marathi flagship. Known for investigative journalism and editorial depth.",               readers: '940K daily',  tone: 'brick'   },
  { id: 'Maharashtra Times', name: 'Maharashtra Times', dev: 'महाराष्ट्र टाइम्स',est: 1962, city: 'Mumbai',   desc: 'Times of India group. Broad readership with strong Mumbai focus and national reporting.',                       readers: '800K daily',  tone: 'blue'    },
  { id: 'Pudhari',           name: 'Pudhari',           dev: 'पुढारी',          est: 1937, city: 'Kolhapur', desc: 'Dominant paper in Western Maharashtra and Vidarbha. Rural reach with community-first reporting.',               readers: '620K daily',  tone: 'green'   },
  { id: 'Kesari',            name: 'Kesari',            dev: 'केसरी',           est: 1881, city: 'Pune',     desc: "Bal Gangadhar Tilak's historic paper. Oldest Marathi daily and a cultural institution.",                         readers: '380K daily',  tone: 'gold'    },
];

export const headlines: Record<PaperName, NewspaperHeadline[]> = {
  'Sakal': [
    { cat: 'राजकारण',  title: 'महाराष्ट्र विधानसभेत नवा अर्थसंकल्प सादर · कृषीवर ₹12,000 कोटी',               when: '2h ago', read: '4 min', excerpt: 'State budget focuses heavily on agriculture and rural infrastructure, with significant allocations for the Vidarbha region.' },
    { cat: 'समाज',     title: 'पुण्यात मराठी साहित्य संमेलन नोव्हेंबरमध्ये · 96वी आवृत्ती',                  when: '4h ago', read: '3 min', excerpt: 'The 96th edition of the Marathi literary gathering will be held in Pune with 38 curated sessions.' },
    { cat: 'व्यवसाय',  title: 'TCS आणि Persistent Systems मिळून नवे AI संशोधन केंद्र उभारणार',                when: '6h ago', read: '5 min', excerpt: 'Joint venture will create 2,000 AI research roles in Pune over the next three years.' },
    { cat: 'क्रीडा',   title: 'मुंबई इंडियन्स IPL अंतिम फेरीत · रोहित शर्माचे शतक',                        when: '1d ago', read: '2 min', excerpt: 'Mumbai Indians clinched their semifinal berth with a dominant performance in Wankhede.' },
  ],
  'Loksatta': [
    { cat: 'मुंबई',    title: 'मेट्रो लाइन 3 · आता आरे ते BKC थेट · प्रवासी वेळ 22 मिनिटांवर',              when: '1h ago', read: '3 min', excerpt: 'The long-awaited underground metro line now connects the western suburbs to BKC cutting travel times significantly.' },
    { cat: 'आरोग्य',   title: 'AIIMS पुणे येथे नवे अवयव प्रत्यारोपण केंद्र उद्घाटन',                       when: '5h ago', read: '4 min', excerpt: "Maharashtra's first dedicated organ transplant centre at AIIMS Pune will serve western India." },
    { cat: 'शेती',     title: 'सोयाबीन उत्पादकांना MSP वाढ · 12% वाढ जाहीर',                               when: '8h ago', read: '3 min', excerpt: 'Government announces a minimum support price hike for soybean farmers across Vidarbha and Marathwada.' },
    { cat: 'संस्कृती', title: 'लता मंगेशकर स्मृती संगीत महोत्सव · जून 15 ते 18',                          when: '2d ago', read: '2 min', excerpt: 'The annual Lata tribute festival features six classical and semi-classical concerts across Mumbai.' },
  ],
  'Maharashtra Times': [
    { cat: 'Mumbai',   title: 'Dharavi Redevelopment Phase 2 — 42,000 families to be relocated by year end',    when: '2h ago', read: '5 min', excerpt: 'The ambitious urban renewal project enters its most critical phase as the government fast-tracks approvals.' },
    { cat: 'Business', title: 'Pune real estate Q1 2026 — prices up 14% YoY · IT corridor drives demand',      when: '6h ago', read: '4 min', excerpt: 'Hinjawadi and Wakad continue to lead price appreciation as tech firm expansions sustain demand.' },
    { cat: 'Education',title: 'CBSE board results out · Maharashtra students score above national average',      when: '1d ago', read: '2 min', excerpt: 'State students outperformed national averages in science and mathematics for the third consecutive year.' },
    { cat: 'Tech',     title: 'Flipkart launches dedicated NRI shopping portal — curated Indian products abroad', when: '2d ago', read: '3 min', excerpt: 'The platform targets 30 million NRI households with direct delivery to 18 countries.' },
  ],
  'Pudhari': [
    { cat: 'कोल्हापूर',title: 'कोल्हापूर जिल्ह्यात ऊस शेतकऱ्यांसाठी नवे पाटबंधारे योजना',                    when: '3h ago', read: '4 min', excerpt: 'A new irrigation project will benefit over 80,000 sugarcane farmers across western Maharashtra.' },
    { cat: 'खेळ',      title: 'कबड्डी विश्वकरंडक · भारत उपांत्य फेरीत · मुंबईत अंतिम सामना',                when: '5h ago', read: '2 min', excerpt: 'India dominates the Kabaddi World Cup qualifiers and will host the final in Mumbai in August.' },
    { cat: 'शेती',     title: 'नागपूर संत्र्याला GI मानांकन · शेतकऱ्यांना मोठा दिलासा',                    when: '1d ago', read: '3 min', excerpt: 'The Geographical Indication tag for Nagpur oranges will boost exports and farmer incomes.' },
    { cat: 'समाज',     title: 'सांगली जिल्ह्यात नव्या 200 आश्रमशाळा उघडणार · जिल्हा परिषद',               when: '2d ago', read: '3 min', excerpt: 'The district council approves a landmark tribal school expansion covering remote tehsils.' },
  ],
  'Kesari': [
    { cat: 'इतिहास',   title: 'बाळ गंगाधर टिळक जयंती · पुण्यात विशेष कार्यक्रम',                           when: '3h ago', read: '3 min', excerpt: "Centenary events celebrate Lokmanya Tilak's legacy with lectures, exhibitions and cultural programmes." },
    { cat: 'संस्कृती', title: 'महाराष्ट्र दिन विशेषांक · 66 वर्षांचा महाराष्ट्र',                          when: '6h ago', read: '5 min', excerpt: "Kesari's annual Maharashtra Day edition traces the state's six-decade journey from formation to today." },
    { cat: 'साहित्य',  title: 'कुसुमाग्रज स्मृती पारितोषिक जाहीर · प्राप्तकर्ता कविता महाजन',              when: '1d ago', read: '2 min', excerpt: 'The prestigious literary award recognises outstanding contribution to Marathi poetry and prose.' },
    { cat: 'राजकारण',  title: 'विधानसभा निवडणूक तयारी · महायुती आणि MVA यांचे जागावाटप',                  when: '3d ago', read: '4 min', excerpt: 'Alliance seat-sharing talks continue ahead of the upcoming state assembly election.' },
  ],
};
