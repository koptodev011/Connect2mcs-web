# iDempiere Gap Analysis — Batch Run

Generated 2026-07-09. 20 feature questions run through `/idempiere-gap` skill.
Route switch checked live in `src/app/api/data/[model]/route.ts` (cases: jobs, mandals, businesses, events, scholarships, internships, tiffin, taxi, housing, offers, culture, community-people, profile, artis, calendar-months, newspapers, marketplace, housing-requests, help-topics, faqs, social-media, news).

---

## Feature Gap Analysis

### 1. "Save Job" bookmark button (mobile)

**Exists already:** `MCS_Jobs` table live. `AD_User` is bookmarking actor.
**Missing:**
- Table: `MCS_SavedJob` (new) — no equivalent found (only `MCS_SavedMandal` listed as not-yet-created, saved jobs same gap)
  - `AD_User_ID` FK → AD_User
  - `MCS_Jobs_ID` FK → MCS_Jobs
  - `IsActive`, `Created` standard cover "saved date"

**Process/Workflow:** No process needed — plain child-record insert. Toggle save = POST create, unsave = DELETE (or IsActive=false).

**API:**
```bash
# Save
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_SavedJob' \
--header 'Content-Type: application/json' --header 'Authorization: Bearer {JWT}' \
--data '{
  "AD_User_ID": { "id": 1000123, "identifier": "User Name", "model-name": "ad_user" },
  "MCS_Jobs_ID": { "id": 1000045, "identifier": "Job Title", "model-name": "mcs_jobs" },
  "IsActive": true
}'

# Check saved jobs for user
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_SavedJob?$filter=AD_User_ID eq 1000123 and IsActive eq true&$expand=MCS_Jobs_ID' \
--header 'Authorization: Bearer {JWT}'

# Unsave
curl --location --request DELETE 'http://15.207.222.86:8080/api/v1/models/MCS_SavedJob/{id}' \
--header 'Authorization: Bearer {JWT}'
```

**Next.js:** New table not yet in switch. Add `case 'saved-jobs':` in `route.ts`, register `MCS_SavedJob` model mapping. Needs table created in iDempiere first (not yet created).

---

### 2. Job application flow (apply → employer sees applicants)

**Exists already:** `MCS_Jobs` (listing), `C_BPartner` (employer, via `C_BPartner_ID` on `MCS_Jobs`), `AD_User` (applicant).
**Missing:**
- Table: `MCS_Application` — listed as not-yet-created (generic; reused here for jobs, not just scholarship/internship)
  - `AD_User_ID` FK → applicant
  - `MCS_Jobs_ID` FK → job
  - `MCS_Status` List (Applied/Reviewed/Shortlisted/Rejected/Hired)
  - `MCS_CoverNote` Text (optional)
  - Resume: use **attachment** on the application record, not a new column

**Process/Workflow:** State-transition with side effects (notify employer on apply, notify applicant on status change) → **iDempiere Process** `MCS_SubmitJobApplication` and optionally a **Workflow** if employer approval/review chain is multi-step.

**API:**
```bash
# Apply
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_Application' \
--header 'Content-Type: application/json' --header 'Authorization: Bearer {JWT}' \
--data '{
  "AD_User_ID": { "id": 1000123, "identifier": "Applicant", "model-name": "ad_user" },
  "MCS_Jobs_ID": { "id": 1000045, "identifier": "Job Title", "model-name": "mcs_jobs" },
  "MCS_Status": "Applied"
}'

# Attach resume
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_Application/{id}/attachments' \
--header 'Authorization: Bearer {JWT}' --data '{ "name": "resume.pdf", "data": "{base64}" }'

# Employer: list applicants for a job
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_Application?$filter=MCS_Jobs_ID eq 1000045&$expand=AD_User_ID($select=Name,EMail,Phone)' \
--header 'Authorization: Bearer {JWT}'

# Update status (process, if notification side-effect needed)
curl --location 'http://15.207.222.86:8080/api/v1/processes/mcs_updateapplicationstatus' \
--header 'Content-Type: application/json' --header 'Authorization: Bearer {JWT}' \
--data '{ "Record_ID": 5001, "MCS_Status": "Shortlisted" }'
```

**Next.js:** New `case 'job-applications':` needed in route switch. Table doesn't exist yet — create in iDempiere first.

---

### 3. Show connection count with a mandal member

