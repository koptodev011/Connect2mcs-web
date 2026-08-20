import { NextResponse } from "next/server";
import { fetchModel, fetchModelRecord } from "@/lib/idempiere";
import { Tone } from "@/lib/tokens";
import { formatPrice } from "@/lib/currency";

// Helper to cycle through tones based on index
const tones: Tone[] = ["blue", "brick", "saffron", "green", "gold"];
const getTone = (id: string | number): Tone => {
  const hash = String(id)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return tones[hash % tones.length];
};

// Several backend fields pack multiple values into one string separated by "·".
// e.g. taxi ContactDescription = "Rajesh Kulkarni · Boston, MA · Logan Airport".
const splitDot = (s: any): string[] =>
  typeof s === "string"
    ? s
        .replace(/\u00c2\u00b7/g, "\u00b7")
        .split("\u00b7")
        .map((x) => x.trim())
        .filter(Boolean)
    : [];
const getRecordCountry = (record: any, fallbackText = ""): string => {
  const explicitCountry =
    record.C_Country_ID?.identifier ||
    record.C_Country_ID?.Name ||
    record.Country?.identifier ||
    record.Country ||
    record.MCS_Country;
  if (typeof explicitCountry === "string" && explicitCountry.trim())
    return explicitCountry.trim();

  const text = fallbackText.toLowerCase();
  if (/london|united kingdom|\buk\b/.test(text)) return "United Kingdom";
  if (/new jersey|united states|\busa\b|\bu\.s\./.test(text))
    return "United States";
  if (
    /bengaluru|bangalore|pune|gurgaon|gurugram|mumbai|delhi|india|pmet/.test(
      text,
    )
  )
    return "India";
  return "Worldwide";
};

// System/service accounts that must never surface as real community members.
const SYSTEM_NAMES = new Set([
  "System",
  "SuperUser",
  "Web Service",
  "System (deprecated)",
]);
const isRealUser = (u: any) =>
  u?.Name &&
  u.IsActive !== false &&
  !SYSTEM_NAMES.has(u.Name) &&
  u.VH_IsGuestUser !== true;

const getEstYear = (record: any): number => {
  if (record.MCS_Establishment_Year)
    return Number(record.MCS_Establishment_Year);
  return 1980 + (Number(record.id) % 41);
};

const getMembersCount = (record: any): number => {
  if (record.MCS_MemberCount) return Number(record.MCS_MemberCount);
  if (record.MCS_AboutUs) {
    const match = record.MCS_AboutUs.match(
      /(?:membership of|over|around|has|with)\s+([\d,]+)\+?\s*(?:members|households|families)/i,
    );
    if (match) {
      let val = parseInt(match[1].replace(/,/g, ""), 10);
      if (
        record.MCS_AboutUs.toLowerCase().includes("household") ||
        record.MCS_AboutUs.toLowerCase().includes("famil")
      ) {
        val = val * 4;
      }
      return val;
    }
  }
  return 150 + (Number(record.id) % 850);
};

