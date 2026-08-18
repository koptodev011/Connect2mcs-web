import { NextRequest, NextResponse } from "next/server";
import { fetchModel, getAuthToken } from "@/lib/idempiere";
import { verifyFavoriteUser } from "@/lib/favorite-session";

const API_URL =
  process.env.IDEMPIERE_API_URL || "http://15.207.222.86:8080/api/v1";
import type { Tone } from "@/lib/tokens";

type Reference = { id?: string | number; identifier?: string; Name?: string };
type FeedbackRecord = {
  IsActive?: boolean;
  Value?: string;
  Rating?: string | number;
};

type TiffinRecord = {
  id?: string | number;
  IsActive?: boolean;
  Name?: string;
  AD_User_ID?: Reference | string | number;
  C_City_ID?: Reference | string | number;
  C_Country_ID?: Reference | string | number;
  C_Currency_ID?: Reference | string | number;
  MCS_Tiffin_Category_ID?: Reference | string | number;
  MCS_About?: string;
  MCS_DeliveryInfo?: string;
  MCS_ExperienceYears?: string | number;
  MCS_Menu?: string;
  MCS_Specialty?: string;
  MCS_ServiceDays?: string | number;
  MCS_PricePerMeal?: string | number;
  MCS_PricePerMonth?: string | number;
  MCS_OrderCount?: string | number;
  MCS_IsVeg?: boolean;
  MCS_HasTrial?: boolean;
  Rating?: string | number;
};

const tones: Tone[] = ["blue", "brick", "saffron", "green", "gold"];
const getTone = (id: string | number): Tone => {
  const hash = String(id)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);
  return tones[hash % tones.length];
};
const referenceId = (value: Reference | string | number | undefined): string =>
  String(
    typeof value === "object" && value !== null ? value.id || "" : value || "",
  );

