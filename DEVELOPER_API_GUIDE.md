# Connect2MCS — Developer API Field Mapping Guide

> **Last verified:** 2026-06-28 | Live iDempiere DB introspection via REST API
>
> This document maps every field in `api_spec.md` to the exact iDempiere table and column.
> Use this as the authoritative reference when building the backend middleware.

---

## iDempiere Connection

| Property | Value |
|---|---|
| Base URL (HTTP) | `http://15.207.222.86:8080` |
| Base URL (HTTPS) | `https://15.207.222.86:8443` |
| Auth endpoint | `POST /api/v1/auth/tokens` |
| Models base | `GET /api/v1/models/{TableName}` |
| Client ID | `1000011` |
| Org ID | `0` |
| Warehouse ID | `1000008` |
| App User Role ID | `1000031` |
| Admin Role ID | `1000028` |

### Auth Request
```json
{
  "userName": "user@email.com",
  "password": "password",
  "parameters": {
    "clientId": 1000011,
    "roleId": 1000031,
    "organizationId": 0,
    "warehouseId": 1000008,
    "language": "en_US"
  }
}
```

### Standard Fields on Every Record
Every iDempiere REST response includes these automatically:

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Numeric primary key — use as `id` in responses |
| `uid` | string | UUID |
| `IsActive` | boolean | Filter with `$filter=IsActive eq 'Y'` |
| `Created` | ISO8601Z string | Use as `when`/`posted`/`joined`/`since` |
| `Updated` | ISO8601Z string | |
| `AD_Client_ID` | object `{id, identifier}` | Always `1000011` |
| `AD_Org_ID` | object `{id, identifier}` | |

### Foreign Key Object Shape
All FK fields return as:
```json
{ "id": 1000045, "identifier": "Human readable name", "model-name": "table_name" }
```
Extract `.identifier` for display strings, `.id` for filtering.

---

## Table Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Table exists and is live on REST API |
| ⚠️ | Table exists in iDempiere admin but has an issue (see note) |
| ❌ | Table does not exist yet — needs to be created |

---

## 1. Businesses — `/api/v1/businesses`

**iDempiere Table:** `C_BPartner` ✅
**REST Endpoint:** `GET /api/v1/models/C_BPartner`
**Suggested Filter:** `$filter=IsActive eq 'Y' and IsCustomer eq 'Y'`

### Field Mapping

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `id` | `id` | integer | System field |
| `name` | `Name` | string | Business name |
| `owner` | `Name2` | string | Owner name |
| `cat` | `C_BP_Group_ID.identifier` | FK → `C_BP_Group` | Business category |
| `city` | `C_City_ID.identifier` | FK → `C_City` | City name |
| `desc` | `Description` | string | Business description |
| `services` | `MCS_Services` | string (multi-select) | Parse as comma-separated list |
| `rating` | `Rating` | string(1) | A–E scale; convert to 1–5 numeric on backend |
| `reviews` | `MCS_ReviewCount` | integer | Review count |
| `years` | `VH_YearsInBusiness` | integer | Years in business |
| `tone` | *(computed)* | — | Derive from `C_BP_Group_ID` or rating |
| `mandal` | `MCS_Mandals_ID.identifier` | FK → `MCS_Mandals` | Linked mandal |
| `verified` | `IsVerified` | boolean (Yes-No) | |
| `phone` | `Phone` | string | Optional |

### `GET /businesses/stats`
Computed aggregation — count records grouped by `C_BP_Group_ID`, verified count, etc. No separate table.

---

## 2. Chat — `/api/v1/chat`

**Source:** Firebase Firestore — **no iDempiere table**

| api_spec field | Firestore Path | Notes |
|---|---|---|
| `name` | `users/{uid}.displayName` | |
| `mandal` | `users/{uid}.orgName` | |
| `group` | `chats/{chatId}.isGroup` | |
| `last` | `chats/{chatId}.lastMessage` | |
| `when` | `chats/{chatId}.lastMessageTime` | |
| `unread` | `chats/{chatId}.unreadCount.{uid}` | |
| `online` | `users/{uid}.is_online` | |
| `from` | `messages/{id}.senderId` | Compare to current user uid |
| `text` | `messages/{id}.text` | |
| `at` | `messages/{id}.timestamp` | |

---

