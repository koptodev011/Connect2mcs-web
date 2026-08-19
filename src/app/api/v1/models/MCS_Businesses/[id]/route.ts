import { NextRequest, NextResponse } from "next/server";
import { fetchModelRecord, getAuthToken } from "@/lib/idempiere";
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

async function ownerOf(id: string) {
  const record = await fetchModelRecord(MODEL, id);
  return idOf(record.AD_User_ID) || idOf(record.CreatedBy);
}

async function write(id: string, method: "PUT" | "DELETE", body?: unknown) {
  const response = await fetch(
    `${API_URL}/models/${MODEL}/${encodeURIComponent(id)}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    },
  );
  const text = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {}
  if (!response.ok) {
    throw new Error(
      String(
        data.message ||
          data.error ||
          text ||
          `Could not ${method.toLowerCase()} business`,
      ),
    );
  }
  return data;
}

async function authorize(request: NextRequest, id: string) {
  const userId = verifyFavoriteUser(
    request.cookies.get("mcs_favorite_user")?.value,
  );
  return userId && (await ownerOf(id)) === userId ? userId : 0;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!(await authorize(request, id))) {
      return NextResponse.json(
        { error: "Not your business." },
        { status: 403 },
      );
    }

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

    const updated = await write(id, "PUT", {
      C_City_ID: { id: cityId },
      C_Country_ID: { id: countryId },
      MCS_Business_Category_ID: { id: categoryId },
      Value: String(input.Value || name).trim(),
      Name: name,
      Description: String(input.Description || "").trim(),
      Help: String(input.Help || "").trim(),
      MCS_Services: String(input.MCS_Services || "").trim(),
      MCS_siteUrl: String(input.MCS_siteUrl || "").trim(),
      Phone: String(input.Phone || "").trim(),
      IsActive: true,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Business update failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update business",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!(await authorize(request, id))) {
      return NextResponse.json(
        { error: "Not your business." },
        { status: 403 },
      );
    }
    await write(id, "DELETE");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Business delete failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete business",
      },
      { status: 500 },
    );
  }
}