const referenceName = (
  value: Reference | string | number | undefined,
): string => {
  if (typeof value === "object" && value !== null) {
    return String(value.identifier || value.Name || "");
  }
  return String(value || "");
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const signedCookie = (request.headers.get("cookie") || "")
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("mcs_favorite_user="));
    const signedUserId = verifyFavoriteUser(
      signedCookie?.substring("mcs_favorite_user=".length),
    );
    const top = Math.min(
      Math.max(Number(searchParams.get("top")) || 100, 1),
      100,
    );
    const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);
    const [rawRecords, feedbackRecords] = (await Promise.all([
      fetchModel("MCS_TiffinProvider", "IsActive eq true", {
        top: 100,
        orderby: "Updated desc",
      }),
      fetchModel("MCS_TiffinProviderFeedback", "IsActive eq true", {
        top: 1000,
        orderby: "Updated desc",
      }),
    ])) as [TiffinRecord[], FeedbackRecord[]];

    const ratingsByProvider = new Map<string, number[]>();
    for (const feedback of feedbackRecords) {
      if (feedback.IsActive === false) continue;
      const providerId = String(feedback.Value || "").match(/^TF-(\d+)-/)?.[1];
      const rating = Number(feedback.Rating);
      if (!providerId || rating < 1 || rating > 5) continue;
      ratingsByProvider.set(providerId, [
        ...(ratingsByProvider.get(providerId) || []),
        rating,
      ]);
    }

    const allRecords = rawRecords
      .filter((record) => record.IsActive !== false && record.id != null)
      .map((record) => {
        const id = String(record.id);
        const menu =
          typeof record.MCS_Menu === "string"
            ? record.MCS_Menu.split(",")
                .map((dish) => dish.trim())
                .filter(Boolean)
            : [];
        const signature = menu[0];
        const name =
          String(record.Name || "").trim() ||
          referenceName(record.AD_User_ID) ||
          (signature ? signature + " Home Kitchen" : "Home Tiffin #" + id);
        const city = referenceName(record.C_City_ID) || "Various";
        const category = referenceName(record.MCS_Tiffin_Category_ID);
        const currency = referenceName(record.C_Currency_ID) || "$";
        const formatPrice = (value: string | number) =>
          currency === "$" ? "$" + value : currency + " " + value;
        const specialty =
          String(record.MCS_Specialty || "").trim() ||
          category ||
          signature ||
          "Home Food";
        const feedbackRatings = ratingsByProvider.get(id) || [];
        const feedbackAverage = feedbackRatings.length
          ? feedbackRatings.reduce((total, rating) => total + rating, 0) /
            feedbackRatings.length
          : 0;

        return {
          id,
          name,
          city,
          owned:
            Boolean(signedUserId) &&
            referenceId(record.AD_User_ID) === String(signedUserId),
          countryId: referenceId(record.C_Country_ID),
          cityId: referenceId(record.C_City_ID),
          currencyId: referenceId(record.C_Currency_ID),
          categoryId: referenceId(record.MCS_Tiffin_Category_ID),
          about: String(record.MCS_About || "").trim(),
          deliveryInfo: String(record.MCS_DeliveryInfo || "").trim(),
          experienceYears: Number(record.MCS_ExperienceYears) || 0,
          pricePerMeal: Number(record.MCS_PricePerMeal) || 0,
          pricePerMonth: Number(record.MCS_PricePerMonth) || 0,
          specialty,
          per: record.MCS_PricePerMeal
            ? formatPrice(record.MCS_PricePerMeal) + "/meal"
            : "Varies",
          perMeal: record.MCS_PricePerMeal
            ? formatPrice(record.MCS_PricePerMeal)
            : "-",
          perMonth: record.MCS_PricePerMonth
            ? formatPrice(record.MCS_PricePerMonth)
            : "-",
          delivery:
            String(record.MCS_DeliveryInfo || "").trim() ||
            city ||
            "Pickup only",
          menu: menu.length ? menu : ["Daily Thali"],
          rating: Number(feedbackAverage.toFixed(1)),
          orders: Number(record.MCS_OrderCount) || 0,
          mandal: "-",
          tone: getTone(id),
          veg: record.MCS_IsVeg === true,
          trial: record.MCS_HasTrial === true,
          serviceDays: Number(record.MCS_ServiceDays) || 0,
          note: String(
            record.MCS_About || record.MCS_DeliveryInfo || "",
          ).trim(),
        };
      });

    return NextResponse.json({
      "page-count": Math.max(Math.ceil(allRecords.length / top), 1),
      "records-size": top,
      "skip-records": skip,
      "row-count": allRecords.length,
      "array-count": 0,
      records: allRecords.slice(skip, skip + top),
    });
  } catch (error) {
    console.error("MCS_TiffinProvider fetch failed:", error);
    return NextResponse.json(
      { error: "Could not load tiffin providers", records: [] },
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
        { error: "Please sign in before registering as a tiffin provider." },
        { status: 401 },
      );
    }

    const input = await request.json();
    const requiredText = [
      input.MCS_About,
      input.MCS_DeliveryInfo,
      input.MCS_Menu,
      input.MCS_Specialty,
    ].every((value) => String(value || "").trim());
    const countryId = Number(input.C_Country_ID?.id || input.C_Country_ID);
    const cityId = Number(input.C_City_ID?.id || input.C_City_ID);
    const currencyId = Number(input.C_Currency_ID?.id || input.C_Currency_ID);
    const categoryId = Number(
      input.MCS_Tiffin_Category_ID?.id || input.MCS_Tiffin_Category_ID,
    );
    const experience = Number(input.MCS_ExperienceYears);
    const pricePerMeal = Number(input.MCS_PricePerMeal);
    const pricePerMonth = Number(input.MCS_PricePerMonth);
    const serviceDays = Number(input.MCS_ServiceDays);
    if (
      !requiredText ||
      !countryId ||
      !cityId ||
      !currencyId ||
      !categoryId ||
      !Number.isFinite(experience) ||
      experience < 0 ||
      !Number.isFinite(pricePerMeal) ||
      pricePerMeal < 0 ||
      !Number.isFinite(pricePerMonth) ||
      pricePerMonth < 0 ||
      !Number.isInteger(serviceDays) ||
      serviceDays < 1
    ) {
      return NextResponse.json(
        { error: "Complete all required tiffin provider fields." },
        { status: 400 },
      );
    }

    const token = await getAuthToken();
    const headers = {
      Authorization: "Bearer " + token,
      Accept: "application/json",
    };
    const duplicateResponse = await fetch(
      API_URL +
        "/models/MCS_TiffinProvider?$filter=" +
        encodeURIComponent(
          "AD_User_ID eq " + userId + " and IsActive eq true",
        ) +
        "&$top=1",
      { headers, cache: "no-store" },
    );
    const duplicateData = duplicateResponse.ok
      ? await duplicateResponse.json()
      : {};
    if (duplicateData.records?.[0]?.id) {
      return NextResponse.json(
        { error: "You already have an active tiffin provider profile." },
        { status: 409 },
      );
    }

    const userResponse = await fetch(API_URL + "/models/AD_User/" + userId, {
      headers,
      cache: "no-store",
    });
    const userRecord = userResponse.ok ? await userResponse.json() : {};
    const partnerValue = userRecord.C_BPartner_ID;
    const partnerId = Number(
      typeof partnerValue === "object" && partnerValue
        ? partnerValue.id
        : partnerValue,
    );

    const payload: Record<string, unknown> = {
      AD_User_ID: userId,
      C_Country_ID: countryId,
      C_City_ID: cityId,
      C_Currency_ID: currencyId,
      MCS_Tiffin_Category_ID: categoryId,
      MCS_About: String(input.MCS_About).trim(),
      MCS_DeliveryInfo: String(input.MCS_DeliveryInfo).trim(),
      MCS_ExperienceYears: experience,
      MCS_IsVeg: input.MCS_IsVeg === true,
      MCS_Menu: String(input.MCS_Menu).trim(),
      MCS_PricePerMeal: pricePerMeal,
      MCS_PricePerMonth: pricePerMonth,
      MCS_Specialty: String(input.MCS_Specialty).trim(),
      MCS_ServiceDays: serviceDays,
      MCS_OrderCount: 0,
      MCS_HasTrial: false,
      IsActive: true,
    };
    if (partnerId) payload.C_BPartner_ID = partnerId;

    const response = await fetch(API_URL + "/models/MCS_TiffinProvider", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
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
              "Could not create tiffin provider profile",
          ),
        },
        { status: response.status },
      );
    }

    const record =
      data.record && typeof data.record === "object"
        ? (data.record as Record<string, unknown>)
        : data;
    return NextResponse.json({
      ...data,
      id: record.id || data.id,
      providerId: record.id || data.id,
    });
  } catch (error) {
    console.error("MCS_TiffinProvider create failed:", error);
    return NextResponse.json(
      { error: "Could not create tiffin provider profile" },
      { status: 500 },
    );
  }
}