## 3. Community — `/api/v1/community`

### `GET /community/people`
**iDempiere Table:** `AD_User` ✅
**REST Endpoint:** `GET /api/v1/models/AD_User`
**Suggested Filter:** `$filter=IsActive eq 'Y' and VH_IsGuestUser eq 'N'`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `name` | `Name` | string | |
| `role` | `MCS_Role` | string | |
| `city` | `C_Location_ID.City` | FK → `C_Location` | Expand or resolve |
| `mandal` | `MCS_Mandals_ID.identifier` | FK → `MCS_Mandals` | |
| `open` | `MCS_Open` | string | e.g. "Mentor", "Refer" |
| `conn` | *(computed)* | — | Mutual connections count from Firebase |

### `GET /community/groups`
**iDempiere Table:** `MCS_CommunityGroup` ❌ **NOT YET CREATED**

| api_spec field | iDempiere Column | Type |
|---|---|---|
| `name` | `Name` | string(60) |
| `members` | `MCS_MemberCount` | integer |
| `posts` | `MCS_LastPost` | string(255) |
| `tone` | *(computed)* | — |
| `kind` | *(computed)* | — |

### `GET /community/stats`
Computed — count from `AD_User`, `MCS_Mandals`, connections. No separate table.

---

## 4. Culture — `/api/v1/culture`

### `GET /culture/panchang/today`
**iDempiere Table:** `MCS_Panchang` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_Panchang`
**Filter by today:** `$filter=Date1 eq '{YYYY-MM-DD}'`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `title` | `MCS_TithiTitle` | string | e.g. "Vaishakh Shukla Saptami" |
| `devanagariDay` | `MCS_DevanagariDay` | string | e.g. "७" |
| `dateLine` | `Date1` | date | Format for display |
| `details[].key="Vara"` | `MCS_Vara` | string | Day of week (Vedic) |
| `details[].key="Nakshatra"` | `MCS_Nakshatra` | string | Lunar mansion |
| `details[].key="Yoga"` | `MCS_Yoga` | string | Yogam |
| `details[].key="Rashi"` | `MCS_Rashi` | string | Moon sign |
| `details[].key="Karana"` | `MCS_Karana` | string | Half-tithi |
| `homeHighlights[]["Sunrise"]` | `MCS_Sunrise` | string | e.g. "06:08" |
| `homeHighlights[]["Sunset"]` | `MCS_Sunset` | string | e.g. "19:42" |

### `GET /culture/artis`
**iDempiere Table:** `MCS_Aarati` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_Aarati?$orderby=Sequence`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `title` | `Name` | string | |
| `deity` | `MCS_Aarati_Category_ID.identifier` | FK | Deity/category name |
| `duration` | `MCS_Duration` | string | e.g. "3:45" |
| `tone` | *(computed)* | — | Derive from category |
| `popular` | `MCS_IsPopular` | boolean (Yes-No) | |

> Image/audio: `AD_Image_ID` — base64 in `.data` field. `WeekDay` available for scheduling filter.

### `GET /culture/calendar/months`
**iDempiere Table:** `MCS_MarathiCalendarMonths` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_MarathiCalendarMonths`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `months[].name` | `Name` | string | English month name |
| `months[].dev` | `MCS_DevanagariName` | string | Marathi month name |
| `months[].tone` | *(computed)* | — | Rotate from palette |
| `months[].days` | `MCS_DayCount` | integer | Days in month |
| `months[].current` | *(computed)* | — | Compare `Value` to current month |
| `festivalDays` | `MCS_FestivalDays` | string | Parse as comma-separated day numbers |

---

## 5. Events — `/api/v1/events`

### `GET /events`
**iDempiere Table:** `MCS_Event` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_Event`
**Filters:** `$filter=MCS_Event_Category_ID eq {id}` / `$filter=C_Country_ID eq {id}`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `id` | `id` | integer | |
| `day` | `MCS_StartDate` | ISO8601Z | Extract day number on backend |
| `month` | `MCS_StartDate` | ISO8601Z | Extract month abbreviation |
| `wk` | `MCS_StartDate` | ISO8601Z | Extract day-of-week abbreviation |
| `title` | `Name` | string | |
| `where` | `Location` | string | Venue text |
| `cat` | `MCS_Event_Category_ID.identifier` | FK → `MCS_Event_Category` | |
| `going` | `MCS_RSVPCount` | integer | |
| `free` | `MCS_IsFree` | boolean (Yes-No) | |
| `price` | `Price` | decimal | Format as currency string |
| `tone` | *(computed)* | — | Derive from category |