**Exists already:** None — "connections" concept absent from ecosystem entirely. No `R_ContactInterest`-style peer link found for user-to-user relationships in the known table inventory.
**Missing:**
- Table: `MCS_Connection` (new, not in inventory at all — genuinely new concept)
  - `AD_User_ID` FK → requester
  - `MCS_ConnectedUser_ID` FK → AD_User (target)
  - `MCS_Status` List (Pending/Accepted/Blocked)

**Computed value:** "How many connections" = **COUNT, compute in Next.js API route** — do not store a counter column (avoid stale counter drift). Query `MCS_Connection` filtered by status=Accepted and either side matching, count in route handler.

**Process/Workflow:** Connection request/accept is a state transition → could be plain field update (Pending→Accepted) without full workflow; only escalate to iDempiere Workflow if approval chain needed (unlikely for peer connections).

**API:**
```bash
# Count connections for user (fetch then count client-side, or use $top=0 pattern if API supports count header)
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_Connection?$filter=(AD_User_ID eq 1000123 or MCS_ConnectedUser_ID eq 1000123) and MCS_Status eq %27Accepted%27&$select=id' \
--header 'Authorization: Bearer {JWT}'
```

**Next.js:** New `case 'connections':` route. Compute count in the GET handler (`data.length`), do not push count logic into iDempiere.

---

### 4. "Follow Mandal" + notify on new events

