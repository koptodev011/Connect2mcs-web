import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/idempiere";
import { verifyFavoriteUser } from "@/lib/favorite-session";

const API_URL =
  process.env.IDEMPIERE_API_URL || "http://15.207.222.86:8080/api/v1";
const MODEL = "MCS_Marketplace_Favorite";

const idOf = (value: unknown): number =>
  Number(
    value && typeof value === "object" && "id" in value
      ? (value as { id: unknown }).id
      : value,
  ) || 0;

function sessionUser(request: NextRequest, requestedUserId: number) {
  const verifiedUserId = verifyFavoriteUser(
    request.cookies.get("mcs_favorite_user")?.value,
  );
  return verifiedUserId === requestedUserId ? verifiedUserId : null;
}

async function read(filter: string, top = 100) {
  const query = new URLSearchParams({
    $filter: filter,
    $orderby: "Created desc",
    $top: String(top),
  });
  const response = await fetch(`${API_URL}/models/${MODEL}?${query}`, {
    headers: {
      Authorization: `Bearer ${await getAuthToken()}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GET ${MODEL}: ${response.status} ${text}`);
  }
  const payload = text ? JSON.parse(text) : {};
  return Array.isArray(payload) ? payload : payload.records || [];
}

async function write(path: string, method: "POST" | "PUT", body: unknown) {
  const response = await fetch(`${API_URL}/models/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await getAuthToken()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path}: ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    const requestedUserId = idOf(input.AD_User_ID ?? input.userId);
    const userId = sessionUser(request, requestedUserId);
    const marketplaceId = idOf(
      input.MCS_MarketPlaces_ID ?? input.marketplaceId,
    );
    const active =
      typeof input.IsActive === "boolean"
        ? input.IsActive
        : input.active === true;
    const name =
      String(input.Name || "").trim() || "Saved Marketplace Item";

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized favorite user" },
        { status: 401 },
      );
    }
    if (!marketplaceId || typeof active !== "boolean") {
      return NextResponse.json(
        { error: "MCS_MarketPlaces_ID and IsActive are required" },
        { status: 400 },
      );
    }

    const savedDate = new Date(input.MCS_SavedDate || Date.now())
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z");

    const existing = (
      await read(
        `AD_User_ID eq ${userId} and MCS_MarketPlaces_ID eq ${marketplaceId}`,
        1,
      )
    )[0];
    if (existing) {
      await write(`${MODEL}/${existing.id}`, "PUT", {
        Name: name,
        MCS_SavedDate: savedDate,
        IsActive: active,
      });
      return NextResponse.json({ active, favoriteId: idOf(existing.id) });
    }
    if (!active) return NextResponse.json({ active: false, favoriteId: 0 });

    const created = await write(MODEL, "POST", {
      Name: name,
      AD_User_ID: { id: userId },
      MCS_MarketPlaces_ID: { id: marketplaceId },
      MCS_SavedDate: savedDate,
      IsActive: true,
    });
    return NextResponse.json(
      {
        active: true,
        favoriteId: idOf(created?.id || created),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Marketplace favorite update failed:", error);
    return NextResponse.json(
      {
        error: "Could not update marketplace favorite",
        detail: error instanceof Error ? error.message : "Unknown backend error",
      },
      { status: 500 },
    );
  }
}