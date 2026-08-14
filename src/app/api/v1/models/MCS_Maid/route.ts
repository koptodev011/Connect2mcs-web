import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/idempiere";
import { verifyFavoriteUser } from "@/lib/favorite-session";

const API_URL =
  process.env.IDEMPIERE_API_URL || "http://15.207.222.86:8080/api/v1";

type Reference = { id?: string | number; identifier?: string; Name?: string };
type MaidRecord = {
  id?: string | number;
  Name?: string;
  IsActive?: boolean;
  AD_User_ID?: Reference | string | number;
  C_BPartner_ID?: Reference | string | number;
  C_City_ID?: Reference | string | number;
  C_Country_ID?: Reference | string | number;
  C_Currency_ID?: Reference | string | number;
  MCS_Maid_Category?: Reference | string;
  MCS_Services?: Reference | string;
  MCS_ExperienceYears?: number | string;
  Address?: string;
  MCS_Languages?: Reference | string;
  MCS_Rate?: number | string;
  MCS_About?: string;
  Phone?: string;
};
type MaidBooking = {
  IsActive?: boolean;
  MCS_Maid_ID?: Reference | string | number;
  MCS_Rating?: number | string;
};

function referenceId(value: Reference | string | number | undefined) {
  return String(
    typeof value === "object" && value !== null ? value.id || "" : value || "",
  );
}

