export const emergencyContacts = [
  {
    id: 1,
    title: 'Embassy Control Room',
    subtitle: '24x7 - all emergencies',
    phone: '+971 2 4492700',
    color: '#8C3123'
  },
  {
    id: 2,
    title: 'MADAD Consular Portal',
    subtitle: 'Online grievance redressal',
    phone: 'madad.gov.in',
    color: '#284E9C',
    isLink: true
  },
  {
    id: 3,
    title: 'Women Helpline (UAE)',
    subtitle: 'Distress & safety support',
    phone: '800 SAVE',
    color: '#B8723A'
  },
  {
    id: 4,
    title: 'Indian Workers Resource Centre',
    subtitle: 'Labour & welfare issues',
    phone: '800 46342',
    color: '#2E7D32'
  }
];

export const missions = [
  {
    id: 'abu-dhabi',
    type: 'EMBASSY',
    status: 'Open',
    name: 'Embassy of India, Abu Dhabi',
    location: 'Abu Dhabi, UAE',
    hours: '09:00 – 17:30',
    distance: '2.4 km',
    telephone: '+971 2 4492700',
    email: 'cons.abudhabi@mea.gov.in',
    website: 'www.indembassyuae.gov.in',
    address: 'Plot 14, Sector W-59/02, Diplomatic Area, Abu Dhabi, UAE',
    jurisdiction: 'This mission serves Indian nationals residing in Abu Dhabi, Al Ain & the Western Region. Residents of Dubai, Sharjah & Northern Emirates should contact the Consulate General of India, Dubai.',
    services: [
      'Passport Services',
      'Visa & OCI',
      'Attestation of Documents',
      'Police Clearance (PCC)',
      'Birth/Marriage Registration',
      'Emergency Certificate'
    ],
    schedule: {
      submission: '09:00 AM – 12:30 PM',
      collection: '04:00 PM – 05:30 PM',
      weekend: 'Closed',
      holidays: 'As per MEA calendar'
    }
  },
  {
    id: 'dubai',
    type: 'CONSULATE',
    status: 'Open',
    name: 'Consulate General of India',
    location: 'Dubai, UAE',
    hours: '09:00 – 17:00',
    distance: '128 km',
    telephone: '+971 4 3971222',
    email: 'cons.dubai@mea.gov.in',
    website: 'www.cgidubai.gov.in',
    address: 'Al Hamriya Diplomatic Enclave, Dubai, UAE',
    jurisdiction: 'Serves Indian nationals residing in Dubai and Northern Emirates.',
    services: [
      'Passport Services',
      'Visa & OCI',
      'Attestation of Documents',
      'Police Clearance (PCC)'
    ],
    schedule: {
      submission: '09:00 AM – 12:00 PM',
      collection: '03:00 PM – 05:00 PM',
      weekend: 'Closed',
      holidays: 'As per MEA calendar'
    }
  },
  {
    id: 'sharjah',
    type: 'CONSULATE',
    status: 'Closed',
    name: 'Consulate General of India',
    location: 'Sharjah, UAE',
    hours: 'Opens 9:00 AM',
    distance: '142 km',
    telephone: '+971 6 1234567',
    email: 'cons.sharjah@mea.gov.in',
    website: 'www.cgidubai.gov.in/sharjah',
    address: 'Sharjah Industrial Area, UAE',
    jurisdiction: 'Serves Indian nationals residing in Sharjah.',
    services: ['Passport Services', 'Attestation'],
    schedule: {
      submission: '09:00 AM – 12:00 PM',
      collection: '03:00 PM – 05:00 PM',
      weekend: 'Closed',
      holidays: 'As per MEA calendar'
    }
  }
];

export const advisories = [
  {
    id: 1,
    type: 'ADVISORY',
    pinned: true,
    title: 'Updated passport appointment process at BLS centres from July 1',
    time: '2 days ago'
  },
  {
    id: 2,
    type: 'NOTICE',
    title: 'Republic Day 2026 celebrations — registration now open',
    time: '4 days ago'
  },
  {
    id: 3,
    type: 'UPDATE',
    title: 'New OCI miscellaneous services available online via portal',
    time: '1 week ago'
  }
];
