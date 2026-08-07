export type Aarti = { id: number; title: string; deity: string; duration: string; popular?: boolean; image?: string; audio?: string; lyrics?: string; weekday?: string; youtubeUrl?: string }

export const aartis: Aarti[] = [
  { id: 1, title: 'Sukhakarta Dukhaharta', deity: 'Ganpati', duration: '1:24', popular: true },
  { id: 2, title: 'Lavthavti Vikrala', deity: 'Shankar', duration: '0:58', popular: true },
  { id: 3, title: 'Yuge Atthavis Vitevari', deity: 'Vitthal', duration: '2:12' },
  { id: 4, title: 'Durge Durghat Bhari', deity: 'Durga', duration: '1:46', popular: true },
  { id: 5, title: 'Jai Dev Jai Dev', deity: 'Datta', duration: '1:18' },
  { id: 6, title: 'Karpur Gauram Karunavtaram', deity: 'Shankar', duration: '0:42' },
  { id: 7, title: 'Shree Ramchandra Kripalu', deity: 'Ram', duration: '3:10' },
  { id: 8, title: 'Jai Jai Vitthal Jai Vitthal', deity: 'Vitthal', duration: '2:45', popular: true },
]

export const verses = [
  'सुखकर्ता दुःखहर्ता वार्ता विघ्नाची ।\nनुरवी पुरवी प्रेम कृपा जयाची ।\nसर्वांगी सुंदर उटी शेंदुराची ।\nकंठी झळके माळ मुक्ताफळांची ॥ १ ॥',
  'जय देव जय देव जय मंगलमूर्ती ।\nदर्शनमात्रे मनकामना पुरती ॥ धृ. ॥',
  'रत्नखचित फरा तुज गौरीकुमरा ।\nचंदनाची उटी कुंकुमकेशरा ॥ २ ॥',
  'लंबोदर पीतांबर फणिवरबंधना ।\nसरळ सोंड वक्रतुंड त्रिनयना ॥ ३ ॥',
]
