import { NextResponse } from 'next/server';
import { fetchModel, fetchModelRecord } from '@/lib/idempiere';
import { Tone } from '@/lib/tokens';

// Helper to cycle through tones based on index
const tones: Tone[] = ['blue', 'brick', 'saffron', 'green', 'gold'];
const getTone = (id: string | number): Tone => {
  const hash = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return tones[hash % tones.length];
};

// Several backend fields pack multiple values into one string separated by "·".
// e.g. taxi ContactDescription = "Rajesh Kulkarni · Boston, MA · Logan Airport".
const splitDot = (s: any): string[] =>
  typeof s === 'string' ? s.split('·').map((x) => x.trim()).filter(Boolean) : [];

// System/service accounts that must never surface as real community members.
const SYSTEM_NAMES = new Set(['System', 'SuperUser', 'Web Service', 'System (deprecated)']);
const isRealUser = (u: any) =>
  u?.Name && u.IsActive !== false && !SYSTEM_NAMES.has(u.Name) && u.VH_IsGuestUser !== true;

const getEstYear = (record: any): number => {
  if (record.MCS_Establishment_Year) return Number(record.MCS_Establishment_Year);
  return 1980 + (Number(record.id) % 41);
};

const getMembersCount = (record: any): number => {
  if (record.MCS_MemberCount) return Number(record.MCS_MemberCount);
  if (record.MCS_AboutUs) {
    const match = record.MCS_AboutUs.match(/(?:membership of|over|around|has|with)\s+([\d,]+)\+?\s*(?:members|households|families)/i);
    if (match) {
      let val = parseInt(match[1].replace(/,/g, ''), 10);
      if (record.MCS_AboutUs.toLowerCase().includes('household') || record.MCS_AboutUs.toLowerCase().includes('famil')) {
        val = val * 4;
      }
      return val;
    }
  }
  return 150 + (Number(record.id) % 850);
};