const getEventsCount = (record: any): number => {
  if (record.mcs_event && Array.isArray(record.mcs_event))
    return record.mcs_event.length;
  if (record.MCS_EventCount) return Number(record.MCS_EventCount);
  return 4 + (Number(record.id) % 10);
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ model: string }> },
) {
  const { model } = await params;
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get("id");
  const searchQuery = searchParams.get("q")?.trim().toLowerCase() || "";
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("top")) || 10, 1),
    50,
  );
  const skipRecords = Math.max(Number(searchParams.get("skip")) || 0, 0);
  const cookieHeader = request.headers.get("cookie") || "";
  const countryCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("mcs_country="));
  const selectedCountry = countryCookie
    ? decodeURIComponent(countryCookie.substring("mcs_country=".length))
    : "All";
  const countryIdCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("mcs_country_id="));
  const selectedCountryId = countryIdCookie
    ? decodeURIComponent(countryIdCookie.substring("mcs_country_id=".length))
    : "";
  const sourcePageSize = selectedCountry === "All" ? pageSize : 100;
  const sourceSkipRecords = selectedCountry === "All" ? skipRecords : 0;

  try {
    let data: any = [];

    switch (model) {
      case "countries": {
        const countryPages = await Promise.all([
          fetchModel("C_Country", undefined, { top: 100, skip: 0 }),
          fetchModel("C_Country", undefined, { top: 100, skip: 100 }),
          fetchModel("C_Country", undefined, { top: 100, skip: 200 }),
        ]);
        data = countryPages
          .flat()
          .filter((record: any) => record.IsActive !== false)
          .map((record: any) => ({
            id: record.id.toString(),
            name: record.Name || "",
            code: record.CountryCode || "",
            alpha3: record.ISOCountryCodeAlpha3 || "",
          }))
          .filter((country: { name: string }) => country.name);
        break;
      }

      case "jobs":
        const featuredOnly = searchParams.get("featured") === "true";
        const rawJobs = await fetchModel(
          "MCS_Jobs",
          featuredOnly ? "MCS_IsFeatured eq true" : undefined,
          {
            top: sourcePageSize,
            skip: sourceSkipRecords,
            orderby: "Updated desc",
          },
        );
        data = rawJobs.map((record: any) => {
          const name = record.Name || "";
          let role, co;
          if (/^company\s*:/i.test(name)) {
            co = name.replace(/^company\s*:\s*/i, "").trim();
            role =
              record.Value && !/^\d+$/.test(record.Value)
                ? record.Value.trim()
                : "Open Position";
          } else {
            role = name;
            co = "";
          }

          let detail = record.DetailInfo || "";
          if (detail.startsWith("'") && detail.endsWith("'"))
            detail = detail.slice(1, -1);

          return {
            id: record.id.toString(),
            role,
            co: co || "Confidential",
            loc: record.Location || "Remote",
            pay: record.GS_SalaryRange || "Not disclosed",
            type:
              record.MCS_JobType?.identifier ||
              (typeof record.MCS_JobType === "string"
                ? record.MCS_JobType
                : "Full-time"),
            exp: record.VH_Experience
              ? `${record.VH_Experience}y`
              : "Any experience",
            posted: record.Created
              ? new Date(record.Created).toLocaleDateString()
              : "Recently",
            tag: record.MCS_Tag || "",
            applicants: record.MCS_ApplicantCount || 0,
            logo: (co || "C").charAt(0).toUpperCase(),
            tone: getTone(record.id),
            cat: record.MCS_Job_Category_ID?.identifier || "Tech",
            desc: record.Description || "",
            detail,
            country: record.C_Country_ID?.identifier || "",
            currency: record.C_Currency_ID?.identifier || "",
            education: record.GS_EducationalQualitifaction?.identifier || "",
            additionalEdu: record.VH_AdditionalEduQual || "",
            applyUrl: record.MCS_ApplyURL || "",
            featured: record.MCS_IsFeatured === true,
          };
        });
        break;

      case "mentorship-categories": {
        const rawCategories = await fetchModel(
          "MCS_Mentorship_Category",
          "IsActive eq true",
          { top: 100 },
        );
        data = rawCategories.map((record: any) => ({
          id: String(record.id),
          name: record.Name || record.Value || "Mentorship",
        }));
        break;
      }

      case "mentors": {
        const [rawMentors, mentorshipRequests] = await Promise.all([
          fetchModel("MCS_Mentor", "IsActive eq true", { top: 100 }),
          fetchModel("MCS_Mentorship_Request", "IsActive eq true", {
            top: 100,
          }),
        ]);
        const mentorUserIds = Array.from(
          new Set(
            rawMentors
              .map((record: any) =>
                Number(record.AD_User_ID?.id || record.AD_User_ID),
              )
              .filter(Boolean),
          ),
        ) as number[];
        const mentorUserCountries = new Map<string, string>();
        await Promise.all(
          mentorUserIds.map(async (userId) => {
            try {
              const user = await fetchModelRecord("AD_User", String(userId));
              mentorUserCountries.set(
                String(userId),
                String(user.C_Country_ID?.id || ""),
              );
            } catch {
              mentorUserCountries.set(String(userId), "");
            }
          }),
        );
        const countryMentors =
          selectedCountry === "All" || !selectedCountryId
            ? rawMentors
            : rawMentors.filter((record: any) => {
                const userId = String(
                  record.AD_User_ID?.id || record.AD_User_ID || "",
                );
                return mentorUserCountries.get(userId) === selectedCountryId;
              });
        data = countryMentors.map((record: any) => {
          const mentorRequests = mentorshipRequests.filter(
            (request: any) =>
              String(request.MCS_Mentor_ID?.id || request.MCS_Mentor_ID) ===
              String(record.id),
          );
          const mentorFeedback = mentorRequests.filter(
            (request: any) =>
              Number(request.MCS_Rating) > 0 ||
              String(request.MCS_Review || "").trim(),
          );
          const connectionCount = mentorRequests.filter((request: any) => {
            const status = request.MCS_Status;
            const code =
              typeof status === "object"
                ? status?.id || status?.identifier
                : status;
            return (
              String(code || "").toUpperCase() === "A" ||
              String(code || "").toLowerCase() === "accepted"
            );
          }).length;
          const mentorRatings = mentorFeedback.filter(
            (request: any) => Number(request.MCS_Rating) > 0,
          );
          const averageRating = mentorRatings.length
            ? mentorRatings.reduce(
                (total: number, request: any) =>
                  total + Number(request.MCS_Rating),
                0,
              ) / mentorRatings.length
            : 0;
          const category =
            record.MCS_Mentorship_Category_ID?.identifier || "Mentorship";
          const industry = record.MCS_Industry || "General";
          const company = record.MCS_CompanyName?.trim();
          const designation = record.MCS_Designation?.trim() || industry;
          const role =
            company &&
            !designation.toLowerCase().includes(company.toLowerCase())
              ? `${designation} · ${company}`
              : designation;
          const languages =
            record.MCS_Languages?.identifier
              ?.replace(/[<>]/g, "")
              .split(",")
              .map((value: string) => value.trim())
              .filter(Boolean) || [];
          const rate = Number(record.MCS_SessionRate || 0);
          const currency = record.C_Currency_ID?.identifier || "";
          return {
            id: String(record.id),
            name: record.Name || "Community mentor",
            role,
            years: Number(record.MCS_YearsExperience || 0),
            city: industry,
            mandal: category,
            topics: Array.from(new Set([category])),
            slots: 0,
            rate: rate > 0 ? `${currency} ${rate}`.trim() : "Free",
            tone: getTone(record.id),
            company: company || "",
            designation,
            description: record.MCS_Bio || record.Description || "",
            languages,
            rating: Number(averageRating.toFixed(1)),
            reviewCount: mentorFeedback.length,
            connectionCount,
          };
        });
        break;
      }

      case "mentor-webinars": {
        const rawWebinars = await fetchModel(
          "MCS_MentorWebinar",
          "IsActive eq true",
          { top: 100, orderby: "MCS_StartDate" },
        );
        data = rawWebinars
          .filter(
            (record: any) =>
              String(
                record.MCS_Status?.id || record.MCS_Status || "",
              ).toUpperCase() === "P",
          )
          .map((record: any) => ({
            id: String(record.id),
            title: record.Name || record.Value || "Mentor webinar",
            description: record.Description || record.Help || "",
            help: record.Help || "",
            mentorId: String(record.MCS_Mentor_ID?.id || ""),
            mentorName: record.MCS_Mentor_ID?.identifier || "MCS Mentor",
            date: record.MCS_StartDate || "",
            time: record.MCS_time || "",
            timeZone: record.MCS_TimeZone || "",
            paid: record.MCS_IsPaid === true,
            price: Number(record.Price || 0),
            currency: record.C_Currency_ID?.identifier || "",
            topic: record.MCS_Topic || "Mentorship",
            status: record.MCS_Status?.identifier || "Upcoming",
            tone: getTone(record.id),
          }));
        break;
      }

      case "mentor-details": {
        if (!recordId)
          return NextResponse.json(
            { error: "Mentor id is required" },
            { status: 400 },
          );
        const record = await fetchModelRecord("MCS_Mentor", recordId);
        let rawWebinars: any[] = [];
        for (const webinarModel of ["MCS_MentorWebinar"]) {
          try {
            rawWebinars = await fetchModel(webinarModel, undefined, {
              top: 100,
            });
            break;
          } catch {
            // Webinar availability differs between iDempiere installations.
          }
        }
        const relationId = (value: any) =>
          String(typeof value === "object" ? value?.id : value || "");
        const rawReviews = await fetchModel(
          "MCS_Mentorship_Request",
          `MCS_Mentor_ID eq ${record.id} and IsActive eq true`,
          { top: 100 },
        );
        const reviews = rawReviews
          .filter(
            (request: any) =>
              Number(request.MCS_Rating) > 0 ||
              String(request.MCS_Review || "").trim(),
          )
          .map((request: any) => ({
            id: String(request.id),
            userName:
              request.AD_User_ID?.identifier ||
              request.Name ||
              "Community member",
            rating: Number(request.MCS_Rating || 0),
            review: String(request.MCS_Review || ""),
            date: request.Updated || request.Created || "",
          }));
        const connectionCount = rawReviews.filter((request: any) => {
          const status = request.MCS_Status;
          const code =
            typeof status === "object"
              ? status?.id || status?.identifier
              : status;
          return (
            String(code || "").toUpperCase() === "A" ||
            String(code || "").toLowerCase() === "accepted"
          );
        }).length;
        const averageRating = reviews.filter((review: any) => review.rating > 0)
          .length
          ? reviews
              .filter((review: any) => review.rating > 0)
              .reduce(
                (total: number, review: any) => total + review.rating,
                0,
              ) / reviews.filter((review: any) => review.rating > 0).length
          : 0;
        const webinars = rawWebinars
          .filter(
            (webinar: any) =>
              String(
                webinar.MCS_Status?.id || webinar.MCS_Status || "",
              ).toUpperCase() === "P",
          )
          .filter((webinar: any) => {
            const linkedMentor =
              webinar.MCS_Mentor_ID || webinar.Mentor_ID || webinar.AD_User_ID;
            return (
              relationId(linkedMentor) === String(record.id) ||
              relationId(linkedMentor) === relationId(record.AD_User_ID)
            );
          })
          .map((webinar: any) => ({
            id: String(webinar.id),
            title:
              webinar.Name ||
              webinar.Title ||
              webinar.Value ||
              "Mentor webinar",
            description: webinar.Description || webinar.MCS_Description || "",
            date:
              webinar.MCS_StartDate ||
              webinar.StartDate ||
              webinar.DateFrom ||
              webinar.Created ||
              "",
            duration: webinar.MCS_Duration || webinar.Duration || "",
            time: webinar.MCS_time || "",
            timeZone: webinar.MCS_TimeZone || "",
            topic: webinar.MCS_Topic || "",
            paid: webinar.MCS_IsPaid === true,
            price: Number(webinar.Price || 0),
            currency: webinar.C_Currency_ID?.identifier || "",
            url: webinar.MCS_WebinarURL || webinar.JoinURL || webinar.URL || "",
            registrationUrl: webinar.URL || "",
            currencyId: String(webinar.C_Currency_ID?.id || ""),
            imageId: String(webinar.AD_Image_ID?.id || ""),
            statusCode: String(
              webinar.MCS_Status?.id || webinar.MCS_Status || "",
            ).toUpperCase(),
            status:
              webinar.MCS_Status?.identifier ||
              webinar.Status ||
              (webinar.IsActive === false ? "Inactive" : "Upcoming"),
          }));
        return NextResponse.json({
          mentor: {
            id: String(record.id),
            name: record.Name || "Community mentor",
            bio: record.MCS_Bio || record.Description || "",
            description: record.Description || "",
            designation: record.MCS_Designation || "",
            company: record.MCS_CompanyName || "",
            industry: record.MCS_Industry || "",
            category:
              record.MCS_Mentorship_Category_ID?.identifier || "Mentorship",
            years: Number(record.MCS_YearsExperience || 0),
            verified: record.MCS_IsVerified === true,
            rate: Number(record.MCS_SessionRate || 0),
            currency: record.C_Currency_ID?.identifier || "",
            languages:
              record.MCS_Languages?.identifier
                ?.replace(/[<>]/g, "")
                .split(",")
                .map((value: string) => value.trim())
                .filter(Boolean) || [],
            user: record.AD_User_ID?.identifier || "",
            created: record.Created || "",
            updated: record.Updated || "",
            rating: Number(averageRating.toFixed(1)),
            reviewCount: reviews.length,
            connectionCount,
          },
          reviews,
          webinars,
        });
      }

      case "mandals":
        if (recordId) {
          const record = await fetchModelRecord(
            "MCS_Mandals",
            recordId,
            "ad_user,mcs_socia_media,mcs_mandal_gallery,mcs_event",
          );
          const allMandalUsers = await fetchModel("AD_User", undefined, {
            top: 100,
          });
          const mandalUsers = allMandalUsers.filter((user: any) => {
            const mandalId =
              typeof user.MCS_Mandals_ID === "object"
                ? user.MCS_Mandals_ID?.id
                : user.MCS_Mandals_ID;
            return String(mandalId) === String(record.id) && isRealUser(user);
          });

          const loc = record.C_Location_ID || {};
          let city = loc.City;
          if (!city && loc.Address1) {
            const segments = loc.Address1.split(",")
              .map((s: string) => s.trim())
              .filter(Boolean);
            city = segments.find(
              (s: string) => !/^\d/.test(s) && !/^PO Box/i.test(s),
            );
          }
          if (!city) city = loc.RegionName || loc.C_Region_ID?.identifier;
          if (!city) city = loc.C_Country_ID?.identifier;
          if (!city) city = "Unknown City";

          const codeMatch = record.Name?.match(/\(([A-Z]{2,6})\)/);
          let code = codeMatch ? codeMatch[1] : null;
          if (!code && loc.C_Region_ID?.identifier)
            code = loc.C_Region_ID.identifier;
          if (!code && record.Name) {
            code = record.Name.split(/\s+/)
              .slice(0, 3)
              .map((w: string) => w[0]?.toUpperCase())
              .join("");
          }
          if (!code) code = "MM";

          const committee = Array.isArray(record.ad_user)
            ? record.ad_user.filter(isRealUser).map((u: any) => ({
                name: u.Name,
                role: u.Description || "Committee Member",
                email: u.EMail || "",
                avatar: u.Name.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase(),
              }))
            : [];

          const mandalDetails = {
            id: record.id.toString(),
            name: record.Name,
            city,
            country: loc.C_Country_ID?.identifier || "Unknown Country",
            est: getEstYear(record),
            members: mandalUsers.length,
            events: getEventsCount(record),
            rating: record.Rating ? parseFloat(record.Rating) : 0,
            dist: "",
            tone: getTone(record.id),
            code,
            hosting: record.MCS_IsHosting || false,
            region: loc.C_Region_ID?.identifier || "",
            nearMe: false,
            badge: record.MCS_Badge || "",
            home: false,
            about: record.MCS_AboutUs || "",
            address: loc.Address1 || "",
            postal: loc.Postal || "",
            email: record.EMail || "",
            image: `/api/mandal-image/${record.id}`,
          };

          const socials = Array.isArray(record.mcs_socia_media)
            ? record.mcs_socia_media.map((s: any) => ({
                id: s.id.toString(),
                name: s.Name || "Social Media",
                url: s.URL || "",
                type: s.MCS_SocialMediaType?.identifier || "Website",
                mandalId: record.id.toString(),
              }))
            : [];

          const gallery = Array.isArray(record.mcs_mandal_gallery)
            ? record.mcs_mandal_gallery.map((g: any) => {
                const imgData = g.AD_Image_ID?.data
                  ? `data:image/jpeg;base64,${g.AD_Image_ID.data}`
                  : undefined;
                const imgUrl =
                  g.ImageUrl || g.imageUrl || imgData || "/mandal_festival.png";
                return {
                  id: g.id?.toString() || "",
                  img: imgUrl,
                  title: g.Name || g.name || "Gallery Item",
                  desc: g.Description || "",
                };
              })
            : [];

          const events = Array.isArray(record.mcs_event)
            ? record.mcs_event.map((e: any) => {
                const dt = e.MCS_StartDate
                  ? new Date(e.MCS_StartDate)
                  : new Date();
                const logoData = e.MCS_Logo_ID?.data;
                const logoId = e.MCS_Logo_ID?.id;
                return {
                  id: e.id.toString(),
                  day: dt.getDate().toString(),
                  month: dt
                    .toLocaleString("en-US", { month: "short" })
                    .toUpperCase(),
                  wk: dt.toLocaleString("en-US", { weekday: "short" }),
                  title: e.Name,
                  where: e.Location || "Online",
                  cat: e.MCS_Event_Category_ID?.identifier || "Meetup",
                  going: e.MCS_RSVPCount || 0,
                  free: e.MCS_IsFree === true,
                  tone: getTone(e.id),
                  image: logoData
                    ? `data:image/jpeg;base64,${logoData}`
                    : logoId
                      ? `/api/image/${logoId}`
                      : undefined,
                  desc: e.Description || "",
                  link: e.MCS_EventRegLink || "",
                  fullDate: e.MCS_StartDate
                    ? new Date(e.MCS_StartDate).toLocaleString()
                    : "",
                  country: e.C_Country_ID?.identifier || "",
                  organizer: e.CreatedBy?.identifier || mandalDetails.name,
                  value: e.Value || "",
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
          fetchModel("MCS_Mandals"),
          fetchModel("AD_User", undefined, { top: 100 }),
        ]);
        data = rawMandals.map((record: any) => {
          const loc = record.C_Location_ID || {};
          let city = loc.City;
          if (!city && loc.Address1) {
            const segments = loc.Address1.split(",")
              .map((s: string) => s.trim())
              .filter(Boolean);
            city = segments.find(
              (s: string) => !/^\d/.test(s) && !/^PO Box/i.test(s),
            );
          }
          if (!city) city = loc.RegionName || loc.C_Region_ID?.identifier;
          if (!city) city = loc.C_Country_ID?.identifier;
          if (!city) city = "Unknown City";

          const codeMatch = record.Name?.match(/\(([A-Z]{2,6})\)/);
          let code = codeMatch ? codeMatch[1] : null;
          if (!code && loc.C_Region_ID?.identifier)
            code = loc.C_Region_ID.identifier;
          if (!code && record.Name) {
            code = record.Name.split(/\s+/)
              .slice(0, 3)
              .map((w: string) => w[0]?.toUpperCase())
              .join("");
          }
          if (!code) code = "MM";

          return {
            id: record.id.toString(),
            name: record.Name,
            city,
            country: loc.C_Country_ID?.identifier || "Unknown Country",
            est: getEstYear(record),
            members: allMandalUsers.filter((user: any) => {
              const mandalId =
                typeof user.MCS_Mandals_ID === "object"
                  ? user.MCS_Mandals_ID?.id
                  : user.MCS_Mandals_ID;
              return String(mandalId) === String(record.id) && isRealUser(user);
            }).length,
            events: getEventsCount(record),
            rating: record.Rating ? parseFloat(record.Rating) : 0,
            dist: "", // computed locally typically
            tone: getTone(record.id),
            code,
            hosting: record.MCS_IsHosting || false,
            region: loc.C_Region_ID?.identifier || "",
            nearMe: false,
            badge: record.MCS_Badge || "",
            home: false,
            about: record.MCS_AboutUs || "",
            address: loc.Address1 || "",
            postal: loc.Postal || "",
            email: record.EMail || "",
            image: `/api/mandal-image/${record.id}`,
          };
        });
        break;

      case "businesses":
        const rawBusinesses = await fetchModel("MCS_Businesses");
        data = rawBusinesses
          .filter((record: any) => record.IsActive !== false)
          .map((record: any) => ({
            id: String(record.id),
            name: record.Name || "",
            owner:
              record.AD_User_ID?.identifier ||
              record.CreatedBy?.identifier ||
              record.Name,
            ownerId: String(
              record.AD_User_ID?.id || record.CreatedBy?.id || "",
            ),
            cat: record.MCS_Business_Category_ID?.identifier || "Services",
            categoryId: String(record.MCS_Business_Category_ID?.id || ""),
            city: record.C_City_ID?.identifier || "Online",
            cityId: String(record.C_City_ID?.id || ""),
            countryId: String(record.C_Country_ID?.id || ""),
            desc: record.Description || "",
            help: record.Help || "",
            country: record.C_Country_ID?.identifier || "",
            services: record.MCS_Services
              ? record.MCS_Services.split(",")
                  .map((service: string) => service.trim())
                  .filter(Boolean)
              : [],
            rating: record.Rating ? parseFloat(record.Rating) : 4.8,
            reviews: record.MCS_ReviewCount || 0,
            years: record.VH_YearsInBusiness || 1,
            tone: getTone(record.id),
            mandal: record.MCS_Mandals_ID?.identifier || "",
            verified: record.IsVerified === true,
            phone: record.Phone || "",
            website: record.MCS_siteUrl || "",
          }));
        break;

      case "events":
        const rawEvents = await fetchModel("MCS_Event");
        data = rawEvents.map((record: any) => {
          const dt = record.MCS_StartDate
            ? new Date(record.MCS_StartDate)
            : new Date();
          const logoData = record.MCS_Logo_ID?.data;
          const logoId = record.MCS_Logo_ID?.id;
          return {
            id: record.id.toString(),
            day: dt.getDate().toString(),
            month: dt.toLocaleString("en-US", { month: "short" }).toUpperCase(),
            wk: dt.toLocaleString("en-US", { weekday: "short" }),
            title: record.Name,
            where: record.Location || "Online",
            cat: record.MCS_Event_Category_ID?.identifier || "Meetup",
            going: record.MCS_RSVPCount || 0,
            free: record.MCS_IsFree === true,
            tone: getTone(record.id),
            image: logoData
              ? `data:image/jpeg;base64,${logoData}`
              : logoId
                ? `/api/image/${logoId}`
                : undefined,
            desc: record.Description || "",
            link: record.MCS_EventRegLink || "",
            fullDate: record.MCS_StartDate
              ? new Date(record.MCS_StartDate).toLocaleString()
              : "",
            country: record.C_Country_ID?.identifier || "",
            organizer: record.CreatedBy?.identifier || "MCS",
            value: record.Value || "",
          };
        });
        break;

      case "scholarships":
        const rawScholarships = await fetchModel("MCS_Scholarship");
        data = rawScholarships.map((record: any) => ({
          id: record.id.toString(),
          title: record.MCS_FIeld
            ? `Scholarship in ${record.MCS_FIeld}`
            : "General Scholarship",
          org: record.AD_Client_ID?.identifier || "MCS Foundation",
          amount: record.Amount ? `$${record.Amount}` : "Varies",
          field: record.MCS_FIeld || "General",
          deadline: record.MCS_Deadline
            ? new Date(record.MCS_Deadline).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Rolling",
          eligible: true,
          criteria: record.MCS_EligibilityCriteria || "",
          applyUrl: record.MCS_ApplyURL || "",
          tone: getTone(record.id),
          country: getRecordCountry(
            record,
            record.MCS_EligibilityCriteria || record.MCS_FIeld || "",
          ),
        }));
        break;

      case "internships":
        const rawInternships = await fetchModel("MCS_Internship");
        data = rawInternships.map((record: any) => {
          // MCS_EligibilityCriteria packs "Role at Company · Location · Mode"
          const parts = splitDot(record.MCS_EligibilityCriteria);
          const roleCo = parts[0] || "";
          const [role, co] = roleCo.includes(" at ")
            ? roleCo.split(" at ").map((x) => x.trim())
            : [roleCo, record.AD_Client_ID?.identifier || "Company"];
          return {
            id: record.id.toString(),
            role: role || `Internship (${record.Duration || "General"})`,
            co: co || "Company",
            loc: parts[1] || "Remote",
            mode: parts[2] || "",
            stipend: record.MCS_Stipend ? `$${record.MCS_Stipend}` : "Unpaid",
            dur: record.Duration ? `${record.Duration} months` : "3 months",
            when: record.StartDate
              ? new Date(record.StartDate).toLocaleDateString()
              : "Summer",
            criteria: record.MCS_EligibilityCriteria || "",
            applyUrl: record.MCS_ApplyURL || "",
            logo: (co || "C").charAt(0),
            tone: getTone(record.id),
            country: getRecordCountry(
              record,
              [record.MCS_EligibilityCriteria, parts[1], co]
                .filter(Boolean)
                .join(" "),
            ),
          };
        });
        break;

      case "maids": {
        const rawBookings = await fetchModel("MCS_Maid_Booking", undefined, {
          top: pageSize,
          skip: skipRecords,
          orderby: "Updated desc",
        });

        const mapMaid = (record: any) => {
          const category =
            record.MCS_Maid_Category?.identifier || "Maid Service";
          const serviceText =
            typeof record.MCS_Services === "object"
              ? record.MCS_Services?.identifier || record.MCS_Services?.id || ""
              : record.MCS_Services || "";
          const services = String(serviceText)
            .replace(/[<>]/g, "")
            .split(",")
            .map((service: string) => service.trim())
            .filter(Boolean);
          const experienceYears = Number(record.MCS_ExperienceYears);
          const currency = record.C_Currency_ID?.identifier || "";
          const languageText =
            record.MCS_Languages?.identifier || record.MCS_Languages?.id || "";
          const languages = String(languageText)
            .replace(/[<>]/g, "")
            .split(",")
            .map((language: string) => language.trim())
            .filter(Boolean);
          const rateSuffix = /hour/i.test(category) ? "/hr" : "";
          const maidBookings = rawBookings.filter((booking: any) => {
            const maidId =
              typeof booking.MCS_Maid_ID === "object"
                ? booking.MCS_Maid_ID?.id
                : booking.MCS_Maid_ID;
            return (
              String(maidId) === String(record.id) && booking.IsActive !== false
            );
          });
          const acceptedBookingCount = maidBookings.filter((booking: any) => {
            const status =
              typeof booking.MCS_Status === "object"
                ? booking.MCS_Status?.id || booking.MCS_Status?.identifier
                : booking.MCS_Status;
            const normalizedStatus = String(status || "").toUpperCase();
            return normalizedStatus === "A" || normalizedStatus === "ACCEPTED";
          }).length;
          const bookingRatings = maidBookings
            .map((booking: any) => Number(booking.MCS_Rating))
            .filter((rating: number) => Number.isFinite(rating) && rating > 0);
          const rating =
            bookingRatings.length > 0
              ? bookingRatings.reduce(
                  (sum: number, value: number) => sum + value,
                  0,
                ) / bookingRatings.length
              : 0;
          const bookingReviews = maidBookings
            .filter((booking: any) => {
              const status =
                typeof booking.MCS_Status === "object"
                  ? booking.MCS_Status?.id || booking.MCS_Status?.identifier
                  : booking.MCS_Status;
              const normalizedStatus = String(status || "").toUpperCase();
              return (
                (normalizedStatus === "A" || normalizedStatus === "ACCEPTED") &&
                Number(booking.MCS_Rating) > 0
              );
            })
            .map((booking: any) => ({
              name:
                booking.AD_User_ID?.identifier ||
                booking.Name ||
                "Community Member",
              rating: Number(booking.MCS_Rating),
              text: String(booking.MCS_Review || "").trim(),
              date: String(booking.Updated || booking.Created || "").slice(
                0,
                10,
              ),
            }));

          return {
            id: record.id.toString(),
            name:
              record.Name ||
              record.AD_User_ID?.identifier ||
              "Community Helper",
            avatar: (record.Name || "M").charAt(0).toUpperCase(),
            verified:
              Boolean(record.C_BPartner_ID) && record.IsActive !== false,
            services: services.length > 0 ? services.join(", ") : category,
            rating: Number(rating.toFixed(1)),
            reviewCount: bookingRatings.length,
            experience: Number.isFinite(experienceYears)
              ? `${experienceYears} yrs exp`
              : "Experience on request",
            jobs: `${acceptedBookingCount} ${acceptedBookingCount === 1 ? "job" : "jobs"}`,
            location:
              record.Address?.trim() ||
              record.C_BPartner_ID?.identifier ||
              "Address on request",
            price:
              record.MCS_Rate != null
                ? `${currency ? `${currency} ` : ""}${record.MCS_Rate}${rateSuffix}`
                : "Contact for rate",
            languages:
              languages.length > 0 ? languages : ["Contact for languages"],
            about: record.MCS_About || "",
            skills: services.length > 0 ? services : [category],
            workingHours: /hour/i.test(category)
              ? "Hourly availability"
              : "Contact for availability",
            days: "Contact for availability",
            startDate:
              record.IsActive === false ? "Unavailable" : "Available now",
            reviews: bookingReviews,
            tag: category,
            phone: record.Phone || "",
          };
        };

        if (recordId) {
          const maid = await fetchModelRecord("MCS_Maid", recordId);
          data = mapMaid(maid);
        } else {
          const rawMaids = await fetchModel("MCS_Maid", undefined, {
            top: 100,
            orderby: "Updated desc",
          });
          data = rawMaids
            .filter((record: any) => record.IsActive !== false)
            .map(mapMaid);
        }
        break;
      }
      case "tiffin":
        const rawTiffin = await fetchModel("MCS_TiffinProvider");
        data = rawTiffin.map((record: any) => {
          // No name/city field in the backend — build a clean identity from the
          // provider's signature (first) dish instead of a truncated menu string.
          const dishes =
            typeof record.MCS_Menu === "string"
              ? record.MCS_Menu.split(",")
                  .map((d: string) => d.trim())
                  .filter(Boolean)
              : [];
          const signature = dishes[0];
          return {
            id: record.id.toString(),
            name: signature
              ? `${signature} Home Kitchen`
              : `Home Tiffin #${record.id}`,
            city: "Various",
            specialty: signature || "Home Food",
            per: record.MCS_PricePerMeal
              ? `$${record.MCS_PricePerMeal}/meal`
              : "Varies",
            perMeal: record.MCS_PricePerMeal
              ? `$${record.MCS_PricePerMeal}`
              : "-",
            perMonth: record.MCS_PricePerMonth
              ? `$${record.MCS_PricePerMonth}`
              : "-",
            delivery: "Pickup only",
            menu: record.MCS_Menu
              ? record.MCS_Menu.split(",")
              : ["Daily Thali"],
            rating: record.Rating ? parseFloat(record.Rating) : 4.5,
            orders: record.MCS_OrderCount || 0,
            mandal: "-",
            tone: getTone(record.id),
            veg: record.MCS_IsVeg || false,
            trial: record.MCS_HasTrial || false,
            days: "Mon-Fri",
            since: "2023",
            note: "",
          };
        });
        break;

      case "taxi":
        const rawTaxi = await fetchModel("MCS_TaxiDriver");
        data = rawTaxi
          .filter((record: any) => {
            if (selectedCountry === "All") return true;
            const recordCountryId = String(record.C_Country_ID?.id || "");
            const recordCountry = getRecordCountry(
              record,
              record.ContactDescription || "",
            );
            return selectedCountryId
              ? !recordCountryId || recordCountryId === selectedCountryId
              : recordCountry === "Worldwide" ||
                  recordCountry.toLowerCase() === selectedCountry.toLowerCase();
          })
          .map((record: any) => {
            // ContactDescription packs "Name · City · Service areas"
            const parts = splitDot(record.ContactDescription);
            return {
              id: record.id.toString(),
              name: parts[0] || `Driver #${record.id}`,
              city:
                record.C_City_ID?.identifier ||
                record.City ||
                parts[1] ||
                "City",
              country: getRecordCountry(
                record,
                record.ContactDescription || "",
              ),
              areas: parts[2] || "Metro Area",
              vehicle: record.MCS_Vehicle || "Sedan",
              type: record.MCS_VehicleType || "Standard",
              langs: record.MCS_Languages
                ? record.MCS_Languages.split(",").map((lang: string) =>
                    lang.trim(),
                  )
                : ["Marathi", "English"],
              rate: record.Rate ? `$${record.Rate}/mi` : "Standard",
              base: record.MCS_BaseFare ? `$${record.MCS_BaseFare}` : "-",
              rating: record.Rating ? parseFloat(record.Rating) : 4.8,
              trips: record.Counter || 0,
              available: record.IsAvailable !== false,
              mandal: "-",
              tone: getTone(record.id),
              since: "2022",
              note: "",
            };
          });
        break;

      case "housing": {
        const rawHousing = await fetchModel("MCS_Accommodation", undefined, {
          top: pageSize,
          skip: skipRecords,
          orderby: "Updated desc",
        });
        data = rawHousing
          .filter(
            (record: any) =>
              record.IsActive !== false &&
              record.SP_Listing_Status?.identifier !== "Inactive",
          )
          .map((record: any) => {
            const accommodationType =
              record.SP_Accommodation_Type?.identifier || "Accommodation";
            const area = record.SP_Area || "";
            const city = record.City || "";
            const country = record.C_Country_ID?.identifier || "";
            const location =
              [area, city, country].filter(Boolean).join(", ") ||
              "Location unavailable";
            const currency = record.C_Currency_ID?.identifier || "";
            const rentPeriod =
              record.SP_Rent_Period?.identifier ||
              (typeof record.SP_Rent_Period === "string"
                ? record.SP_Rent_Period
                : "");
            const periodSuffix = /^monthly$/i.test(rentPeriod)
              ? "/mo"
              : /^weekly$/i.test(rentPeriod)
                ? "/wk"
                : /^daily$/i.test(rentPeriod)
                  ? "/day"
                  : rentPeriod
                    ? `/${rentPeriod}`
                    : "";

            return {
              id: record.id.toString(),
              title: `${accommodationType} in ${area || city || country || "available location"}`,
              city: location,
              rent:
                record.SP_Rent_Amount != null
                  ? `${currency ? `${currency} ` : ""}${record.SP_Rent_Amount}${periodSuffix}`
                  : "Contact for rent",
              type: accommodationType,
              gender: record.SP_Gender_Preference?.identifier || "Anyone",
              size: record.SP_Max_Occupants
                ? `${record.SP_Max_Occupants} Person(s)`
                : "Shared",
              host: record.Posted_By_User_ID?.identifier || "Community Member",
              stay: record.SP_Available_Until ? "Short stay" : "Long-term",
              tone: getTone(record.id),
              nearMe: false,
              student: /student|pg|paying guest/i.test(accommodationType),
              description: record.SP_Additional_Info || "",
              availableFrom: record.SP_Available_From || "",
              availableUntil: record.SP_Available_Until || "",
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
      case "offers":
        const rawOffers = await fetchModel("MCS_Offers");
        data = rawOffers.map((record: any) => ({
          id: record.id.toString(),
          partner: record.C_BPartner_ID?.identifier || "Partner",
          cat: record.MCS_Offers_Category_ID?.identifier || "Discount",
          title: record.Name,
          desc: "",
          code: record.MCS_PromoCode || "MCS50",
          expires: record.ValidTo
            ? new Date(record.ValidTo).toLocaleDateString()
            : "No expiry",
          tone: getTone(record.id),
          kind: "ornament",
          savings: record.MCS_Savings || "-",
          claimed: record.MCS_ClaimedCount || 0,
          new: record.MCS_IsNew || false,
        }));
        break;

      case "culture":
        // Return panchang; arti is mock data for now
        const rawPanchang = await fetchModel("MCS_Panchang");
        data = rawPanchang.map((record: any) => ({
          id: record.id.toString(),
          tithi: record.MCS_TithiTitle || "Tithi",
          day: record.MCS_DevanagariDay || "१",
          sunrise: record.MCS_Sunrise || "06:00",
          sunset: record.MCS_Sunset || "18:00",
          nakshatra: record.MCS_Nakshatra || "Nakshatra",
          yoga: record.MCS_Yoga || "Yoga",
          rashi: record.MCS_Rashi || "Rashi",
          date: record.Date1 || new Date().toISOString(),
        }));
        break;

      case "community-people":
        const rawPeople = await fetchModel("AD_User");
        data = rawPeople.filter(isRealUser).map((record: any) => ({
          name: record.Name,
          role: record.MCS_Role || "Member",
          city: record.C_Location_ID?.identifier || "Unknown City",
          mandal: record.MCS_Mandals_ID?.identifier || "General Mandal",
          open: record.MCS_Open || "Networking",
          conn: "",
        }));
        break;

      case "profile":
        const rawProfile = await fetchModel("AD_User");
        const reqUser = searchParams.get("username");
        let user = null;
        if (reqUser) {
          user = rawProfile.find(
            (u: any) =>
              u.Name?.toLowerCase() === reqUser.toLowerCase() ||
              u.EMail?.toLowerCase() === reqUser.toLowerCase(),
          );
        }
        if (!user && !reqUser) {
          user = rawProfile.find(isRealUser) || null;
        }
        if (user) {
          data = [
            {
              id: user.id,
              name: user.Name,
              marathi: user.MCS_MarathiName || user.Name,
              role: user.MCS_Role || "Member",
              city:
                user.C_City_ID?.identifier ||
                user.C_Location_ID?.identifier ||
                "Unknown City",
              cityId:
                user.C_City_ID?.id != null ? String(user.C_City_ID.id) : "",
              country: user.C_Country_ID?.identifier || "",
              countryId:
                user.C_Country_ID?.id != null
                  ? String(user.C_Country_ID.id)
                  : "",
              origin: user.MCS_OriginalyFrom_ID?.identifier || "Maharashtra",
              type:
                typeof user.MCS_LoginType === "object"
                  ? user.MCS_LoginType?.identifier ||
                    user.MCS_LoginType?.id ||
                    "Standard"
                  : user.MCS_LoginType || "Standard",
              loginTypeId:
                typeof user.MCS_LoginType === "object"
                  ? String(user.MCS_LoginType?.id || "")
                  : String(user.MCS_LoginType || ""),
              mandal: user.MCS_Mandals_ID?.identifier || "Unknown Mandal",
              joined: user.Created
                ? new Date(user.Created).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })
                : "Recently",
              bio: user.Description || "Active community member.",
              langs: user.MCS_Languages
                ? user.MCS_Languages.split(",")
                : ["Marathi", "English"],
              open: user.MCS_Open ? user.MCS_Open.split(",") : ["Networking"],
              email: user.EMail || "",
              phone: user.Phone || user.Phone2 || "",
            },
          ];
        }
        break;

      case "artis":
        const rawArtis = await fetchModel("MCS_Aarati");
        data = rawArtis.map((record: any) => {
          const logoData = record.AD_Image_ID?.data;
          const logoId = record.AD_Image_ID?.id;
          return {
            id: Number(record.id),
            title: record.Name || "Aarti",
            deity: record.MCS_Aarati_Category_ID?.identifier || "Deity",
            duration: record.MCS_Duration || "2:00",
            tone: getTone(record.id),
            popular: record.MCS_IsPopular || false,
            image: logoId
              ? `/api/image/${logoId}`
              : logoData
                ? `data:image/jpeg;base64,${logoData}`
                : "/assets/arti-list-logo.png",
            audio:
              record.MCS_AudioURL ||
              record.AudioURL ||
              "/assets/dummy-aarti.wav",
            lyrics: record.Help || "",
          };
        });
        break;

      case "calendar-months": {
        const rawMonths = await fetchModel(
          "MCS_MarathiCalendarMonths",
          "IsActive eq true",
          { top: 100 },
        );
        // Backend stores Gregorian month names duplicated across two calendars
        // (कालनिर्णय / महालक्ष्मी); MCS_DevanagariName actually holds the calendar
        // name, not the month. Prefer a single calendar so months aren't doubled.
        const monthDev: Record<string, string> = {
          January: "जानेवारी",
          February: "फेब्रुवारी",
          March: "मार्च",
          April: "एप्रिल",
          May: "मे",
          June: "जून",
          July: "जुलै",
          August: "ऑगस्ट",
          September: "सप्टेंबर",
          October: "ऑक्टोबर",
          November: "नोव्हेंबर",
          December: "डिसेंबर",
        };
        const monthOrder = Object.keys(monthDev);
        const calName = (r: any) => {
          const c = r.MCS_MarathiCalendar_ID;
          return (typeof c === "object" ? c?.identifier : c) || "";
        };
        const primary = rawMonths.filter((r: any) =>
          calName(r).includes("कालनिर्णय"),
        );
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
          const ai = monthOrder.indexOf(a.Value),
            bi = monthOrder.indexOf(b.Value);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
        const currentMonthName = monthOrder[new Date().getMonth()];
        data = source.map((record: any) => {
          const logoData = record.Logo_ID?.data;
          const logoId = record.Logo_ID?.id;
          return {
            name: record.Value,
            dev:
              monthDev[record.Value] ||
              record.MCS_DevanagariName ||
              record.Value,
            tone: getTone(record.id),
            days: record.MCS_DayCount || 30,
            current: record.Value === currentMonthName,
            image: logoData
              ? `data:image/jpeg;base64,${logoData}`
              : logoId
                ? `/api/image/${logoId}`
                : undefined,
          };
        });
        break;
      }

      case "newspapers":
        const rawPapers = await fetchModel("MCS_News");

        data = rawPapers.map((record: any) => {
          const logoData = record.Logo_ID?.data;
          const logoId = record.Logo_ID?.id;
          return {
            id: record.id.toString(),
            name: record.Name || "Paper",
            dev: record.MCS_DevanagariName || record.Name,
            est: record.MCS_Establishment_Year || 1900,
            city: record.MCS_CityOfPublication || "Maharashtra",
            desc: record.Description || "Marathi daily newspaper.",
            url: record.URL || "#",
            readers: record.MCS_Total_NewsReaders || "100K",
            tone: getTone(record.id),
            image: logoData
              ? `data:image/jpeg;base64,${logoData}`
              : logoId
                ? `/api/image/${logoId}`
                : undefined,
          };
        });
        if (searchQuery) {
          data = data.filter((paper: any) =>
            [paper.name, paper.dev, paper.desc, paper.city].some((value) =>
              String(value || "")
                .toLowerCase()
                .includes(searchQuery),
            ),
          );
        }
        data = data.slice(skipRecords, skipRecords + pageSize);
        break;

      case "marketplace":
        const rawMarket = await fetchModel("MCS_MarketPlaces");
        const conditionLabels: Record<string, string> = {
          N: "New",
          LN: "Like new",
          G: "Good",
          U: "Used",
        };
        data = rawMarket.map((record: any) => {
          // Description packs "Condition · $Price" e.g. "Like new · $480"
          const parts = splitDot(record.Description);
          const priceStr = parts.find((p) => p.includes("$"));
          const conditionStr = parts.find((p) => !p.includes("$"));
          const logo = record.MCS_Logo_ID;
          const logoData = logo?.data;
          const logoId = logo?.id;
          const condRaw = record.MCS_Condition;
          const condCode =
            typeof condRaw === "string" ? condRaw : condRaw?.id || "";
          const condLabelInline =
            typeof condRaw === "object" && condRaw
              ? String(condRaw.identifier || "")
              : "";
          const condition =
            conditionLabels[condCode] ||
            condLabelInline ||
            (typeof condRaw === "string" ? condRaw : "") ||
            conditionStr ||
            "Used";
          const currencyIso = record.C_Currency_ID?.identifier || "";
          return {
            id: record.id.toString(),
            title: record.Name,
            price: record.Price
              ? formatPrice(record.Price, currencyIso)
              : priceStr || "—",
            currency: currencyIso,
            condition,
            city: record.Location || "City",
            desc: record.Description || "",
            image: logoId
              ? `/api/image/${logoId}`
              : logoData
                ? `data:image/svg+xml;base64,${logoData}`
                : undefined,
            seller:
              record.MCS_PostedBy_ID?.identifier ||
              record.CreatedBy?.identifier ||
              "User",
            cat: record.MCS_MarketPlace_Category_ID?.identifier || "General",
            when: record.MCS_StartDate
              ? new Date(record.MCS_StartDate).toLocaleDateString()
              : "Recently",
            createdAt: record.MCS_StartDate || "",
            tone: getTone(record.id),
            kind: "ornament",
            mandal: record.MCS_Mandals_ID?.identifier || "-",
            sold: record.IsSold || false,
            qty: Number(record.MCS_QTY || 0) || 1,
            featured: record.MCS_IsFeatured || false,
            ownerId: record.MCS_PostedBy_ID?.id ?? null,
            status:
              typeof record.MCS_Status === "string"
                ? record.MCS_Status
                : record.MCS_Status?.id || "PB",
            soldDate: record.MCS_SoldDate || "",
            currencyId: record.C_Currency_ID?.id ?? null,
            categoryId: record.MCS_MarketPlace_Category_ID?.id ?? null,
            cityId: record.C_City_ID?.id ?? null,
            countryId: record.C_Country_ID?.id ?? null,
            adType:
              (typeof record.MCS_AdType === "string"
                ? record.MCS_AdType
                : record.MCS_AdType?.id) === "B"
                ? "Business"
                : "Personal",
          };
        });
        break;

      case "housing-requests": {
        const rawReqs = await fetchModel(
          "MCS_Accommodation_Requirements",
          undefined,
          {
            top: pageSize,
            skip: skipRecords,
            orderby: "Updated desc",
          },
        );
        data = rawReqs
          .filter((record: any) => record.IsActive !== false)
          .map((record: any) => {
            const currency = record.C_Currency_ID?.identifier || "";
            const location = [
              record.SP_Area,
              record.City,
              record.C_Country_ID?.identifier,
            ]
              .filter(Boolean)
              .join(", ");

            return {
              name: record.Posted_By_User_ID?.identifier || "Community Member",
              looking:
                location || record.SP_Accommodation_Type?.identifier || "Place",
              budget: record.SP_Rent_Amount
                ? `${currency ? `${currency} ` : ""}${record.SP_Rent_Amount}`
                : "Flexible",
              when: record.SP_Available_From
                ? new Date(record.SP_Available_From).toLocaleDateString()
                : "Flexible",
              note: record.SP_Additional_Info || "",
              tone: getTone(record.id),
            };
          });
        break;
      }
      case "embassy": {
        const mapEmbassy = (record: any) => ({
          id: record.id.toString(),
          type: /consulate/i.test(record.Name || "") ? "CONSULATE" : "EMBASSY",
          status: record.IsActive === false ? "Closed" : "Open",
          name: record.Name || "Embassy",
          location:
            record.Address ||
            record.C_Country_ID?.identifier ||
            "Address unavailable",
          hours: "Contact mission for hours",
          distance: record.C_Country_ID?.identifier || "",
          telephone: record.Phone || record.MCS_EmergencyPhone || "",
          email: record.EMail || "",
          website: record.URL || "",
          address: record.Address || "",
          jurisdiction: record.Help || record.Description || "",
          services:
            typeof record.MCS_Services === "string"
              ? record.MCS_Services.split(",")
                  .map((service: string) => service.trim())
                  .filter(Boolean)
              : [],
          emergencyPhone: record.MCS_EmergencyPhone || "",
          country: record.C_Country_ID?.identifier || "",
          updated: record.Updated || "",
          schedule: {
            submission: "Contact mission",
            collection: "Contact mission",
            weekend: "Contact mission",
            holidays: "As per mission calendar",
          },
        });

        if (recordId) {
          const embassy = await fetchModelRecord("MCS_Embassy", recordId);
          data = mapEmbassy(embassy);
        } else {
          const rawEmbassies = await fetchModel("MCS_Embassy", undefined, {
            top: sourcePageSize,
            skip: sourceSkipRecords,
            orderby: "Updated desc",
          });
          data = rawEmbassies.map(mapEmbassy);
        }
        break;
      }
      case "emergency-contacts": {
        const rawContacts = await fetchModel(
          "MCS_EmergencyContact",
          undefined,
          {
            top: 10,
            orderby: "Updated desc",
          },
        );
        data = rawContacts
          .filter((record: any) => record.IsActive !== false)
          .map((record: any) => {
            const category = record.MCS_Category?.identifier || "Emergency";
            const color = /police|emergency/i.test(category)
              ? "#8C3123"
              : /medical|ambulance|health/i.test(category)
                ? "#2E7D32"
                : "#284E9C";

            return {
              id: record.id.toString(),
              title: record.Name || "Emergency Contact",
              subtitle: record.Description || record.Help || category,
              phone: record.Phone || "",
              color,
              isLink: false,
              email: record.EMail || "",
              category,
              country: record.C_Country_ID?.identifier || "",
              is24Hours: record.MCS_Is24Hours === true,
            };
          });
        break;
      }
      case "help-topics":
        const rawTopics = await fetchModel("MCS_HelpTopic");
        data = rawTopics.map((record: any) => ({
          id: record.id.toString(),
          value: record.Value,
          title: record.Name,
          desc: record.Description || "",
        }));
        break;

      case "faqs":
        const rawFaqs = await fetchModel("MCS_FAQ");
        data = rawFaqs.map((record: any) => ({
          id: record.id.toString(),
          q: record.MCS_Question || "Question",
          a: record.Answer || "Answer",
          topic: record.MCS_HelpTopic_ID?.identifier || "General",
        }));
        break;

      case "social-media":
        // 107 rows: social links tied to a mandal (Facebook/Instagram/etc.)
        const rawSocial = await fetchModel("MCS_Socia_Media");
        data = rawSocial
          .filter((r: any) => r.URL)
          .map((record: any) => ({
            id: record.id.toString(),
            name: record.Name || "Link",
            url: record.URL,
            type: record.MCS_SocialMediaType?.identifier || "Link",
            mandal: record.MCS_Mandals_ID?.identifier || "",
            mandalId:
              (typeof record.MCS_Mandals_ID === "object"
                ? record.MCS_Mandals_ID?.id
                : record.MCS_Mandals_ID
              )?.toString() || "",
            tone: getTone(record.id),
          }));
        break;

      case "news-categories": {
        const rawCategories = await fetchModel("MCS_News_Category", undefined, {
          top: 100,
          orderby: "Name asc",
        });
        data = rawCategories
          .filter((record: any) => record.IsActive !== false)
          .map((record: any) => ({
            id: String(record.id),
            name: record.Name || record.Value || "",
          }))
          .filter((category: { name: string }) => category.name);
        break;
      }
      case "news": {
        const rawNews = await fetchModel("MCS_News", "MCS_NewsType eq 'A'", {
          top: pageSize,
          skip: skipRecords,
          orderby: "Updated desc",
        });
        data = rawNews
          .filter((record: any) => {
            const newsType =
              typeof record.MCS_NewsType === "object"
                ? (record.MCS_NewsType?.id ??
                  record.MCS_NewsType?.identifier ??
                  record.MCS_NewsType?.value ??
                  record.MCS_NewsType?.Value)
                : record.MCS_NewsType;
            const normalizedNewsType = String(newsType || "").toUpperCase();
            return (
              record.IsActive !== false &&
              (normalizedNewsType === "A" || normalizedNewsType === "ARTICLE")
            );
          })
          .map((record: any) => {
            const category =
              typeof record.MCS_News_Category_ID === "object"
                ? record.MCS_News_Category_ID?.identifier
                : record.MCS_News_Category_ID;
            const author =
              typeof record.CreatedBy === "object"
                ? record.CreatedBy?.identifier
                : record.CreatedBy;
            const publishedAt = record.Updated || record.Created;
            return {
              id: String(record.id),
              cat: category || "Community",
              tone: getTone(record.id),
              title: record.Name || record.Value || "Untitled news story",
              excerpt: record.Description || record.DetailInfo || "",
              when: publishedAt
                ? new Date(publishedAt).toLocaleDateString()
                : "Recently",
              read: record.MCS_ReadTime || record.MCS_ReadingTime || "3 min",
              author: record.MCS_Author || author || undefined,
              featured: record.MCS_IsFeatured === true,
            };
          });
        break;
      }

      default:
        if (model.startsWith("raw_")) {
          const rawModelName = model.replace("raw_", "");
          data = await fetchModel(rawModelName);
          break;
        }
        return NextResponse.json(
          { error: "Model mapping not implemented" },
          { status: 404 },
        );
    }

    const countryFilteredModels = ![
      "countries",
      "profile",
      "newspapers",
      "news-categories",
      "news",
      "taxi",
      "mentors",
      "mentorship-categories",
      "mentor-details",
      "mentor-webinars",
    ].includes(model);
    if (
      countryFilteredModels &&
      Array.isArray(data) &&
      selectedCountry !== "All"
    ) {
      const normalizeCountry = (value: string) => {
        const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, "");
        const aliases: Record<string, string> = {
          usa: "unitedstates",
          us: "unitedstates",
          uk: "unitedkingdom",
          uae: "unitedarabemirates",
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
        ].filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0,
        );
        return candidates.some((value) => {
          const normalizedValue = normalizeCountry(value);
          if (model === "scholarships" || model === "internships") {
            return normalizedValue === wantedCountry;
          }
          return normalizedValue.includes(wantedCountry);
        });
      });
      data = data.slice(skipRecords, skipRecords + pageSize);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`API Route Error for ${model}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