> Also available: `MCS_EndDate`, `MCS_EventRegLink`, `MCS_Logo_ID`, `C_BPartner_ID`, `MCS_Mandals_ID`

### `GET /events/calendar/week`
Computed from `MCS_Event` — count events grouped by `MCS_StartDate` for current week.

---

## 6. Help & Support — `/api/v1/help`

### `GET /help/topics`
**iDempiere Table:** `MCS_HelpTopic` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_HelpTopic`

| api_spec field | iDempiere Column | Type |
|---|---|---|
| `icon` | `MCS_IconName` | string |
| `title` | `Name` | string |
| `desc` | `Description` | string |
| `count` | `MCS_ArticleCount` | integer |

### `GET /help/faqs`
**iDempiere Table:** `MCS_FAQ` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_FAQ?$orderby=Sequence`

| api_spec field | iDempiere Column | Type |
|---|---|---|
| `q` | `MCS_Question` | string |
| `a` | `Answer` | string |

> `MCS_HelpTopic_ID` available for filtering FAQs by topic.

---

## 7. Home Page — `/api/v1/home`

### `GET /home/feed`
All fields are **aggregated from other tables** — no separate home table needed.

| api_spec field | Source |
|---|---|
| `heroStats` | COUNT from `MCS_Mandals`, `AD_User`, `MCS_Event`, `C_BPartner` |
| `featuredMandals[].name` | `MCS_Mandals.Name` |
| `featuredMandals[].city` | `MCS_Mandals` → `C_Location_ID.City` |
| `featuredMandals[].code` | `MCS_Mandals.Value` |
| `featuredMandals[].rating` | `MCS_Mandals.Rating` |
| `featuredMandals[].members` | `MCS_Mandals.MCS_MemberCount` |
| `featuredMandals[].events` | `MCS_Mandals.MCS_EventCount` |
| `featuredMandals[].badge` | `MCS_Mandals.MCS_Badge` |
| `featuredMandals[].dist` | *(computed from user location)* |
| `featuredEvents[].day/month` | `MCS_Event.MCS_StartDate` |
| `featuredEvents[].title` | `MCS_Event.Name` |
| `featuredEvents[].where` | `MCS_Event.Location` |
| `featuredEvents[].going` | `MCS_Event.MCS_RSVPCount` |
| `featuredEvents[].tag` | `MCS_Event.MCS_Tag` (if added) |
| `resources` | Static config or CMS |

---

## 8. Housing — `/api/v1/housing`

### `GET /housing/listings`
**iDempiere Table:** `MCS_Accommodation_Listings` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_Accommodation_Listings`
**Filter:** `$filter=IsActive eq 'Y' and SP_Listing_Status eq 'Available'`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `id` | `id` | integer | |
| `title` | `Name` | string | |
| `city` | `City` | string(60) | Free-text city name |
| `rent` | `SP_Rent_Amount` + `SP_Rent_Period` | Amount + List | Combine: "$1,200/mo" |
| `type` | `SP_Accommodation_Type` | List | Single Room / Shared / Apartment |
| `gender` | `SP_Gender_Preference` | List | Any / Male / Female |
| `size` | `SP_Area` | string | e.g. "1BR", "500 sqft" |
| `host` | `Posted_By_User_ID.identifier` | FK → `AD_User` | |
| `stay` | `SP_Available_From` | date | Availability start |
| `tone` | *(computed)* | — | |
| `nearMe` | *(computed)* | — | Based on user's city vs `City` |
| `student` | `IsStudentFriendly` | boolean (Yes-No) | |

> Also available: `SP_Available_Until`, `SP_Listing_Status`, `IsApproved`, `C_Country_ID`, `C_Currency_ID`, `MCS_Mandals_ID`, amenities: `SP_Has_WiFi`, `SP_Has_AC`, `SP_Has_Kitchen_Access`, `SP_Has_Laundry`, `SP_Has_Parking`, `SP_Is_Furnished`, `SP_Max_Occupants`, `SP_Additional_Info`

> Images: `MCS_Accommodation_Images` table — filter by `MCS_Accommodation_Listings_ID`

> Bookings: `MCS_Accommodation_Bookings` table — `SP_Applied_By_User_ID`, `SP_Booking_Status`, `SP_Move_In_Date`, `SP_Move_Out_Date`, `SP_Message_To_Owner`, `SP_Owner_Response`

### `GET /housing/requests`
**iDempiere Table:** `MCS_Accommodation_Requirements` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_Accommodation_Requirements`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `name` | `Posted_By_User_ID.identifier` | FK → `AD_User` | Requester's name |
| `looking` | `SP_Accommodation_Type` | List | What they want |
| `budget` | `SP_Rent_Amount` | Amount | Budget range |
| `when` | `SP_Available_From` | date | When they need it |
| `note` | `SP_Additional_Info` | text | Additional notes |
| `tone` | *(computed)* | — | |