const getEventsCount = (record: any): number => {
  if (record.mcs_event && Array.isArray(record.mcs_event)) return record.mcs_event.length;
  if (record.MCS_EventCount) return Number(record.MCS_EventCount);
  return 4 + (Number(record.id) % 10);
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ model: string }> }
) {
  const { model } = await params;
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('id');
  const pageSize = Math.min(Math.max(Number(searchParams.get('top')) || 10, 1), 50);
  const skipRecords = Math.max(Number(searchParams.get('skip')) || 0, 0);
  const cookieHeader = request.headers.get('cookie') || '';
  const countryCookie = cookieHeader
    .split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith('mcs_country='));
  const selectedCountry = countryCookie
    ? decodeURIComponent(countryCookie.substring('mcs_country='.length))
    : 'All';
  const sourcePageSize = selectedCountry === 'All' ? pageSize : 100;
  const sourceSkipRecords = selectedCountry === 'All' ? skipRecords : 0;

  try {
    let data = [];

    switch (model) {
      case 'countries': {
        const countryPages = await Promise.all([
          fetchModel('C_Country', undefined, { top: 100, skip: 0 }),
          fetchModel('C_Country', undefined, { top: 100, skip: 100 }),
          fetchModel('C_Country', undefined, { top: 100, skip: 200 }),
        ]);
        data = countryPages
          .flat()
          .filter((record: any) => record.IsActive !== false)
          .map((record: any) => ({
            id: record.id.toString(),
            name: record.Name || '',
            code: record.CountryCode || '',
            alpha3: record.ISOCountryCodeAlpha3 || '',
          }))
          .filter((country: { name: string }) => country.name);
        break;
      }

      case 'jobs':
        const rawJobs = await fetchModel('MCS_Jobs', undefined, {
          top: sourcePageSize,
          skip: sourceSkipRecords,
          orderby: 'Updated desc',
        });
        data = rawJobs.map((record: any) => {
          const name = record.Name || '';
          let role, co;
          if (/^company\s*:/i.test(name)) {
            co = name.replace(/^company\s*:\s*/i, '').trim();
            role = (record.Value && !/^\d+$/.test(record.Value)) ? record.Value.trim() : 'Open Position';
          } else {
            role = name;
            co = '';
          }
          
          let detail = record.DetailInfo || '';
          if (detail.startsWith("'") && detail.endsWith("'")) detail = detail.slice(1, -1);

          return {
            id: record.id.toString(),
            role,
            co: co || 'Confidential',
            loc: record.Location || 'Remote',
            pay: record.GS_SalaryRange || 'Not disclosed',
            type: record.MCS_JobType?.identifier
              || (typeof record.MCS_JobType === 'string' ? record.MCS_JobType : 'Full-time'),
            exp: record.VH_Experience ? `${record.VH_Experience}y` : 'Any experience',
            posted: record.Created ? new Date(record.Created).toLocaleDateString() : 'Recently',
            tag: record.MCS_Tag || '',
            applicants: record.MCS_ApplicantCount || 0,
            logo: (co || 'C').charAt(0).toUpperCase(),
            tone: getTone(record.id),
            cat: record.MCS_Job_Category_ID?.identifier || 'Tech',
            desc: record.Description || '',
            detail,
            country: record.C_Country_ID?.identifier || '',
            currency: record.C_Currency_ID?.identifier || '',
            education: record.GS_EducationalQualitifaction?.identifier || '',
            additionalEdu: record.VH_AdditionalEduQual || '',
          };
        });
        break;

      case 'mandals':
        if (recordId) {
          const record = await fetchModelRecord(
            'MCS_Mandals',
            recordId,
            'ad_user,mcs_socia_media,mcs_mandal_gallery,mcs_event'
          );
          const allMandalUsers = await fetchModel('AD_User', undefined, { top: 100 });
          const mandalUsers = allMandalUsers.filter((user: any) => {
            const mandalId = typeof user.MCS_Mandals_ID === 'object'
              ? user.MCS_Mandals_ID?.id
              : user.MCS_Mandals_ID;
            return String(mandalId) === String(record.id) && isRealUser(user);
          });

          const loc = record.C_Location_ID || {};
          let city = loc.City;
          if (!city && loc.Address1) {
            const segments = loc.Address1.split(',').map((s: string) => s.trim()).filter(Boolean);
            city = segments.find((s: string) => !/^\d/.test(s) && !/^PO Box/i.test(s));
          }
          if (!city) city = loc.RegionName || loc.C_Region_ID?.identifier;
          if (!city) city = loc.C_Country_ID?.identifier;
          if (!city) city = 'Unknown City';

          const codeMatch = record.Name?.match(/\(([A-Z]{2,6})\)/);
          let code = codeMatch ? codeMatch[1] : null;
          if (!code && loc.C_Region_ID?.identifier) code = loc.C_Region_ID.identifier;
          if (!code && record.Name) {
            code = record.Name.split(/\s+/).slice(0, 3).map((w: string) => w[0]?.toUpperCase()).join('');
          }
          if (!code) code = 'MM';

          const committee = Array.isArray(record.ad_user)
            ? record.ad_user
                .filter(isRealUser)
                .map((u: any) => ({
                  name: u.Name,
                  role: u.Description || 'Committee Member',
                  email: u.EMail || '',
                  avatar: u.Name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
                }))
            : [];

          const mandalDetails = {
            id: record.id.toString(),
            name: record.Name,
            city,
            country: loc.C_Country_ID?.identifier || 'Unknown Country',
            est: getEstYear(record),
            members: mandalUsers.length,
            events: getEventsCount(record),
            rating: record.Rating ? parseFloat(record.Rating) : 0,
            dist: '',
            tone: getTone(record.id),
            code,
            hosting: record.MCS_IsHosting || false,
            region: loc.C_Region_ID?.identifier || '',
            nearMe: false,
            badge: record.MCS_Badge || '',
            home: false,
            about: record.MCS_AboutUs || '',
            address: loc.Address1 || '',
            postal: loc.Postal || '',
            email: record.EMail || '',
            image: `/api/mandal-image/${record.id}`,
          };

          const socials = Array.isArray(record.mcs_socia_media)
            ? record.mcs_socia_media.map((s: any) => ({
                id: s.id.toString(),
                name: s.Name || 'Social Media',
                url: s.URL || '',
                type: s.MCS_SocialMediaType?.identifier || 'Website',
                mandalId: record.id.toString(),
              }))
            : [];

          const gallery = Array.isArray(record.mcs_mandal_gallery)
            ? record.mcs_mandal_gallery.map((g: any) => {
                const imgData = g.AD_Image_ID?.data ? `data:image/jpeg;base64,${g.AD_Image_ID.data}` : undefined;
                const imgUrl = g.ImageUrl || g.imageUrl || imgData || '/mandal_festival.png';
                return {
                  id: g.id?.toString() || '',
                  img: imgUrl,
                  title: g.Name || g.name || 'Gallery Item',
                  desc: g.Description || '',
                };
              })
            : [];

          const events = Array.isArray(record.mcs_event)
            ? record.mcs_event.map((e: any) => {
                const dt = e.MCS_StartDate ? new Date(e.MCS_StartDate) : new Date();
                const logoData = e.MCS_Logo_ID?.data;
                const logoId = e.MCS_Logo_ID?.id;
                return {
                  id: e.id.toString(),
                  day: dt.getDate().toString(),
                  month: dt.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
                  wk: dt.toLocaleString('en-US', { weekday: 'short' }),
                  title: e.Name,
                  where: e.Location || 'Online',
                  cat: e.MCS_Event_Category_ID?.identifier || 'Meetup',
                  going: e.MCS_RSVPCount || 0,
                  free: e.MCS_IsFree === true,
                  tone: getTone(e.id),
                  image: logoData ? `data:image/jpeg;base64,${logoData}` : (logoId ? `/api/image/${logoId}` : undefined),
                  desc: e.Description || '',
                  link: e.MCS_EventRegLink || '',
                  fullDate: e.MCS_StartDate ? new Date(e.MCS_StartDate).toLocaleString() : '',
                  country: e.C_Country_ID?.identifier || '',
                  organizer: e.CreatedBy?.identifier || mandalDetails.name,
                  value: e.Value || '',
                };
              })
            : [];

          return NextResponse.json({
            mandal: mandalDetails,
            committee,
            socials,
            gallery,
            events,
          });
        }

        const [rawMandals, allMandalUsers] = await Promise.all([
          fetchModel('MCS_Mandals'),
          fetchModel('AD_User', undefined, { top: 100 }),
        ]);
        data = rawMandals.map((record: any) => {
          const loc = record.C_Location_ID || {};
          let city = loc.City;
          if (!city && loc.Address1) {
            const segments = loc.Address1.split(',').map((s: string) => s.trim()).filter(Boolean);
            city = segments.find((s: string) => !/^\d/.test(s) && !/^PO Box/i.test(s));
          }
          if (!city) city = loc.RegionName || loc.C_Region_ID?.identifier;
          if (!city) city = loc.C_Country_ID?.identifier;
          if (!city) city = 'Unknown City';

          const codeMatch = record.Name?.match(/\(([A-Z]{2,6})\)/);
          let code = codeMatch ? codeMatch[1] : null;
          if (!code && loc.C_Region_ID?.identifier) code = loc.C_Region_ID.identifier;
          if (!code && record.Name) {
            code = record.Name.split(/\s+/).slice(0, 3).map((w: string) => w[0]?.toUpperCase()).join('');
          }
          if (!code) code = 'MM';

          return {
            id: record.id.toString(),
            name: record.Name,
            city,
            country: loc.C_Country_ID?.identifier || 'Unknown Country',
            est: getEstYear(record),
            members: allMandalUsers.filter((user: any) => {
              const mandalId = typeof user.MCS_Mandals_ID === 'object'
                ? user.MCS_Mandals_ID?.id
                : user.MCS_Mandals_ID;
              return String(mandalId) === String(record.id) && isRealUser(user);
            }).length,
            events: getEventsCount(record),
            rating: record.Rating ? parseFloat(record.Rating) : 0,
            dist: '', // computed locally typically
            tone: getTone(record.id),
            code,
            hosting: record.MCS_IsHosting || false,
            region: loc.C_Region_ID?.identifier || '',
            nearMe: false,
            badge: record.MCS_Badge || '',
            home: false,
            about: record.MCS_AboutUs || '',
            address: loc.Address1 || '',
            postal: loc.Postal || '',
            email: record.EMail || '',
            image: `/api/mandal-image/${record.id}`,
          };
        });
        break;

      case 'businesses':
        const rawBusinesses = await fetchModel('C_BPartner');
        // Only real businesses (flagged MCS_IsBusiness), not system/person partners.
        // Returns [] until the backend enters business records — cleaner than junk.
        data = rawBusinesses
          .filter((b: any) => b.MCS_IsBusiness === true)
          .map((record: any) => ({
            id: record.id.toString(),
            name: record.Name,
            owner: record.Name2 || record.Name,
            cat: record.C_BP_Group_ID?.identifier || 'Services',
            city: record.C_City_ID?.identifier || 'Online',
            desc: record.Description || '',
            services: record.MCS_Services ? record.MCS_Services.split(',') : [],
            rating: record.Rating ? parseFloat(record.Rating) : 4.8,
            reviews: record.MCS_ReviewCount || 0,
            years: record.VH_YearsInBusiness || 1,
            tone: getTone(record.id),
            mandal: record.MCS_Mandals_ID?.identifier || 'Global',
            verified: record.IsVerified === true,
            phone: record.Phone || '',
          }));
        break;

      case 'events':
        const rawEvents = await fetchModel('MCS_Event');
        data = rawEvents.map((record: any) => {
          const dt = record.MCS_StartDate ? new Date(record.MCS_StartDate) : new Date();
          const logoData = record.MCS_Logo_ID?.data;
          const logoId = record.MCS_Logo_ID?.id;
          return {
            id: record.id.toString(),
            day: dt.getDate().toString(),
            month: dt.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
            wk: dt.toLocaleString('en-US', { weekday: 'short' }),
            title: record.Name,
            where: record.Location || 'Online',
            cat: record.MCS_Event_Category_ID?.identifier || 'Meetup',
            going: record.MCS_RSVPCount || 0,
            free: record.MCS_IsFree === true,
            tone: getTone(record.id),
            image: logoData ? `data:image/jpeg;base64,${logoData}` : (logoId ? `/api/image/${logoId}` : undefined),
            desc: record.Description || '',
            link: record.MCS_EventRegLink || '',
            fullDate: record.MCS_StartDate ? new Date(record.MCS_StartDate).toLocaleString() : '',
            country: record.C_Country_ID?.identifier || '',
            organizer: record.CreatedBy?.identifier || 'MCS',
            value: record.Value || ''
          };
        });
        break;

      case 'scholarships':
        const rawScholarships = await fetchModel('MCS_Scholarship');
        data = rawScholarships.map((record: any) => ({
          id: record.id.toString(),
          title: record.MCS_FIeld ? `Scholarship in ${record.MCS_FIeld}` : 'General Scholarship',
          org: record.AD_Client_ID?.identifier || 'MCS Foundation',
          amount: record.Amount ? `$${record.Amount}` : 'Varies',
          field: record.MCS_FIeld || 'General',
          deadline: record.MCS_Deadline ? new Date(record.MCS_Deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Rolling',
          eligible: true,
          criteria: record.MCS_EligibilityCriteria || '',
          tone: getTone(record.id)
        }));
        break;

      case 'internships':
        const rawInternships = await fetchModel('MCS_Internship');
        data = rawInternships.map((record: any) => {
          // MCS_EligibilityCriteria packs "Role at Company · Location · Mode"
          const parts = splitDot(record.MCS_EligibilityCriteria);
          const roleCo = parts[0] || '';
          const [role, co] = roleCo.includes(' at ')
            ? roleCo.split(' at ').map((x) => x.trim())
            : [roleCo, record.AD_Client_ID?.identifier || 'Company'];
          return {
            id: record.id.toString(),
            role: role || `Internship (${record.Duration || 'General'})`,
            co: co || 'Company',
            loc: parts[1] || 'Remote',
            mode: parts[2] || '',
            stipend: record.MCS_Stipend ? `$${record.MCS_Stipend}` : 'Unpaid',
            dur: record.Duration ? `${record.Duration} months` : '3 months',
            when: record.StartDate ? new Date(record.StartDate).toLocaleDateString() : 'Summer',
            criteria: record.MCS_EligibilityCriteria || '',
            logo: (co || 'C').charAt(0),
            tone: getTone(record.id)
          };
        });
        break;

      case 'maids': {
        const rawBookings = await fetchModel('MCS_Maid_Booking', undefined, {
          top: 100,
          orderby: 'Updated desc',
        });

        const getBookingScore = (status: string): number => {
          if (/completed/i.test(status)) return 5;
          if (/approved|confirmed/i.test(status)) return 4;
          if (/pending/i.test(status)) return 3;
          if (/rejected|cancelled/i.test(status)) return 1;
          return 3;
        };

        const mapMaid = (record: any) => {
          const category = record.MCS_Maid_Category?.identifier || 'Maid Service';
          const currency = record.C_Currency_ID?.identifier || '';
          const languageText = record.MCS_Languages?.identifier || record.MCS_Languages?.id || '';
          const languages = String(languageText)
            .replace(/[<>]/g, '')
            .split(',')
            .map((language: string) => language.trim())
            .filter(Boolean);
          const rateSuffix = /hour/i.test(category) ? '/hr' : '';
          const maidBookings = rawBookings.filter((booking: any) => {
            const maidId = typeof booking.MCS_Maid_ID === 'object'
              ? booking.MCS_Maid_ID?.id
              : booking.MCS_Maid_ID;
            return String(maidId) === String(record.id) && booking.IsActive !== false;
          });
          const bookingScores = maidBookings.map((booking: any) =>
            getBookingScore(booking.MCS_Status?.identifier || 'Pending')
          );
          const rating = bookingScores.length > 0
            ? bookingScores.reduce((sum: number, score: number) => sum + score, 0) / bookingScores.length
            : 0;

          return {
            id: record.id.toString(),
            name: record.Name || record.AD_User_ID?.identifier || 'Community Helper',
            avatar: (record.Name || 'M').charAt(0).toUpperCase(),
            verified: Boolean(record.C_BPartner_ID) && record.IsActive !== false,
            services: `${category} Maid Service`,
            rating: Number(rating.toFixed(1)),
            reviewCount: maidBookings.length,
            experience: `${category} service`,
            jobs: `${maidBookings.length} ${maidBookings.length === 1 ? 'review' : 'reviews'}`,
            location: record.C_BPartner_ID?.identifier || 'Location on request',
            price: record.MCS_Rate != null
              ? `${currency ? `${currency} ` : ''}${record.MCS_Rate}${rateSuffix}`
              : 'Contact for rate',
            languages: languages.length > 0 ? languages : ['Contact for languages'],
            about: record.MCS_About || '',
            skills: [category, ...languages],
            workingHours: /hour/i.test(category) ? 'Hourly availability' : 'Contact for availability',
            days: 'Contact for availability',
            startDate: record.IsActive === false ? 'Unavailable' : 'Available now',
            reviews: [],
            tag: category,
            phone: record.Phone || '',
          };
        };

        if (recordId) {
          const maid = await fetchModelRecord('MCS_Maid', recordId);
          data = mapMaid(maid);
        } else {
          const rawMaids = await fetchModel('MCS_Maid', undefined, {
            top: 100,
            orderby: 'Updated desc',
          });
          data = rawMaids
            .filter((record: any) => record.IsActive !== false)
            .map(mapMaid);
        }
        break;
      }
      case 'tiffin':
        const rawTiffin = await fetchModel('MCS_TiffinProvider');
        data = rawTiffin.map((record: any) => {
          // No name/city field in the backend — build a clean identity from the
          // provider's signature (first) dish instead of a truncated menu string.
          const dishes = typeof record.MCS_Menu === 'string'
            ? record.MCS_Menu.split(',').map((d: string) => d.trim()).filter(Boolean)
            : [];
          const signature = dishes[0];
          return {
          id: record.id.toString(),
          name: signature ? `${signature} Home Kitchen` : `Home Tiffin #${record.id}`,
          city: 'Various',
          specialty: signature || 'Home Food',
          per: record.MCS_PricePerMeal ? `$${record.MCS_PricePerMeal}/meal` : 'Varies',
          perMeal: record.MCS_PricePerMeal ? `$${record.MCS_PricePerMeal}` : '-',
          perMonth: record.MCS_PricePerMonth ? `$${record.MCS_PricePerMonth}` : '-',
          delivery: 'Pickup only',
          menu: record.MCS_Menu ? record.MCS_Menu.split(',') : ['Daily Thali'],
          rating: record.Rating ? parseFloat(record.Rating) : 4.5,
          orders: record.MCS_OrderCount || 0,
          mandal: '-',
          tone: getTone(record.id),
          veg: record.MCS_IsVeg || false,
          trial: record.MCS_HasTrial || false,
          days: 'Mon-Fri',
          since: '2023',
          note: ''
          };
        });
        break;

      case 'taxi':
        const rawTaxi = await fetchModel('MCS_TaxiDriver');
        data = rawTaxi.map((record: any) => {
          // ContactDescription packs "Name · City · Service areas"
          const parts = splitDot(record.ContactDescription);
          return {
            id: record.id.toString(),
            name: parts[0] || `Driver #${record.id}`,
            city: parts[1] || 'City',
            areas: parts[2] || 'Metro Area',
            vehicle: record.MCS_Vehicle || 'Sedan',
            type: record.MCS_VehicleType || 'Standard',
            langs: ['Marathi', 'English'],
            rate: record.Rate ? `$${record.Rate}/mi` : 'Standard',
            base: record.MCS_BaseFare ? `$${record.MCS_BaseFare}` : '-',
            rating: record.Rating ? parseFloat(record.Rating) : 4.8,
            trips: record.Counter || 0,
            available: record.IsAvailable !== false,
            mandal: '-',
            tone: getTone(record.id),
            since: '2022',
            note: ''
          };
        });
        break;

      case 'housing': {
        const rawHousing = await fetchModel('MCS_Accommodation', undefined, {
          top: 100,
          orderby: 'Updated desc',
        });
        data = rawHousing
          .filter((record: any) => record.IsActive !== false && record.SP_Listing_Status?.identifier !== 'Inactive')
          .map((record: any) => {
            const accommodationType = record.SP_Accommodation_Type?.identifier || 'Accommodation';
            const area = record.SP_Area || '';
            const city = record.City || '';
            const country = record.C_Country_ID?.identifier || '';
            const location = [area, city, country].filter(Boolean).join(', ') || 'Location unavailable';
            const currency = record.C_Currency_ID?.identifier || '';
            const rentPeriod = record.SP_Rent_Period?.identifier
              || (typeof record.SP_Rent_Period === 'string' ? record.SP_Rent_Period : '');
            const periodSuffix = /^monthly$/i.test(rentPeriod)
              ? '/mo'
              : /^weekly$/i.test(rentPeriod)
                ? '/wk'
                : /^daily$/i.test(rentPeriod)
                  ? '/day'
                  : rentPeriod ? `/${rentPeriod}` : '';

            return {
              id: record.id.toString(),
              title: `${accommodationType} in ${area || city || country || 'available location'}`,
              city: location,
              rent: record.SP_Rent_Amount != null
                ? `${currency ? `${currency} ` : ''}${record.SP_Rent_Amount}${periodSuffix}`
                : 'Contact for rent',
              type: accommodationType,
              gender: record.SP_Gender_Preference?.identifier || 'Anyone',
              size: record.SP_Max_Occupants ? `${record.SP_Max_Occupants} Person(s)` : 'Shared',
              host: record.Posted_By_User_ID?.identifier || 'Community Member',
              stay: record.SP_Available_Until ? 'Short stay' : 'Long-term',
              tone: getTone(record.id),
              nearMe: false,
              student: /student|pg|paying guest/i.test(accommodationType),
              description: record.SP_Additional_Info || '',
              availableFrom: record.SP_Available_From || '',
              availableUntil: record.SP_Available_Until || '',
              amenities: {
                wifi: record.SP_Has_WiFi === true,
                kitchen: record.SP_Has_Kitchen_Access === true,
                laundry: record.SP_Has_Laundry === true,
                furnished: record.SP_Is_Furnished === true,
                parking: record.SP_Has_Parking === true,
                airConditioning: record.SP_Has_AC === true,
              },
            };
          });
        break;
      }
      case 'offers':
        const rawOffers = await fetchModel('MCS_Offers');
        data = rawOffers.map((record: any) => ({
          id: record.id.toString(),
          partner: record.C_BPartner_ID?.identifier || 'Partner',
          cat: record.MCS_Offers_Category_ID?.identifier || 'Discount',
          title: record.Name,
          desc: '',
          code: record.MCS_PromoCode || 'MCS50',
          expires: record.ValidTo ? new Date(record.ValidTo).toLocaleDateString() : 'No expiry',
          tone: getTone(record.id),
          kind: 'ornament',
          savings: record.MCS_Savings || '-',
          claimed: record.MCS_ClaimedCount || 0,
          new: record.MCS_IsNew || false
        }));
        break;

      case 'culture':
        // Return panchang; arti is mock data for now
        const rawPanchang = await fetchModel('MCS_Panchang');
        data = rawPanchang.map((record: any) => ({
          id: record.id.toString(),
          tithi: record.MCS_TithiTitle || 'Tithi',
          day: record.MCS_DevanagariDay || '१',
          sunrise: record.MCS_Sunrise || '06:00',
          sunset: record.MCS_Sunset || '18:00',
          nakshatra: record.MCS_Nakshatra || 'Nakshatra',
          yoga: record.MCS_Yoga || 'Yoga',
          rashi: record.MCS_Rashi || 'Rashi',
          date: record.Date1 || new Date().toISOString()
        }));
        break;

      case 'community-people':
        const rawPeople = await fetchModel('AD_User');
        data = rawPeople.filter(isRealUser).map((record: any) => ({
          name: record.Name,
          role: record.MCS_Role || 'Member',
          city: record.C_Location_ID?.identifier || 'Unknown City',
          mandal: record.MCS_Mandals_ID?.identifier || 'General Mandal',
          open: record.MCS_Open || 'Networking',
          conn: ''
        }));
        break;

      case 'profile':
        const rawProfile = await fetchModel('AD_User');
        const reqUser = searchParams.get('username');
        let user = null;
        if (reqUser) {
          user = rawProfile.find((u: any) =>
            u.Name?.toLowerCase() === reqUser.toLowerCase() ||
            u.EMail?.toLowerCase() === reqUser.toLowerCase()
          );
        }
        if (!user) {
          user = rawProfile.find(isRealUser) || null;
        }
        if (user) {
          data = [{
            name: user.Name,
            marathi: user.MCS_MarathiName || user.Name,
            role: user.MCS_Role || 'Member',
            city: user.C_Location_ID?.identifier || 'Unknown City',
            country: user.C_Country_ID?.identifier || 'Unknown Country',
            origin: user.MCS_OriginalyFrom_ID?.identifier || 'Maharashtra',
            type: user.MCS_LoginType || 'Standard',
            mandal: user.MCS_Mandals_ID?.identifier || 'Unknown Mandal',
            joined: user.Created ? new Date(user.Created).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently',
            bio: user.Description || 'Active community member.',
            langs: user.MCS_Languages ? user.MCS_Languages.split(',') : ['Marathi', 'English'],
            open: user.MCS_Open ? user.MCS_Open.split(',') : ['Networking'],
            email: user.EMail || '',
            phone: user.Phone || user.Phone2 || ''
          }];
        }
        break;

      case 'artis':
        const rawArtis = await fetchModel('MCS_Aarati');
        data = rawArtis.map((record: any) => {
          const logoData = record.AD_Image_ID?.data;
          const logoId = record.AD_Image_ID?.id;
          return {
            title: record.Name,
            deity: record.MCS_Aarati_Category_ID?.identifier || 'Deity',
            duration: record.MCS_Duration || '2:00',
            tone: getTone(record.id),
            popular: record.MCS_IsPopular || false,
            image: logoData ? `data:image/jpeg;base64,${logoData}` : (logoId ? `/api/image/${logoId}` : undefined)
          };
        });
        break;

      case 'calendar-months': {
        const rawMonths = await fetchModel('MCS_MarathiCalendarMonths');
        // Backend stores Gregorian month names duplicated across two calendars
        // (कालनिर्णय / महालक्ष्मी); MCS_DevanagariName actually holds the calendar
        // name, not the month. Prefer a single calendar so months aren't doubled.
        const monthDev: Record<string, string> = {
          January: 'जानेवारी', February: 'फेब्रुवारी', March: 'मार्च', April: 'एप्रिल',
          May: 'मे', June: 'जून', July: 'जुलै', August: 'ऑगस्ट',
          September: 'सप्टेंबर', October: 'ऑक्टोबर', November: 'नोव्हेंबर', December: 'डिसेंबर',
        };
        const monthOrder = Object.keys(monthDev);
        const calName = (r: any) => {
          const c = r.MCS_MarathiCalendar_ID;
          return (typeof c === 'object' ? c?.identifier : c) || '';
        };
        const primary = rawMonths.filter((r: any) => calName(r).includes('कालनिर्णय'));
        let source = primary.length ? primary : rawMonths;
        // Dedupe by month name
        const seenMonths = new Set<string>();
        source = source.filter((r: any) => {
          if (seenMonths.has(r.Value)) return false;
          seenMonths.add(r.Value);
          return true;
        });
        // Order Jan→Dec (unknown/lunar names sort to the end)
        source.sort((a: any, b: any) => {
          const ai = monthOrder.indexOf(a.Value), bi = monthOrder.indexOf(b.Value);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
        const currentMonthName = monthOrder[new Date().getMonth()];
        data = source.map((record: any) => {
          const logoData = record.Logo_ID?.data;
          const logoId = record.Logo_ID?.id;
          return {
            name: record.Value,
            dev: monthDev[record.Value] || record.MCS_DevanagariName || record.Value,
            tone: getTone(record.id),
            days: record.MCS_DayCount || 30,
            current: record.Value === currentMonthName,
            image: logoData ? `data:image/jpeg;base64,${logoData}` : (logoId ? `/api/image/${logoId}` : undefined)
          };
        });
        break;
      }

      case 'newspapers':
        const rawPapers = await fetchModel('MCS_News');
        
        data = rawPapers.map((record: any) => {
          const logoData = record.Logo_ID?.data;
          const logoId = record.Logo_ID?.id;
          return {
            id: record.id.toString(),
            name: record.Name || 'Paper',
            dev: record.MCS_DevanagariName || record.Name,
            est: record.MCS_Establishment_Year || 1900,
            city: record.MCS_CityOfPublication || 'Maharashtra',
            desc: record.Description || 'Marathi daily newspaper.',
            url: record.URL || '#',
            readers: record.MCS_Total_NewsReaders || '100K',
            tone: getTone(record.id),
            image: logoData ? `data:image/jpeg;base64,${logoData}` : (logoId ? `/api/image/${logoId}` : undefined)
          };
        });
        break;

      case 'marketplace':
        const rawMarket = await fetchModel('MCS_MarketPlaces');
        data = rawMarket.map((record: any) => {
          // Description packs "Condition · $Price" e.g. "Like new · $480"
          const parts = splitDot(record.Description);
          const priceStr = parts.find((p) => p.includes('$'));
          const conditionStr = parts.find((p) => !p.includes('$'));
          return {
            id: record.id.toString(),
            title: record.Name,
            price: priceStr || (record.Price ? `$${record.Price}` : '—'),
            currency: record.C_Currency_ID?.identifier || '$',
            condition: conditionStr || record.MCS_Condition || 'Used',
            city: record.Location || 'City',
            desc: record.Description || '',
            seller: record.MCS_PostedBy_ID?.identifier || record.CreatedBy?.identifier || 'User',
            cat: record.MCS_MarketPlace_Category_ID?.identifier || 'General',
            when: record.MCS_StartDate ? new Date(record.MCS_StartDate).toLocaleDateString() : 'Recently',
            tone: getTone(record.id),
            kind: 'ornament',
            mandal: record.MCS_Mandals_ID?.identifier || '-',
            sold: record.IsSold || false,
            featured: record.MCS_IsFeatured || false
          };
        });
        break;

      case 'housing-requests': {
        const rawReqs = await fetchModel('MCS_Accommodation_Requirements', undefined, {
          top: 100,
          orderby: 'Updated desc',
        });
        data = rawReqs
          .filter((record: any) => record.IsActive !== false)
          .map((record: any) => {
            const currency = record.C_Currency_ID?.identifier || '';
            const location = [record.SP_Area, record.City, record.C_Country_ID?.identifier]
              .filter(Boolean)
              .join(', ');

            return {
              name: record.Posted_By_User_ID?.identifier || 'Community Member',
              looking: location || record.SP_Accommodation_Type?.identifier || 'Place',
              budget: record.SP_Rent_Amount
                ? `${currency ? `${currency} ` : ''}${record.SP_Rent_Amount}`
                : 'Flexible',
              when: record.SP_Available_From
                ? new Date(record.SP_Available_From).toLocaleDateString()
                : 'Flexible',
              note: record.SP_Additional_Info || '',
              tone: getTone(record.id),
            };
          });
        break;
      }
      case 'embassy': {
        const mapEmbassy = (record: any) => ({
          id: record.id.toString(),
          type: /consulate/i.test(record.Name || '') ? 'CONSULATE' : 'EMBASSY',
          status: record.IsActive === false ? 'Closed' : 'Open',
          name: record.Name || 'Embassy',
          location: record.Address || record.C_Country_ID?.identifier || 'Address unavailable',
          hours: 'Contact mission for hours',
          distance: record.C_Country_ID?.identifier || '',
          telephone: record.Phone || record.MCS_EmergencyPhone || '',
          email: record.EMail || '',
          website: record.URL || '',
          address: record.Address || '',
          jurisdiction: record.Help || record.Description || '',
          services: typeof record.MCS_Services === 'string'
            ? record.MCS_Services.split(',').map((service: string) => service.trim()).filter(Boolean)
            : [],
          emergencyPhone: record.MCS_EmergencyPhone || '',
          country: record.C_Country_ID?.identifier || '',
          updated: record.Updated || '',
          schedule: {
            submission: 'Contact mission',
            collection: 'Contact mission',
            weekend: 'Contact mission',
            holidays: 'As per mission calendar',
          },
        });

        if (recordId) {
          const embassy = await fetchModelRecord('MCS_Embassy', recordId);
          data = mapEmbassy(embassy);
        } else {
          const rawEmbassies = await fetchModel('MCS_Embassy', undefined, {
            top: sourcePageSize,
            skip: sourceSkipRecords,
            orderby: 'Updated desc',
          });
          data = rawEmbassies.map(mapEmbassy);
        }
        break;
      }
      case 'emergency-contacts': {
        const rawContacts = await fetchModel('MCS_EmergencyContact', undefined, {
          top: 10,
          orderby: 'Updated desc',
        });
        data = rawContacts
          .filter((record: any) => record.IsActive !== false)
          .map((record: any) => {
            const category = record.MCS_Category?.identifier || 'Emergency';
            const color = /police|emergency/i.test(category)
              ? '#8C3123'
              : /medical|ambulance|health/i.test(category)
                ? '#2E7D32'
                : '#284E9C';

            return {
              id: record.id.toString(),
              title: record.Name || 'Emergency Contact',
              subtitle: record.Description || record.Help || category,
              phone: record.Phone || '',
              color,
              isLink: false,
              email: record.EMail || '',
              category,
              country: record.C_Country_ID?.identifier || '',
              is24Hours: record.MCS_Is24Hours === true,
            };
          });
        break;
      }
      case 'help-topics':
        const rawTopics = await fetchModel('MCS_HelpTopic');
        data = rawTopics.map((record: any) => ({
          id: record.id.toString(),
          value: record.Value,
          title: record.Name,
          desc: record.Description || ''
        }));
        break;

      case 'faqs':
        const rawFaqs = await fetchModel('MCS_FAQ');
        data = rawFaqs.map((record: any) => ({
          id: record.id.toString(),
          q: record.MCS_Question || 'Question',
          a: record.Answer || 'Answer',
          topic: record.MCS_HelpTopic_ID?.identifier || 'General'
        }));
        break;

      case 'social-media':
        // 107 rows: social links tied to a mandal (Facebook/Instagram/etc.)
        const rawSocial = await fetchModel('MCS_Socia_Media');
        data = rawSocial
          .filter((r: any) => r.URL)
          .map((record: any) => ({
            id: record.id.toString(),
            name: record.Name || 'Link',
            url: record.URL,
            type: record.MCS_SocialMediaType?.identifier || 'Link',
            mandal: record.MCS_Mandals_ID?.identifier || '',
            mandalId: (typeof record.MCS_Mandals_ID === 'object' ? record.MCS_Mandals_ID?.id : record.MCS_Mandals_ID)?.toString() || '',
            tone: getTone(record.id)
          }));
        break;

      case 'news':
        return NextResponse.json({ error: 'News API is temporarily disabled due to backend primary key issue.' }, { status: 500 });

      default:
        if (model.startsWith('raw_')) {
          const rawModelName = model.replace('raw_', '');
          data = await fetchModel(rawModelName);
          break;
        }
        return NextResponse.json({ error: 'Model mapping not implemented' }, { status: 404 });
    }

    const countryFilteredModels = !['countries', 'profile'].includes(model);
    if (countryFilteredModels && Array.isArray(data) && selectedCountry !== 'All') {
      const normalizeCountry = (value: string) => {
        const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
        const aliases: Record<string, string> = {
          usa: 'unitedstates',
          us: 'unitedstates',
          uk: 'unitedkingdom',
          uae: 'unitedarabemirates',
        };
        return aliases[normalized] || normalized;
      };
      const wantedCountry = normalizeCountry(selectedCountry);
      data = data.filter((item: any) => {
        const candidates = [
          item.country,
          item.city,
          item.location,
          item.loc,
          item.where,
          item.address,
        ].filter((value): value is string => typeof value === 'string' && value.length > 0);
        return candidates.some(value => normalizeCountry(value).includes(wantedCountry));
      });
      data = data.slice(skipRecords, skipRecords + pageSize);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`API Route Error for ${model}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