**Exists already:** `MCS_Mandals` (mandal), `MCS_Event` (events, presumably FK'd to mandal), `AD_User`.
**Missing:**
- Table: `MCS_SavedMandal` — **already listed as not-yet-created**, reuse as "Follow" table (same shape: user follows/saves a mandal)
  - `AD_User_ID` FK → AD_User
  - `MCS_Mandals_ID` FK → MCS_Mandals
  - `IsActive` for follow/unfollow toggle

**Process/Workflow:** Notification on new event creation → **iDempiere Process** (or DB trigger) `MCS_NotifyMandalFollowers`, fires when `MCS_Event` created with a given `MCS_Mandals_ID`, iterates `MCS_SavedMandal` for that mandal, pushes to notification service (see push-token gap in Q7 — needed dependency).

**API:**
```bash
# Follow
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_SavedMandal' \
--header 'Content-Type: application/json' --header 'Authorization: Bearer {JWT}' \
--data '{
  "AD_User_ID": { "id": 1000123, "identifier": "User", "model-name": "ad_user" },
  "MCS_Mandals_ID": { "id": 1000010, "identifier": "Mandal Name", "model-name": "mcs_mandals" },
  "IsActive": true
}'

# List followed mandals
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_SavedMandal?$filter=AD_User_ID eq 1000123 and IsActive eq true&$expand=MCS_Mandals_ID' \
--header 'Authorization: Bearer {JWT}'
```

**Next.js:** New `case 'followed-mandals':`. Notification dispatch belongs in a process, not the Next.js route — route only reads/writes the follow record.

---

### 5. User activity feed (jobs applied, RSVPs, mandals joined)

**Exists already:** Depends on gaps above — this is an **aggregation view**, not a new storage need.
**Missing (dependencies, not new for this feature itself):**
- `MCS_Application` (jobs applied) — not yet created (see Q2)
- `MCS_Event_RSVP` (events RSVPed) — **already listed as not-yet-created**
- Mandal "joined" — check first: is there already a direct `MCS_Mandals_ID` on `AD_User`? **Yes** — `AD_User.MCS_Mandals_ID` already exists, so "joined" is just that FK, no new table needed for single-mandal membership. If multi-mandal membership is required, that's a new join table `MCS_MandalMember` — flag as ambiguous, ask which.

**Computed value:** Feed itself is an aggregation → **compute in Next.js API route**, fan-out GET calls to `MCS_Application`, `MCS_Event_RSVP`, and `AD_User.MCS_Mandals_ID`, merge + sort by date client-side/route-side. No new iDempiere table for "the feed" itself.

**Process/Workflow:** None — pure read aggregation.

**API:**
```bash
# Jobs applied
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_Application?$filter=AD_User_ID eq 1000123&$expand=MCS_Jobs_ID($select=Name)&$orderby=Created desc' \
--header 'Authorization: Bearer {JWT}'

# Events RSVPed
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_Event_RSVP?$filter=AD_User_ID eq 1000123&$expand=MCS_Event_ID($select=Name,StartDate)&$orderby=Created desc' \
--header 'Authorization: Bearer {JWT}'

# Mandal joined (already exists, direct field)
curl --location 'http://15.207.222.86:8080/api/v1/models/AD_User/1000123?$select=MCS_Mandals_ID' \
--header 'Authorization: Bearer {JWT}'
```

**Next.js:** New `case 'activity-feed':` route that internally calls the three above and merges — no new iDempiere schema for the feed itself, only for the two dependency tables that don't exist yet.

---

## Auth & User Identity

### 6. Link OTP login session to AD_User

**Exists already:** `AD_User.EMail`, `Phone`, `Phone2` already exist for lookup; `DateLastLogin` for session tracking; `MCS_LoginType` already distinguishes login method.
**Missing:** Nothing structurally missing — OTP itself is transient (not persisted), only the resulting session matters.
- If OTP verification needs an audit trail: Table `MCS_OTPLog` (new) — `AD_User_ID` FK, `Phone`, `MCS_OTPCode` (or hash), `MCS_VerifiedAt` Date. Only add if audit/replay-prevention is a real requirement — otherwise handle OTP entirely in Next.js/Firebase and skip iDempiere.

**Process/Workflow:** None in iDempiere. Flow: OTP verified externally (Firebase/Twilio) → look up or create `AD_User` by `Phone` → issue iDempiere JWT via `/api/v1/auth/tokens` using a service-account impersonation pattern, or maintain your own session mapping in Next.js (recommended, since iDempiere REST tokens are user/password based, not OTP-based) → store `AD_User_ID` in your app session.

**API:**
```bash
# Find existing user by phone
curl --location 'http://15.207.222.86:8080/api/v1/models/AD_User?$filter=Phone eq %27+11234567890%27' \
--header 'Authorization: Bearer {JWT}'

# Update last login + login type on verified OTP
curl --location --request PUT 'http://15.207.222.86:8080/api/v1/models/AD_User/1000123' \
--header 'Content-Type: application/json' --header 'Authorization: Bearer {JWT}' \
--data '{ "DateLastLogin": "2026-07-09T10:00:00", "MCS_LoginType": "OTP" }'
```

**Next.js:** Session bridging logic belongs in an auth route (e.g. `src/app/api/auth/...`), not `data/[model]`. Map Next.js session (NextAuth/custom) → `AD_User_ID`, store in JWT/cookie payload.

---

### 7. Store device push notification token

**Exists already:** Nothing on `AD_User` covers device tokens (checked all listed fields — no `PushToken`/`DeviceToken`).
**Missing:**
- Column on `AD_User`: `MCS_PushToken` String(255) — why: FCM/APNs tokens are ~150-200 chars, single active token per device model is simplest
- If multi-device support needed: separate table `MCS_UserDevice` (`AD_User_ID` FK, `MCS_PushToken`, `MCS_DeviceType` List (iOS/Android/Web), `MCS_LastActive` Date) — prefer this over a single column if user logs in on >1 device, which mobile apps commonly do. **Recommend the table**, not the column, given typical multi-device usage.

**Process/Workflow:** None — plain field/row update on login or token-refresh event (FCM tokens rotate).

**API:**
```bash
# Register/update device token
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_UserDevice' \
--header 'Content-Type: application/json' --header 'Authorization: Bearer {JWT}' \
--data '{
  "AD_User_ID": { "id": 1000123, "identifier": "User", "model-name": "ad_user" },
  "MCS_PushToken": "fcm_token_string_here",
  "MCS_DeviceType": "Android"
}'
```

**Next.js:** New `case 'user-devices':` in route switch. Table + column don't exist yet — create in iDempiere first.

---

### 8. Guest user vs full member

**Exists already:** `AD_User.VH_IsGuestUser` — **already exists**, flag directly answers this. No new field needed.
**Missing:** Nothing.

**Process/Workflow:** None.

**API:**
```bash
curl --location 'http://15.207.222.86:8080/api/v1/models/AD_User?$filter=VH_IsGuestUser eq false&$select=Name,EMail,MCS_LoginType' \
--header 'Authorization: Bearer {JWT}'
```

**Next.js:** Existing `case 'profile':` / `case 'community-people':` — add `VH_IsGuestUser` to `$select` if not already mapped; check current field mapping in route.ts before assuming it's missing from the response shape.

---

## Process vs Field Decisions

### 9. Report fraudulent marketplace listing — field or process?

**Decision:** **New table + Process**, not a field on `MCS_MarketPlaces` directly (a listing can be reported by multiple users — one boolean field can't hold that).
**Exists already:** `MCS_MarketPlaces` (listing), `AD_User` (reporter).
**Missing:**
- Table: `MCS_ListingReport` (new)
  - `AD_User_ID` FK → reporter
  - `MCS_MarketPlaces_ID` FK → listing
  - `MCS_Reason` List (Scam/Spam/Inappropriate/Other) or Text
  - `MCS_Status` List (Open/Reviewed/Actioned)

**Process/Workflow:** Yes — **iDempiere Process** `MCS_FlagListing`: on 3rd (or Nth) report, auto-set `MCS_MarketPlaces.IsActive = false` and notify admin. Multi-step admin review after that → **Workflow** if formal sign-off required before permanent removal.

**API:**
```bash
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_ListingReport' \
--header 'Content-Type: application/json' --header 'Authorization: Bearer {JWT}' \
--data '{
  "AD_User_ID": { "id": 1000123, "identifier": "Reporter", "model-name": "ad_user" },
  "MCS_MarketPlaces_ID": { "id": 5050, "identifier": "Listing Title", "model-name": "mcs_marketplaces" },
  "MCS_Reason": "Scam",
  "MCS_Status": "Open"
}'
```

**Next.js:** New `case 'listing-reports':` route.

---

### 10. Housing booking accepted by owner — what happens?

**Exists already:** `MCS_Accommodation_Bookings` (booking request), `MCS_Accommodation_Listings` (owned by a `C_BPartner`/`AD_User`).
**Decision:** **Process**, since acceptance has side effects (status change + notify requester + possibly close listing to further requests).
- Field: `MCS_Accommodation_Bookings.MCS_Status` — check if this column already exists on the table before adding; if present, reuse it (List: Pending/Accepted/Rejected/Cancelled).

**Process/Workflow:** **iDempiere Process** `MCS_AcceptBooking`:
- Params: `Record_ID` (booking id)
- Side effects: set status=Accepted, notify requester (push/email), optionally set listing `IsActive=false` if it's a single-tenant listing, reject other pending bookings for same listing.

**API:**
```bash
curl --location 'http://15.207.222.86:8080/api/v1/processes/mcs_acceptbooking' \
--header 'Content-Type: application/json' --header 'Authorization: Bearer {JWT}' \
--data '{ "Record_ID": 7010 }'
```

**Next.js:** Existing `case 'housing-requests':` — add an action sub-route or POST with `{ action: 'accept' }` that calls the process endpoint rather than a plain PUT.

---

### 11. "Approve Mandal Member" — admin reviews join requests

**Exists already:** `AD_User.MCS_Mandals_ID` (membership FK), `MCS_Mandals`.
**Decision:** **Workflow**, since it's human approval with sign-off, not just a status flip.
**Missing:**
- Table: `MCS_MandalJoinRequest` (new) — needed because a pending request state must exist separately from actual membership (approving flips `AD_User.MCS_Mandals_ID`, but the request itself needs its own row+status+requested-date, can't just be a boolean on AD_User)
  - `AD_User_ID` FK → requester
  - `MCS_Mandals_ID` FK → requested mandal
  - `MCS_Status` List (Pending/Approved/Rejected)

**Process/Workflow:** **iDempiere Workflow** on `MCS_MandalJoinRequest`: submit → pending admin node → approve sets `AD_User.MCS_Mandals_ID` = requested mandal + request status=Approved; reject just sets status=Rejected.

**API:**
```bash
# Submit request
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_MandalJoinRequest' \
--header 'Content-Type: application/json' --header 'Authorization: Bearer {JWT}' \
--data '{
  "AD_User_ID": { "id": 1000123, "identifier": "User", "model-name": "ad_user" },
  "MCS_Mandals_ID": { "id": 1000010, "identifier": "Mandal Name", "model-name": "mcs_mandals" },
  "MCS_Status": "Pending"
}'

# Admin: get pending workflow nodes
curl --location 'http://15.207.222.86:8080/api/v1/workflow' --header 'Authorization: Bearer {JWT}'

# Admin: approve
curl --location --request PUT 'http://15.207.222.86:8080/api/v1/workflow/approve/{nodeId}' \
--header 'Content-Type: application/json' --header 'Authorization: Bearer {JWT}' \
--data '{ "message": "Approved by admin" }'
```

**Next.js:** New `case 'mandal-join-requests':` route.

---

## Mobile-Specific

### 12. Offline Panchang pre-fetch

**Exists already:** `MCS_Panchang` table live, presumably one row per date.
**Missing:** Nothing new in iDempiere — this is a **client-side caching strategy question**, not a schema gap.

**Process/Workflow:** None.

**API:**
```bash
# Pre-fetch current month's Panchang in one call for offline cache
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_Panchang?$filter=Created ge %272026-07-01%27 and Created le %272026-07-31%27&$orderby=Created asc' \
--header 'Authorization: Bearer {JWT}'
```

**Next.js:** Existing `case 'culture':` (or wherever Panchang maps) — add a batch/range fetch mode; mobile app caches response locally (SQLite/AsyncStorage), no new backend work needed.

---

### 13. Mobile profile photo upload

**Exists already:** `AD_Image_ID` mechanism already covers this — FK on likely-existing `AD_User` image field (verify `AD_User` has an image FK; if not present, this is the one gap).
**Missing (only if AD_User lacks an image FK today):**
- Column: `AD_User.AD_Image_ID` — FK → AD_Image — **check first**, standard iDempiere often already has this on AD_User by default; do not add a duplicate

**Process/Workflow:** None — plain PUT.

**API:**
```bash
curl --location --request PUT 'http://15.207.222.86:8080/api/v1/models/AD_User/1000123' \
--header 'Content-Type: application/json' --header 'Authorization: Bearer {JWT}' \
--data '{
  "AD_Image_ID": { "file_name": "profile.jpg", "data": "{base64_encoded_image}" }
}'
```

**Next.js:** Existing `case 'profile':` route — confirm image field already mapped in the PUT handler; if the field mapping is missing from the switch (not the iDempiere column), that's the actual Next.js-side gap, not an iDempiere one.

---

### 14. Location-based mandal suggestions (mobile home)

**Exists already:** `MCS_Mandals` presumably has `C_Location_ID` or `C_City_ID` (verify); `AD_User.C_Location_ID` already exists for the user's location.
**Missing:** If `MCS_Mandals` lacks a location FK, that's the gap:
- Column: `MCS_Mandals.C_Location_ID` FK → C_Location — why: needed to compute proximity

**Computed value:** Distance/"nearby" ranking = **compute in Next.js API route** (haversine on lat/long from `C_Location_ID` chain), do not store distance in iDempiere.

**Process/Workflow:** None.

**API:**
```bash
# Fetch mandals with location expanded for distance calc
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_Mandals?$filter=IsActive eq true&$expand=C_Location_ID($expand=C_City_ID)' \
--header 'Authorization: Bearer {JWT}'

# User's own location for comparison
curl --location 'http://15.207.222.86:8080/api/v1/models/AD_User/1000123?$expand=C_Location_ID' \
--header 'Authorization: Bearer {JWT}'
```

**Next.js:** New logic in existing `case 'mandals':` handler (or dedicated `case 'nearby-mandals':`) to sort by computed distance — no schema change if `C_Location_ID` already present on `MCS_Mandals`.

---

## Data Relationships

### 15. All events a specific mandal is hosting

**Exists already:** Near-certain `MCS_Event` already carries a `MCS_Mandals_ID` FK (standard pattern per this ecosystem — check schema to confirm exact column name). If confirmed, **no gap** — pure filter query.

**Missing:** Nothing, assuming the FK exists as expected.

**Process/Workflow:** None.

**API:**
```bash
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_Event?$filter=MCS_Mandals_ID eq 1000010 and IsActive eq true&$orderby=StartDate asc' \
--header 'Authorization: Bearer {JWT}'
```

**Next.js:** Existing `case 'events':` — add optional `mandalId` query param → maps to `$filter=MCS_Mandals_ID eq {id}` server-side.

---

### 16. Link tiffin provider to owning AD_User

**Exists already:** `MCS_TiffinProvider` table live. Standard pattern across this ecosystem is FK to either `AD_User_ID` (if individual-run) or `C_BPartner_ID` (if run as a business) — check which is already on the table.
**Missing (only if neither FK present):**
- Column: `MCS_TiffinProvider.AD_User_ID` FK → AD_User — why: needed to identify listing owner for edit/delete permission checks

**Process/Workflow:** None.

**API:**
```bash
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_TiffinProvider?$filter=AD_User_ID eq 1000123' \
--header 'Authorization: Bearer {JWT}'
```

**Next.js:** Existing `case 'tiffin':` — confirm owner FK already in `$select`/mapping used for "my listings" screen.

---

### 17. Employer logo on job card

**Exists already:** `C_BPartner.Logo_ID` — **already exists**. `MCS_Jobs.C_BPartner_ID` links job → employer. Chain: `MCS_Jobs.C_BPartner_ID` → `C_BPartner.Logo_ID` → image via `/api/image/[id]`.
**Missing:** Nothing.

**Process/Workflow:** None.

**API:**
```bash
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_Jobs/1000045?$expand=C_BPartner_ID($select=Name,Logo_ID)' \
--header 'Authorization: Bearer {JWT}'
```

**Next.js:** Existing `case 'jobs':` — ensure `$expand=C_BPartner_ID` includes `Logo_ID` in the mapping, then resolve via `/api/image/[id]` route already in place.

---

## API Patterns

### 18. Paginate 500 marketplace listings efficiently

**Exists already:** Standard `$top` + `$skip` (or `pageNo`) pagination already supported by iDempiere REST — default page size 100.
**Missing:** Nothing structural.

**Process/Workflow:** None.

**API:**
```bash
# Page 1 (records 1-50)
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_MarketPlaces?$filter=IsActive eq true&$orderby=Created desc&$top=50&$skip=0' \
--header 'Authorization: Bearer {JWT}'

# Page 2 (records 51-100)
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_MarketPlaces?$filter=IsActive eq true&$orderby=Created desc&$top=50&$skip=50' \
--header 'Authorization: Bearer {JWT}'
```

**Next.js:** Existing `case 'marketplace':` — pass through `page`/`limit` query params to `$top`/`$skip`, return total count if available for UI page controls (check response headers for a count field).

---

### 19. Filter jobs by multiple categories at once

**Exists already:** `MCS_Job_Category` table live, `MCS_Jobs` presumably FK's to it.
**Missing:** Nothing structural — use `in` operator, already supported.

**Process/Workflow:** None.

**API:**
```bash
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_Jobs?$filter=MCS_Job_Category_ID in (1001,1002,1005) and IsActive eq true' \
--header 'Authorization: Bearer {JWT}'
```

**Next.js:** Existing `case 'jobs':` — accept `categories` as comma-separated query param, build `in (...)` filter string server-side (watch for injection — validate ids are numeric before interpolating into `$filter`).

---

### 20. Fetch mandal + upcoming events in one call

**Exists already:** `$expand` with sub-filter/orderby/top already supports this exact pattern.
**Missing:** Nothing structural — depends on `MCS_Event.MCS_Mandals_ID` FK existing (see Q15).

**Process/Workflow:** None.

**API:**
```bash
curl --location 'http://15.207.222.86:8080/api/v1/models/MCS_Mandals/1000010?$expand=MCS_Event($select=Name,StartDate,Location;$filter=StartDate ge %272026-07-09%27;$orderby=StartDate asc;$top=10)' \
--header 'Authorization: Bearer {JWT}'
```

**Next.js:** Existing `case 'mandals':` — add detail-view variant (`/api/data/mandals/{id}`) using `$expand` instead of two separate round-trips.

---

## Summary — New Tables Needed (genuinely missing, cross-referenced against known inventory)

| Table | For Q# | Already flagged as not-yet-created? |
|---|---|---|
| `MCS_SavedJob` | 1 | No — new finding |
| `MCS_Application` | 2, 5 | Yes (listed, scope widened to jobs) |
| `MCS_Connection` | 3 | No — new finding, no prior peer-link concept |
| `MCS_SavedMandal` | 4 | Yes (already listed) |
| `MCS_Event_RSVP` | 5 | Yes (already listed) |
| `MCS_OTPLog` (optional/audit only) | 6 | No — only if audit trail required |
| `MCS_UserDevice` | 7 | No — new finding |
| `MCS_ListingReport` | 9 | No — new finding |
| `MCS_MandalJoinRequest` | 11 | No — new finding |

No new column needed on `AD_User`/`C_BPartner`/etc. beyond what's cited per-question — most identity, image, and location needs already resolve through existing FK chains (`C_BPartner_ID`, `C_Location_ID`, `Logo_ID`, `AD_Image_ID`, `VH_IsGuestUser`).
