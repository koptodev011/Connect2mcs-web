import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/idempiere";
import { verifyFavoriteUser } from "@/lib/favorite-session";

const API_URL =
  process.env.IDEMPIERE_API_URL || "http://15.207.222.86:8080/api/v1";

type Reference = { id?: number | string; identifier?: string };
type BookingRecord = {
  id?: number | string;
  Name?: string;
  Address?: string;
  Description?: string;
  MCS_Services?: string | Reference;
  AD_User_ID?: number | string | Reference;
  Created?: string;
  MCS_Status?: string | Reference;
  MCS_BookingStatus?: string | Reference;
  Status?: string | Reference;
  MCS_Maid_ID?: number | string | Reference;
  MCS_Rating?: number | string;
  MCS_Review?: string;
};

function referenceText(value: number | string | Reference | undefined) {
  return typeof value === "object" && value !== null
    ? String(value.identifier || value.id || "")
    : String(value || "");
}

function bookingStatus(value: string | Reference | undefined) {
  const raw = String(
    typeof value === "object" && value !== null
      ? value.id || value.identifier || ""
      : value || "",
  ).toUpperCase();
  if (raw === "A" || raw.startsWith("ACCEPT")) return "A";
  if (raw === "R" || raw.startsWith("REJECT")) return "R";
  if (raw === "S" || raw.startsWith("SUBMIT")) return "S";
  return "";
}
export async function GET(request: NextRequest) {
  try {
    const userId = verifyFavoriteUser(
      request.cookies.get("mcs_favorite_user")?.value,
    );
    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to view booking requests.", records: [] },
        { status: 401 },
      );
    }

    const token = await getAuthToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    const requestedMaidId = Number(request.nextUrl.searchParams.get("maidId"));
    if (requestedMaidId) {
      const reviewableResponse = await fetch(
        `${API_URL}/models/MCS_Maid_Booking?$filter=${encodeURIComponent(`AD_User_ID eq ${userId} and MCS_Maid_ID eq ${requestedMaidId} and MCS_Status eq 'A' and IsActive eq true`)}&$top=1&$orderby=${encodeURIComponent("Updated desc")}`,
        { headers, cache: "no-store" },
      );
      const reviewableText = await reviewableResponse.text();
      if (!reviewableResponse.ok) {
        return NextResponse.json(
          { error: reviewableText || "Could not check review eligibility." },
          { status: reviewableResponse.status },
        );
      }
      const reviewableData = reviewableText
        ? (JSON.parse(reviewableText) as { records?: BookingRecord[] })
        : { records: [] };
      const booking = reviewableData.records?.[0];
      return NextResponse.json({
        booking: booking?.id
          ? {
              id: String(booking.id),
              status: "A",
              rating: Number(booking.MCS_Rating || 0),
              review: String(booking.MCS_Review || ""),
            }
          : null,
      });
    }
    const maidResponse = await fetch(
      `${API_URL}/models/MCS_Maid?$filter=${encodeURIComponent(`AD_User_ID eq ${userId} and IsActive eq true`)}&$top=1`,
      { headers, cache: "no-store" },
    );
    const maidData = maidResponse.ok
      ? ((await maidResponse.json()) as {
          records?: Array<{ id?: number | string }>;
        })
      : {};
    const maidId = Number(maidData.records?.[0]?.id || 0);
    if (!maidId) {
      return NextResponse.json({ records: [], "row-count": 0 });
    }

    const bookingsResponse = await fetch(
      `${API_URL}/models/MCS_Maid_Booking?$filter=${encodeURIComponent(`MCS_Maid_ID eq ${maidId} and IsActive eq true`)}&$top=100&$orderby=${encodeURIComponent("Created desc")}`,
      { headers, cache: "no-store" },
    );
    const text = await bookingsResponse.text();
    if (!bookingsResponse.ok) {
      return NextResponse.json(
        { error: text || "Could not load booking requests.", records: [] },
        { status: bookingsResponse.status },
      );
    }
    const data = text
      ? (JSON.parse(text) as { records?: BookingRecord[] })
      : { records: [] };
    const records = (data.records || [])
      .filter(
        (booking) =>
          bookingStatus(
            booking.MCS_Status || booking.MCS_BookingStatus || booking.Status,
          ) === "S",
      )
      .map((booking) => ({
        id: String(booking.id || ""),
        name:
          String(booking.Name || "").trim() ||
          referenceText(booking.AD_User_ID) ||
          "Community Member",
        address: String(booking.Address || "").trim(),
        notes: String(booking.Description || "").trim(),
        services: referenceText(booking.MCS_Services)
          .split(",")
          .map((service) => service.trim())
          .filter(Boolean),
        created: String(booking.Created || ""),
        status: bookingStatus(
          booking.MCS_Status || booking.MCS_BookingStatus || booking.Status,
        ),
      }));
    return NextResponse.json({
      records,
      "row-count": records.length,
      maidId: String(maidId),
    });
  } catch (error) {
    console.error("MCS_Maid_Booking fetch failed:", error);
    return NextResponse.json(
      { error: "Could not load booking requests.", records: [] },
      { status: 500 },
    );
  }
}
function referenceId(value: number | string | Reference | undefined) {
  return Number(
    typeof value === "object" && value !== null ? value.id : value || 0,
  );
}