---

## 9. Jobs — `/api/v1/jobs`

### `GET /jobs`
**iDempiere Table:** `MCS_Jobs` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_Jobs`
**Filters:** `$filter=MCS_Job_Category_ID eq {id}` / `$filter=C_Country_ID eq {id}`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `id` | `id` | integer | |
| `role` | `Name` | string | Job title |
| `co` | `C_BPartner_ID.identifier` | FK → `C_BPartner` | Company name |
| `loc` | `Location` | string | City/region |
| `pay` | `GS_SalaryRange` | string | e.g. "400 - 500" |
| `type` | `MCS_JobType` | string/List | Full-time / Part-time / Contract |
| `exp` | `VH_Experience` | string | Experience required |
| `posted` | `Created` | ISO8601Z | Format as relative date |
| `tag` | `MCS_Tag` | string | e.g. "Urgent", "Remote" |
| `applicants` | `MCS_ApplicantCount` | integer | |
| `logo` | via `C_BPartner_ID` → `Logo_ID` | image | Resolve from C_BPartner record |
| `tone` | *(computed)* | — | Derive from category |
| `cat` | `MCS_Job_Category_ID.identifier` | FK → `MCS_Job_Category` | |

> Also available: `GS_EducationalQualitifaction` *(note: typo is intentional in DB)*, `VH_AdditionalEduQual`, `DetailInfo`, `Description`, `C_Country_ID`, `C_Currency_ID`

---

## 10. Learn — `/api/v1/learn`

### `GET /learn/scholarships`
**iDempiere Table:** `MCS_Scholarship` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_Scholarship`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `id` | `id` | integer | |
| `title` | `Name` | string | |
| `org` | `MCS_Org_ID.identifier` | FK | Organisation name |
| `amount` | `Amount` | decimal | Format as currency string |
| `field` | `MCS_FIeld` | string | ⚠️ Typo in DB: `MCS_FIeld` not `MCS_Field` |
| `deadline` | `MCS_Deadline` | date | |
| `eligible` | `MCS_IsEligible` | boolean (Yes-No) | |
| `tone` | *(computed)* | — | |

> Also available: `MCS_EligibilityCriteria`, `Value`