function referenceName(value: Reference | string | number | undefined) {
  if (typeof value === "object" && value !== null)
    return String(value.identifier || value.Name || "");
  return String(value || "");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cookies = (request.headers.get("cookie") || "")
      .split(";")
      .map((cookie) => cookie.trim());
    const signedCookie = cookies.find((cookie) =>
      cookie.startsWith("mcs_favorite_user="),
    );
    const signedUserId = verifyFavoriteUser(
      signedCookie?.substring("mcs_favorite_user=".length),
    );
    const countryCookie = cookies.find((cookie) =>
      cookie.startsWith("mcs_country="),
    );
    const countryIdCookie = cookies.find((cookie) =>
      cookie.startsWith("mcs_country_id="),
    );
    const selectedCountry = countryCookie
      ? decodeURIComponent(countryCookie.substring("mcs_country=".length))
      : "All";
    const selectedCountryId = countryIdCookie
      ? decodeURIComponent(countryIdCookie.substring("mcs_country_id=".length))
      : "";
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("top")) || 100, 1),
      100,
    );
    const skipRecords = Math.max(Number(searchParams.get("skip")) || 0, 0);
    const token = await getAuthToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    const [maidsResponse, bookingsResponse] = await Promise.all([
      fetch(
        `${API_URL}/models/MCS_Maid?$filter=${encodeURIComponent("IsActive eq true")}&$top=100&$orderby=${encodeURIComponent("Updated desc")}`,
        { headers, cache: "no-store" },
      ),
      fetch(
        `${API_URL}/models/MCS_Maid_Booking?$filter=${encodeURIComponent("IsActive eq true")}&$top=1000&$orderby=${encodeURIComponent("Updated desc")}`,
        { headers, cache: "no-store" },
      ),
    ]);
    const [maidsText, bookingsText] = await Promise.all([
      maidsResponse.text(),
      bookingsResponse.text(),
    ]);
    if (!maidsResponse.ok)
      throw new Error(
        `MCS_Maid fetch failed (${maidsResponse.status}): ${maidsText}`,
      );
    if (!bookingsResponse.ok)
      throw new Error(
        `MCS_Maid_Booking fetch failed (${bookingsResponse.status}): ${bookingsText}`,
      );

    const maids: MaidRecord[] = maidsText
      ? JSON.parse(maidsText).records || []
      : [];
    const bookings: MaidBooking[] = bookingsText
      ? JSON.parse(bookingsText).records || []
      : [];
    const ratingsByMaid = new Map<string, number[]>();
    for (const booking of bookings) {
      if (booking.IsActive === false) continue;
      const maidId = referenceId(booking.MCS_Maid_ID);
      const rating = Number(booking.MCS_Rating);
      if (!maidId || !Number.isFinite(rating) || rating <= 0) continue;
      ratingsByMaid.set(maidId, [...(ratingsByMaid.get(maidId) || []), rating]);
    }

    const allRecords = maids
      .filter((maid) => maid.IsActive !== false && maid.id != null)
      .map((maid) => {
        const maidId = String(maid.id);
        const ratings = ratingsByMaid.get(maidId) || [];
        const rating = ratings.length
          ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
          : 0;
        const category =
          referenceName(maid.MCS_Maid_Category) || "Maid Service";
        const serviceText = referenceName(maid.MCS_Services).replace(
          /\u00c2\u00b7/g,
          "\u00b7",
        );
        const services = serviceText
          .replace(/[<>]/g, "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        const experienceYears = Number(maid.MCS_ExperienceYears);
        const languages = referenceName(maid.MCS_Languages)
          .replace(/[<>]/g, "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        const currency = referenceName(maid.C_Currency_ID);
        const city = referenceName(maid.C_City_ID);
        const partner = referenceName(maid.C_BPartner_ID);
        const rateSuffix = /hour/i.test(category) ? "/hr" : "";
        const name =
          maid.Name || referenceName(maid.AD_User_ID) || "Community Helper";
        return {
          id: maidId,
          name,
          avatar: name.charAt(0).toUpperCase(),
          verified: Boolean(maid.C_BPartner_ID),
          owned:
            Boolean(signedUserId) &&
            referenceId(maid.AD_User_ID) === String(signedUserId),
          categoryId:
            typeof maid.MCS_Maid_Category === "object"
              ? String(maid.MCS_Maid_Category.id || "")
              : String(maid.MCS_Maid_Category || ""),
          currencyId: referenceId(maid.C_Currency_ID),
          countryId: referenceId(maid.C_Country_ID),
          cityId: referenceId(maid.C_City_ID),
          services: services.length ? services.join(" · ") : category,
          rating: Number(rating.toFixed(1)),
          reviewCount: ratings.length,
          rate: maid.MCS_Rate != null ? String(maid.MCS_Rate) : "",
          experience: Number.isFinite(experienceYears)
            ? `${experienceYears} yrs exp`
            : "Experience on request",
          jobs: `${ratings.length} ${ratings.length === 1 ? "review" : "reviews"}`,
          location:
            maid.Address?.trim() || city || partner || "Address on request",
          country: referenceName(maid.C_Country_ID),
          price:
            maid.MCS_Rate != null
              ? `${currency ? `${currency} ` : ""}${maid.MCS_Rate}${rateSuffix}`
              : "Contact for rate",
          languages: languages.length ? languages : ["Contact for languages"],
          about: maid.MCS_About || "",
          skills: services.length ? services : [category],
          workingHours: /hour/i.test(category)
            ? "Hourly availability"
            : "Contact for availability",
          days: "Contact for availability",
          startDate: "Available now",
          reviews: [],
          tag: category,
          phone: maid.Phone || "",
        };
      });
    const countryRecords =
      selectedCountry === "All"
        ? allRecords
        : allRecords.filter((maid) =>
            selectedCountryId
              ? maid.countryId === selectedCountryId
              : maid.country.trim().toLowerCase() ===
                selectedCountry.trim().toLowerCase(),
          );
    const records = countryRecords.slice(skipRecords, skipRecords + pageSize);
    return NextResponse.json({
      "page-count": Math.ceil(countryRecords.length / pageSize),
      "records-size": records.length,
      "skip-records": skipRecords,
      "row-count": countryRecords.length,
      "array-count": 0,
      records,
    });
  } catch (error) {
    console.error("MCS_Maid fetch failed:", error);
    return NextResponse.json(
      { error: "Could not load maids", records: [] },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = verifyFavoriteUser(
      request.cookies.get("mcs_favorite_user")?.value,
    );
    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in before registering as a maid." },
        { status: 401 },
      );
    }

    const input = await request.json();
    const category = String(input.MCS_Maid_Category || "").trim();
    const services = String(input.MCS_Services || "").trim();
    const languages = String(input.MCS_Languages || "").trim();
    const address = String(input.Address || "").trim();
    const about = String(input.MCS_About || "").trim();
    const rate = Number(input.MCS_Rate);
    const experienceYears = Number(input.MCS_ExperienceYears);
    const currencyId = Number(
      typeof input.C_Currency_ID === "object"
        ? input.C_Currency_ID?.id
        : input.C_Currency_ID,
    );
    const countryId = Number(
      typeof input.C_Country_ID === "object"
        ? input.C_Country_ID?.id
        : input.C_Country_ID,
    );
    const cityId = Number(
      typeof input.C_City_ID === "object"
        ? input.C_City_ID?.id
        : input.C_City_ID,
    );
    if (
      !category ||
      !services ||
      !languages ||
      !address ||
      !about ||
      !Number.isFinite(rate) ||
      rate < 0 ||
      !Number.isFinite(experienceYears) ||
      experienceYears < 0 ||
      !currencyId ||
      !countryId ||
      !cityId
    ) {
      return NextResponse.json(
        { error: "Complete all required maid profile fields." },
        { status: 400 },
      );
    }

    const token = await getAuthToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    const duplicateResponse = await fetch(
      `${API_URL}/models/MCS_Maid?$filter=${encodeURIComponent(`AD_User_ID eq ${userId} and IsActive eq true`)}&$top=1`,
      { headers, cache: "no-store" },
    );
    const duplicateData = duplicateResponse.ok
      ? ((await duplicateResponse.json()) as {
          records?: Array<{ id?: number }>;
        })
      : {};
    if (duplicateData.records?.[0]?.id) {
      return NextResponse.json(
        { error: "You already have an active maid profile." },
        { status: 409 },
      );
    }

    const userResponse = await fetch(`${API_URL}/models/AD_User/${userId}`, {
      headers,
      cache: "no-store",
    });
    const userRecord = userResponse.ok
      ? ((await userResponse.json()) as {
          Name?: string;
          Phone?: string;
          Phone2?: string;
          C_BPartner_ID?: Reference | number;
        })
      : {};
    const partnerId = Number(referenceId(userRecord.C_BPartner_ID));
    const payload: Record<string, unknown> = {
      Value: `MAID_${userId}_${Date.now()}`,
      Name: String(userRecord.Name || input.Name || "Community Maid").trim(),
      AD_User_ID: userId,
      MCS_Maid_Category: category,
      MCS_Rate: rate,
      C_Currency_ID: currencyId,
      C_Country_ID: countryId,
      C_City_ID: cityId,
      Phone: String(
        userRecord.Phone || userRecord.Phone2 || input.Phone || "",
      ).trim(),
      MCS_Languages: languages,
      MCS_About: about,
      MCS_Services: services,
      Address: address,
      MCS_ExperienceYears: experienceYears,
      IsActive: true,
    };
    if (partnerId) payload.C_BPartner_ID = partnerId;

    const response = await fetch(`${API_URL}/models/MCS_Maid`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const responseText = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {}
    if (!response.ok) {
      return NextResponse.json(
        {
          error: String(
            data.message ||
              data.error ||
              responseText ||
              "Could not create maid profile",
          ),
        },
        { status: response.status },
      );
    }
    const nestedRecord =
      data.record && typeof data.record === "object"
        ? (data.record as Record<string, unknown>)
        : null;
    const records = Array.isArray(data.records) ? data.records : [];
    const firstRecord =
      records[0] && typeof records[0] === "object"
        ? (records[0] as Record<string, unknown>)
        : null;
    const responseMaidReference = data.MCS_Maid_ID;
    let maidId = Number(
      data.maidId ||
        data.id ||
        (typeof responseMaidReference === "object" &&
        responseMaidReference !== null
          ? (responseMaidReference as Reference).id
          : responseMaidReference) ||
        nestedRecord?.id ||
        firstRecord?.id,
    );

    if (!maidId) {
      const lookupResponse = await fetch(
        `${API_URL}/models/MCS_Maid?$filter=${encodeURIComponent(`AD_User_ID eq ${userId} and IsActive eq true`)}&$top=1&$orderby=${encodeURIComponent("Created desc")}`,
        { headers, cache: "no-store" },
      );
      if (lookupResponse.ok) {
        const lookupData = (await lookupResponse.json()) as {
          records?: Array<{ id?: number | string }>;
        };
        maidId = Number(lookupData.records?.[0]?.id || 0);
      }
    }

    return NextResponse.json(
      { ...data, maidId: maidId || null },
      { status: response.status },
    );
  } catch (error) {
    console.error("MCS_Maid create failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create maid profile",
      },
      { status: 500 },
    );
  }
}
