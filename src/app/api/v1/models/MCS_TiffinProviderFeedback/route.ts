import { NextRequest, NextResponse } from "next/server";
import { fetchModelRecord, getAuthToken } from "@/lib/idempiere";
import { verifyFavoriteUser } from "@/lib/favorite-session";

const API_URL =
  process.env.IDEMPIERE_API_URL || "http://15.207.222.86:8080/api/v1";

type Reference = {
  id?: string | number;
  identifier?: string;
  Name?: string;
};

type FeedbackRecord = {
  id?: string | number;
  AD_User_ID?: Reference | string | number;
  Value?: string;
  Name?: string;
  MCS_Review?: string;
  Rating?: string | number;
  IsActive?: boolean;
  Created?: string;
  Updated?: string;
};

type ProviderRecord = {
  id?: string | number;
  Name?: string;
  AD_User_ID?: Reference | string | number;
};

function referenceName(value: Reference | string | number | undefined) {
  if (typeof value === "object" && value !== null) {
    return String(value.identifier || value.Name || "");
  }
  return String(value || "");
}

function signedUserId(request: NextRequest) {
  return verifyFavoriteUser(request.cookies.get("mcs_favorite_user")?.value);
}

export async function GET(request: NextRequest) {
  try {
    const providerId = Number(request.nextUrl.searchParams.get("providerId"));
    if (!providerId) {
      return NextResponse.json(
        { error: "Invalid tiffin provider ID.", records: [] },
        { status: 400 },
      );
    }

    const response = await fetch(
      API_URL +
        "/models/MCS_TiffinProviderFeedback?$filter=" +
        encodeURIComponent("IsActive eq true") +
        "&$top=1000&$orderby=" +
        encodeURIComponent("Updated desc"),
      {
        headers: {
          Authorization: "Bearer " + (await getAuthToken()),
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
    const text = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        {
          error: text || "Could not load tiffin provider reviews.",
          records: [],
        },
        { status: response.status },
      );
    }

    const data = text ? JSON.parse(text) : {};
    const prefix = "TF-" + providerId + "-";
    const records = (Array.isArray(data.records) ? data.records : [])
      .filter(
        (record: FeedbackRecord) =>
          record.IsActive !== false &&
          String(record.Value || "").startsWith(prefix),
      )
      .map((record: FeedbackRecord) => ({
        id: String(record.id || record.Value || ""),
        userName: referenceName(record.AD_User_ID) || "Community member",
        review: String(record.MCS_Review || "").trim(),
        rating: Number(record.Rating) || 0,
        date: String(record.Updated || record.Created || ""),
      }));

    const validRatings = records
      .map((record: { rating: number }) => record.rating)
      .filter((rating: number) => rating >= 1 && rating <= 5);
    const averageRating = validRatings.length
      ? validRatings.reduce(
          (total: number, rating: number) => total + rating,
          0,
        ) / validRatings.length
      : 0;

    return NextResponse.json({
      records,
      reviewCount: records.length,
      averageRating: Number(averageRating.toFixed(1)),
    });
  } catch (error) {
    console.error("MCS_TiffinProviderFeedback fetch failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load tiffin provider reviews.",
        records: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = signedUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to submit a review." },
        { status: 401 },
      );
    }

    const input = await request.json();
    const providerId = Number(input.providerId);
    const rating = Number(input.Rating ?? input.rating);
    const review = String(input.MCS_Review ?? input.review ?? "").trim();
    if (
      !providerId ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      !review
    ) {
      return NextResponse.json(
        { error: "Select a rating and enter your review." },
        { status: 400 },
      );
    }

    const provider = (await fetchModelRecord(
      "MCS_TiffinProvider",
      providerId,
    )) as ProviderRecord;
    if (!provider?.id) {
      return NextResponse.json(
        { error: "Tiffin provider not found." },
        { status: 404 },
      );
    }
    const providerName =
      String(provider.Name || "").trim() ||
      referenceName(provider.AD_User_ID) ||
      "Tiffin Provider";

    const payload = {
      AD_User_ID: userId,
      Value: "TF-" + providerId + "-" + userId + "-" + Date.now(),
      Name: "Feedback - " + providerName,
      MCS_Review: review,
      Rating: rating,
      IsActive: true,
    };

    const response = await fetch(
      API_URL + "/models/MCS_TiffinProviderFeedback",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + (await getAuthToken()),
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );
    const text = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {}
    if (!response.ok) {
      return NextResponse.json(
        {
          error: String(
            data.message ||
              data.error ||
              text ||
              "Could not submit your review.",
          ),
        },
        { status: response.status },
      );
    }

    return NextResponse.json(
      {
        ...data,
        review: {
          id: String(data.id || payload.Value),
          userName: "You",
          review,
          rating,
          date: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("MCS_TiffinProviderFeedback create failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not submit your review.",
      },
      { status: 500 },
    );
  }
}