### `GET /learn/internships`
**iDempiere Table:** `MCS_Internship` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_Internship`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `id` | `id` | integer | |
| `role` | `Name` | string | Internship title |
| `co` | `MCS_Org_ID.identifier` | FK | Organisation name |
| `loc` | `C_City_ID.identifier` | FK → `C_City` | City |
| `stipend` | `MCS_Stipend` | string | e.g. "$1,500/mo" |
| `dur` | `Duration` | string | e.g. "3 months" |
| `when` | `StartDate` | date | Start date |
| `logo` | `MCS_Logo_ID` | FK → `AD_Image` | |
| `tone` | *(computed)* | — | |

### `GET /learn/deadlines`
Computed — merge `MCS_Scholarship.MCS_Deadline` and `MCS_Internship.StartDate`, sort by date, compute `daysLeft`.

### `GET /learn/applications`
**iDempiere Table:** `MCS_Application` ❌ **NOT YET CREATED**

| api_spec field | iDempiere Column | Type |
|---|---|---|
| `item` | `Name` | string(60) |
| `kind` | `MCS_ItemType` | List ('Scholarship' / 'Internship') |
| `status` | `MCS_Status` | List ('pending' / 'approved' / 'rejected') |
| `when` | `Date1` | date |

> Also add: `AD_User_ID` (FK → AD_User), `MCS_Scholarship_ID` (FK → MCS_Scholarship), `MCS_Internship_ID` (FK → MCS_Internship)

---

## 11. Mandals — `/api/v1/mandals`

### `GET /mandals`
**iDempiere Table:** `MCS_Mandals` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_Mandals`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `name` | `Name` | string | |
| `city` | `C_Location_ID.City` | FK → `C_Location` | Expand or resolve |
| `country` | `C_Location_ID.C_Country_ID.identifier` | FK chain | |
| `est` | `MCS_Establishment_Year` | integer | |
| `members` | `MCS_MemberCount` | integer | |
| `events` | `MCS_EventCount` | integer | |
| `rating` | `Rating` | string/decimal | |
| `dist` | *(computed)* | — | Based on user location |
| `tone` | *(computed)* | — | Rotate from palette by ID |
| `code` | `Value` | string | Short identifier |
| `hosting` | `MCS_IsHosting` | boolean (Yes-No) | |
| `region` | `C_Location_ID.RegionName` | FK chain | State/region |
| `nearMe` | *(computed)* | — | Based on user city match |
| `badge` | `MCS_Badge` | string | e.g. "Top Rated" |
| `home` | *(computed)* | — | Flag for home feature |

> Also available: `Description`, `MCS_AboutUs`, `MCS_Location_Coordinates`, `MCS_Mandals_Category_ID`, `Phone`, `Phone2`, `EMail`, `Fax`

---

## 12. Marketplace — `/api/v1/marketplace`

### `GET /marketplace/listings`
**iDempiere Table:** `MCS_MarketPlaces` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_MarketPlaces`
**Filters:** `$filter=MCS_MarketPlace_Category_ID eq {id}` / `$filter=IsSold eq 'N'`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `id` | `id` | integer | |
| `title` | `Name` | string | |
| `price` | `Price` | decimal (Costs+Prices) | Format as currency string |
| `currency` | `C_Currency_ID.identifier` | FK → `C_Currency` | e.g. "USD" |
| `condition` | `MCS_Condition` | List | New / Like new / Good / Used |
| `city` | `Location` | string | Text location or use `C_City_ID` |
| `seller` | `MCS_PostedBy_ID.identifier` | FK → `AD_User` | Posted by user |
| `cat` | `MCS_MarketPlace_Category_ID.identifier` | FK → `MCS_MarketPlace_Category` | |
| `when` | `MCS_StartDate` | ISO8601Z | Listing date |
| `tone` | *(computed)* | — | |
| `kind` | *(computed)* | — | Derive from category |
| `mandal` | `MCS_Mandals_ID.identifier` | FK → `MCS_Mandals` | |
| `sold` | `IsSold` | boolean (Yes-No) | |
| `featured` | `MCS_IsFeatured` | boolean (Yes-No) | |

> Also available: `C_BPartner_ID`, `C_City_ID`, `MCS_EndDate`, `Description`, `Help`, `MCS_Logo_ID`

---

## 13. Mentorship — `/api/v1/mentorship`

### `GET /mentorship/mentors`
**iDempiere Table:** `MCS_Mentor` ❌ **NOT YET CREATED**

| api_spec field | iDempiere Column | Type |
|---|---|---|
| `name` | `Name` | string(60) |
| `role` | `MCS_Role` | string(60) |
| `years` | `VH_YearsInBusiness` | integer |
| `city` | `C_City_ID` | FK → `C_City` |
| `mandal` | `MCS_Mandals_ID` | FK → `MCS_Mandals` |
| `topics` | `MCS_Topics` | string(255) (comma-separated) |
| `slots` | `MCS_AvailableSlots` | integer |
| `rate` | `MCS_Rate` | string(40) |
| `tone` | *(computed)* | — |

> Also add: `AD_User_ID` (FK → AD_User, links mentor to user profile)

### `GET /mentorship/sessions`
**iDempiere Table:** `MCS_MentorSession` ❌ **NOT YET CREATED**

| api_spec field | iDempiere Column | Type |
|---|---|---|
| `with` | `MCS_Mentor_ID.identifier` | FK → `MCS_Mentor` |
| `when` | `Date1` | date |
| `topic` | `MCS_Topic` | string(255) |
| `status` | `MCS_Status` | List ('upcoming' / 'past') |

> Also add: `Name`, `Value`, `AD_User_ID` (FK → AD_User, the mentee)

### `GET /mentorship/stats`
Computed aggregation from `MCS_MentorSession` and `MCS_Mentor`.

---

## 14. News Articles — `/api/v1/news`

### `GET /news`
**iDempiere Table:** `MCS_News_News` ⚠️ **EXISTS IN DB BUT REST 404**

> **Action required:** The primary key column is named `MCS_News_ID` but should be `MCS_News_News_ID` to match iDempiere REST conventions. Rename it, then the endpoint `/api/v1/models/MCS_News_News` will work.
>
> **Also add these 3 missing columns:**

| Missing column | Type | Maps to api_spec field |
|---|---|---|
| `MCS_Author` | string(60) | `author` |
| `MCS_ReadTime` | string(20) | `read` (e.g. "4 min read") |
| `MCS_IsFeatured` | Yes-No | `featured` |

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `id` | `id` | integer | |
| `cat` | `MCS_News_Category_ID.identifier` | FK → `MCS_News_Category` | Shared with newspapers |
| `tone` | *(computed)* | — | |
| `title` | `Name` | string(60) | |
| `excerpt` | `Description` | string(255) | |
| `when` | `Created` | ISO8601Z | Publish date |
| `read` | `MCS_ReadTime` | string | ⚠️ Add this column |
| `author` | `MCS_Author` | string | ⚠️ Add this column |
| `featured` | `MCS_IsFeatured` | boolean | ⚠️ Add this column |

> Full article text: `Help` (string 2000) — available when fetching single record.

---

## 15. Newspapers — `/api/v1/newspapers`

### `GET /newspapers`
**iDempiere Table:** `MCS_News` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_News`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `id` | `id` | integer | |
| `dev` | `MCS_DevanagariName` | string | Marathi name |
| `est` | `MCS_Establishment_Year` | integer | Year founded |
| `city` | `MCS_CityOfPublication` | string | City of publication |
| `desc` | `Description` | string | |
| `readers` | `MCS_Total_NewsReaders` | string | e.g. "2.5M" |
| `tone` | *(computed)* | — | |