export async function PUT(request: NextRequest) {
  try {
    const userId = verifyFavoriteUser(
      request.cookies.get("mcs_favorite_user")?.value,
    );
    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to update booking requests." },
        { status: 401 },
      );
    }
    const input = await request.json();
    const bookingId = Number(input.id || input.MCS_Maid_Booking_ID);
    const status = String(input.status || input.MCS_Status || "").toUpperCase();
    if (!bookingId || !["S", "A", "R"].includes(status)) {
      return NextResponse.json(
        { error: "Select a valid booking status." },
        { status: 400 },
      );
    }

    const token = await getAuthToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    const maidResponse = await fetch(
      `${API_URL}/models/MCS_Maid?$filter=${encodeURIComponent(`AD_User_ID eq ${userId} and IsActive eq true`)}&$top=1`,
      { headers, cache: "no-store" },
    );
    const maidData = maidResponse.ok
      ? ((await maidResponse.json()) as {
          records?: Array<{ id?: number | string }>;
        })
      : {};
    const maidId = Number(maidData.records?.[0]?.id || 0);
    if (!maidId) {
      return NextResponse.json(
        { error: "Active maid profile not found." },
        { status: 403 },
      );
    }

    const bookingResponse = await fetch(
      `${API_URL}/models/MCS_Maid_Booking/${bookingId}`,
      { headers, cache: "no-store" },
    );
    const booking = bookingResponse.ok
      ? ((await bookingResponse.json()) as BookingRecord)
      : null;
    if (!booking || referenceId(booking.MCS_Maid_ID) !== maidId) {
      return NextResponse.json(
        { error: "You can only update requests for your maid profile." },
        { status: 403 },
      );
    }

    const response = await fetch(
      `${API_URL}/models/MCS_Maid_Booking/${bookingId}`,
      {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ MCS_Status: status }),
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
    return NextResponse.json({ ...data, id: String(bookingId), status });
  } catch (error) {
    console.error("MCS_Maid_Booking update failed:", error);
    return NextResponse.json(
      { error: "Could not update booking request." },
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
        { error: "Please sign in before sending a booking request." },
        { status: 401 },
      );
    }

    const input = await request.json();
    const maidId = Number(input.MCS_Maid_ID?.id || input.MCS_Maid_ID);
    const name = String(input.Name || "").trim();
    const address = String(input.Address || "").trim();
    const notes = String(input.notes || input.Description || "").trim();
    const services = String(input.services || input.MCS_Services || "")
      .split(",")
      .map((service) => service.trim())
      .filter(Boolean)
      .join(",");

    if (!maidId || !name || !address || !services) {
      return NextResponse.json(
        { error: "Name, address, and at least one service are required." },
        { status: 400 },
      );
    }

    const payload = {
      AD_Org_ID: { id: Number(process.env.IDEMPIERE_ORG_ID) || 1000012 },
      AD_User_ID: { id: userId },
      MCS_Maid_ID: { id: maidId },
      Name: name,
      Address: address,
      Description: notes,
      MCS_Services: services,
      MCS_Status: "S",
      IsActive: true,
    };
    const response = await fetch(`${API_URL}/models/MCS_Maid_Booking`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
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
              "Could not send maid booking request.",
          ),
        },
        { status: response.status },
      );
    }
    return NextResponse.json(data, { status: response.status || 201 });
  } catch (error) {
    console.error("MCS_Maid_Booking create failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not send maid booking request.",
      },
      { status: 500 },
    );
  }
}
