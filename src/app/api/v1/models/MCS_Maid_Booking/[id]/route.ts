import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/idempiere";
import { verifyFavoriteUser } from "@/lib/favorite-session";

const API_URL =
  process.env.IDEMPIERE_API_URL || "http://15.207.222.86:8080/api/v1";
type Reference = { id?: number | string; identifier?: string };
type BookingRecord = {
  AD_User_ID?: number | string | Reference;
  MCS_Maid_ID?: number | string | Reference;
  MCS_Status?: string | Reference;
};

function referenceId(value: number | string | Reference | undefined) {
  return Number(
    typeof value === "object" && value !== null ? value.id : value || 0,
  );
}
function statusCode(value: string | Reference | undefined) {
  const status = String(
    typeof value === "object" && value !== null
      ? value.id || value.identifier || ""
      : value || "",
  ).toUpperCase();
  return status === "A" || status.startsWith("ACCEPT") ? "A" : status;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = verifyFavoriteUser(
      request.cookies.get("mcs_favorite_user")?.value,
    );
    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to submit a review." },
        { status: 401 },
      );
    }
    const bookingId = Number((await context.params).id);
    const input = await request.json();
    const rating = Number(input.MCS_Rating ?? input.rating);
    const review = String(input.MCS_Review ?? input.review ?? "").trim();
    const maidId = Number(input.MCS_Maid_ID?.id || input.MCS_Maid_ID || 0);
    if (
      !bookingId ||
      !maidId ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      !review
    ) {
      return NextResponse.json(
        { error: "Select a rating from 1 to 5 and enter your review." },
        { status: 400 },
      );
    }

    const token = await getAuthToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    const bookingResponse = await fetch(
      `${API_URL}/models/MCS_Maid_Booking/${bookingId}`,
      { headers, cache: "no-store" },
    );
    const booking = bookingResponse.ok
      ? ((await bookingResponse.json()) as BookingRecord)
      : null;
    if (
      !booking ||
      referenceId(booking.AD_User_ID) !== userId ||
      referenceId(booking.MCS_Maid_ID) !== maidId ||
      statusCode(booking.MCS_Status) !== "A"
    ) {
      return NextResponse.json(
        {
          error: "Only the user with an accepted booking can review this maid.",
        },
        { status: 403 },
      );
    }

    const response = await fetch(
      `${API_URL}/models/MCS_Maid_Booking/${bookingId}`,
      {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ MCS_Rating: rating, MCS_Review: review }),
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
        { error: String(data.message || data.error || text) },
        { status: response.status },
      );
    }
    return NextResponse.json({
      ...data,
      id: String(bookingId),
      rating,
      review,
    });
  } catch (error) {
    console.error("MCS_Maid_Booking review failed:", error);
    return NextResponse.json(
      { error: "Could not save your maid review." },
      { status: 500 },
    );
  }
}