> Also available: `Name`, `Logo_ID`, `URL`, `MCS_News_Category_ID`

### `GET /newspapers/:id/headlines`
No dedicated headlines table in DB. Options:
- Use `Help` field on `MCS_News` record for HTML content
- Or create a separate `MCS_News_Headlines` table
- Or scrape/proxy via URL field

---

## 16. Offers — `/api/v1/offers`

### `GET /offers/featured` and `GET /offers`
**iDempiere Table:** `MCS_Offers` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_Offers`
**Featured filter:** `$filter=MCS_IsNew eq 'Y'` or sort by `MCS_ClaimedCount`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `id` | `id` | integer | |
| `partner` | `C_BPartner_ID.identifier` | FK → `C_BPartner` | Business name |
| `cat` | `MCS_Offers_Category_ID.identifier` | FK | Offer category |
| `title` | `Name` | string | |
| `desc` | `Description` | string | |
| `code` | `MCS_PromoCode` | string | Promo code |
| `expires` | `ValidTo` | date | Expiry date |
| `tone` | *(computed)* | — | |
| `kind` | `MCS_Kind` | string/List | |
| `savings` | `MCS_Savings` | string | e.g. "20% off" |
| `claimed` | `MCS_ClaimedCount` | integer | |
| `new` | `MCS_IsNew` | boolean (Yes-No) | |

> Also available: `ValidFrom`

---

## 17. Profile — `/api/v1/profile`

### `GET /profile/me` and `PUT /profile/me`
**iDempiere Table:** `AD_User` ✅
**REST Endpoint:** `GET /api/v1/models/AD_User/{id}` (by logged-in user's ID)

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `name` | `Name` | string | Full name |
| `marathi` | `MCS_MarathiName` | string | Name in Devanagari |
| `role` | `MCS_Role` | string | e.g. "Software Engineer" |
| `city` | `C_Location_ID.City` | FK → `C_Location` | |
| `origin` | `MCS_OriginalyFrom_ID.identifier` | FK | City/region of origin |
| `type` | `MCS_LoginType` | string | Login/membership type |
| `mandal` | `MCS_Mandals_ID.identifier` | FK → `MCS_Mandals` | |
| `joined` | `Created` | ISO8601Z | Format as month/year |
| `bio` | `Description` | string | Bio/notes |
| `langs` | `MCS_Languages` | string (multi-select) | Parse as list |
| `open` | `MCS_Open` | string | Open for: Mentor, Refer, etc. |
| `email` | `EMail` | string | |
| `phone` | `Phone` | string | |

> Also available: `Title`, `Phone2`, `VH_Education`, `VH_Experience`, `DateLastLogin`, `MCS_LoginType`, `VH_IsGuestUser`

### `GET /profile/saved-mandals`
**iDempiere Table:** `MCS_SavedMandal` ❌ **NOT YET CREATED**

| api_spec field | iDempiere Column | Type |
|---|---|---|
| `name` | via `MCS_Mandals_ID.identifier` | FK → `MCS_Mandals` |
| `city` | via MCS_Mandals record | resolved |
| `tone` | *(computed)* | — |

> Add: `Name`, `Value`, `AD_User_ID` (FK → AD_User), `MCS_Mandals_ID` (FK → MCS_Mandals)

### `GET /profile/events`
**iDempiere Table:** `MCS_Event_RSVP` ❌ **NOT YET CREATED**

| api_spec field | iDempiere Column | Type |
|---|---|---|
| `day` | via `MCS_Event_ID` → `MCS_StartDate` | resolved |
| `month` | via `MCS_Event_ID` → `MCS_StartDate` | resolved |
| `title` | via `MCS_Event_ID.identifier` | resolved |
| `role` | `MCS_RSVPRole` | List ('Attendee' / 'Host' / 'Speaker') |

> Add: `Name`, `Value`, `MCS_Event_ID` (FK → MCS_Event), `AD_User_ID` (FK → AD_User), `MCS_RSVPRole`

---

## 18. Rates — `/api/v1/rates`

**Source:** External forex API — **no iDempiere table**

Suggested: [ExchangeRate-API](https://www.exchangerate-api.com/) or [Open Exchange Rates](https://openexchangerates.org/)

| api_spec field | Source |
|---|---|
| `code` | Currency code (USD, INR, GBP…) |
| `flag` | Emoji flag derived from currency code |
| `name` | Currency full name |
| `rate` | Live rate from external API |
| `change` | 24hr change % from external API |
| `high` / `low` | 24hr high/low from external API |
| `popular` | Hardcoded flag for INR, USD, GBP, AUD, CAD |

---

## 19. Taxi — `/api/v1/taxi`

### `GET /taxi/drivers`
**iDempiere Table:** `MCS_TaxiDriver` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_TaxiDriver`
**Filter:** `$filter=C_City_ID eq {id}`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `id` | `id` | integer | |
| `name` | `Name` | string | |
| `city` | `C_City_ID.identifier` | FK → `C_City` | |
| `areas` | `ContactDescription` | string | Service areas |
| `vehicle` | `MCS_Vehicle` | string | Vehicle name/model |
| `type` | `MCS_VehicleType` | string/List | Sedan / SUV / Van |
| `langs` | `MCS_Languages` | string (multi-select) | Parse as list |
| `rate` | `Rate` | string | e.g. "$2.50/mile" |
| `base` | `MCS_BaseFare` | string | Base fare |
| `rating` | `Rating` | decimal | |
| `trips` | `Counter` | integer | Trip count |
| `available` | `IsAvailable` | boolean (Yes-No) | |
| `mandal` | *(linked via AD_User_ID if set)* | — | Resolve from profile |
| `tone` | *(computed)* | — | |
| `since` | `Created` | ISO8601Z | Member since |
| `note` | `ContactDescription` | string | Same as areas; split if needed |

