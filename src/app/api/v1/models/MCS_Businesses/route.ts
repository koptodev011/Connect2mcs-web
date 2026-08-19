import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/idempiere";
import { verifyFavoriteUser } from "@/lib/favorite-session";

const API_URL =
  process.env.IDEMPIERE_API_URL || "http://15.207.222.86:8080/api/v1";
const MODEL = "MCS_Businesses";

const idOf = (value: unknown) =>
  Number(
    value && typeof value === "object" && "id" in value
      ? (value as { id: unknown }).id
      : value,
  ) || 0;

export async function POST(request: NextRequest) {
  try {
    const userId = verifyFavoriteUser(
      request.cookies.get("mcs_favorite_user")?.value,
    );
    if (!userId)
      return NextResponse.json(
        { error: "Please sign in to list a business." },
        { status: 401 },
      );

    const input = (await request.json()) as Record<string, unknown>;
    const cityId = idOf(input.C_City_ID);
    const countryId = idOf(input.C_Country_ID);
    const categoryId = idOf(input.MCS_Business_Category_ID);
    const name = String(input.Name || "").trim();

    if (!name || !cityId || !countryId || !categoryId) {
      return NextResponse.json(
        { error: "Business name, category, country, and city are required." },
        { status: 400 },
      );
    }

    const payload = {
      AD_User_ID: { id: userId },
      C_City_ID: { id: cityId },
      C_Country_ID: { id: countryId },
      MCS_Business_Category_ID: { id: categoryId },
      Value: String(input.Value || `MCS-BUS-${Date.now()}`).trim(),
      Name: name,
      Description: String(input.Description || "").trim(),
      Help: String(input.Help || "").trim(),
      MCS_Services: String(input.MCS_Services || "").trim(),
      MCS_siteUrl: String(input.MCS_siteUrl || "").trim(),
      Phone: String(input.Phone || "").trim(),
      IsActive: true,
    };

    const response = await fetch(`${API_URL}/models/${MODEL}`, {
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
            data.message || data.error || text || "Could not create business",
          ),
        },
        { status: response.status },
      );
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Business create failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create business",
      },
      { status: 500 },
    );
  }
}