### `GET /taxi/metadata`
Computed — distinct `C_City_ID` values from `MCS_TaxiDriver`. Suggestions are static or from a config table.

---

## 20. Tiffin — `/api/v1/tiffin`

### `GET /tiffin/providers`
**iDempiere Table:** `MCS_TiffinProvider` ✅
**REST Endpoint:** `GET /api/v1/models/MCS_TiffinProvider`
**Filter by city:** `$filter=C_City_ID eq {id}`

| api_spec field | iDempiere Column | Type | Notes |
|---|---|---|---|
| `id` | `id` | integer | |
| `name` | `Name` | string | |
| `city` | `C_City_ID.identifier` | FK → `C_City` | |
| `specialty` | `Description` | string | Short specialty description |
| `per` | `MCS_PricePerServing` | string | e.g. "$8/serving" |
| `perMeal` | `MCS_PricePerMeal` | string | e.g. "$12/meal" |
| `perMonth` | `MCS_PricePerMonth` | string | e.g. "$250/month" |
| `delivery` | *(computed from `MCS_ServiceDays`)* | — | |
| `menu` | `MCS_Menu` | string (multi-select) | Parse as list |
| `rating` | `Rating` | decimal | |
| `orders` | *(order count — no column yet)* | — | Add `MCS_OrderCount` if needed |
| `mandal` | *(linked via profile)* | — | |
| `tone` | *(computed)* | — | |
| `veg` | *(derive from `MCS_Menu`)* | — | Check if menu contains veg-only items |
| `trial` | *(no column — add if needed)* | — | Add `MCS_HasTrial` Yes-No |
| `days` | `MCS_ServiceDaysText` | string | e.g. "Mon–Sat" |
| `since` | `Created` | ISO8601Z | |
| `note` | `Description` | string | |

---

## Tables Still Needing to Be Created

| Table | For | Columns Needed |
|---|---|---|
| `MCS_CommunityGroup` | `/api/v1/community/groups` | Name, Value, MCS_MemberCount (Integer), MCS_LastPost (String 255), Description, IsActive |
| `MCS_Mentor` | `/api/v1/mentorship/mentors` | Name, Value, MCS_Role (String 60), VH_YearsInBusiness (Integer), C_City_ID (FK), MCS_Mandals_ID (FK), MCS_Topics (String 255), MCS_AvailableSlots (Integer), MCS_Rate (String 40), AD_User_ID (FK) |
| `MCS_MentorSession` | `/api/v1/mentorship/sessions` | Name, Value, MCS_Mentor_ID (FK), AD_User_ID (FK), Date1 (Date), MCS_Topic (String 255), MCS_Status (List) |
| `MCS_Event_RSVP` | `/api/v1/profile/events` | Name, Value, MCS_Event_ID (FK), AD_User_ID (FK), MCS_RSVPRole (List) |
| `MCS_SavedMandal` | `/api/v1/profile/saved-mandals` | Name, Value, AD_User_ID (FK), MCS_Mandals_ID (FK) |
| `MCS_Application` | `/api/v1/learn/applications` | Name, Value, AD_User_ID (FK), MCS_ItemType (List), MCS_Scholarship_ID (FK, nullable), MCS_Internship_ID (FK, nullable), MCS_Status (List), Date1 (Date) |

---

## Fixes Required on Existing Tables

| Table | Issue | Fix |
|---|---|---|
| `MCS_News_News` | Primary key named `MCS_News_ID` → REST API returns 404 | Rename PK column to `MCS_News_News_ID` |
| `MCS_News_News` | Missing `MCS_Author` | Add column: String(60) |
| `MCS_News_News` | Missing `MCS_ReadTime` | Add column: String(20) |
| `MCS_News_News` | Missing `MCS_IsFeatured` | Add column: Yes-No |

---

## Computed Fields Reference

These fields in `api_spec.md` are not stored in iDempiere — they must be computed by the backend middleware:

| Field | Where used | How to compute |
|---|---|---|
| `tone` | Almost all interfaces | Assign from a rotating palette based on record ID or category |
| `kind` | Marketplace, Community | Map from category name to SceneKind enum |
| `dist` | Mandals, Housing | Haversine from user's coordinates vs record location |
| `nearMe` | Mandals, Housing | `dist < threshold` (e.g. 50 miles) |
| `conn` | Community people | Count mutual Firebase connections |
| `daysLeft` | Learn deadlines | `deadline - today` in days |
| `current` | Calendar months | Compare month name to current month |
| `flag` | Exchange rates | Derive emoji flag from currency code |
| `wk` | Events | Extract day-of-week from `MCS_StartDate` |
| `day` / `month` | Events, Profile events | Extract from `MCS_StartDate` |
| `veg` | Tiffin | Check if `MCS_Menu` contains only vegetarian items |
