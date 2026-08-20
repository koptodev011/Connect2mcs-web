import { NextRequest, NextResponse } from "next/server";
import { fetchModelRecord, getAuthToken } from "@/lib/idempiere";
import { verifyFavoriteUser } from "@/lib/favorite-session";

const API_URL =
  process.env.IDEMPIERE_API_URL || "http://15.207.222.86:8080/api/v1";
type Reference = { id?: number | string };
type MaidRecord = { AD_User_ID?: Reference | number | string };
const MAID_CATEGORY_CODES = new Set(["FT", "H", "L", "New", "PT", "Used"]);

function maidCategoryCode(value: unknown) {
  const reference =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : undefined;
  const candidates = reference
    ? [reference.id, reference.value, reference.Value, reference.identifier, reference.Name]
    : [value];
  const labels: Record<string, string> = {
    "full time": "FT",
    hourly: "H",
    "live in": "L",
    new: "New",
    "part time": "PT",
    used: "Used",
  };
  for (const candidate of candidates) {
    const text = String(candidate ?? "").trim();
    if (MAID_CATEGORY_CODES.has(text)) return text;
    const mapped = labels[text.toLowerCase()];
    if (mapped) return mapped;
  }
  return "";
}

function referenceId(value: Reference | number | string | undefined) {
  return Number(typeof value === "object" && value !== null ? value.id : value);
}

async function authorizeOwner(request: NextRequest, maidId: number) {
  const signedUserId = verifyFavoriteUser(
    request.cookies.get("mcs_favorite_user")?.value,
  );
  if (!signedUserId) {
    return {
      error: NextResponse.json(
        { error: "Please sign in again." },
        { status: 401 },
      ),
    };
  }
  const maid = (await fetchModelRecord("MCS_Maid", maidId)) as MaidRecord;
  if (referenceId(maid.AD_User_ID) !== signedUserId) {
    return {
      error: NextResponse.json(
        { error: "You can only change the maid profile you created." },
        { status: 403 },
      ),
    };
  }
  return { signedUserId };
}

async function upstream(
  method: "PUT" | "DELETE",
  maidId: number,
  body?: unknown,
) {
  const response = await fetch(`${API_URL}/models/MCS_Maid/${maidId}`, {
    method,
    headers: {
      Authorization: `Bearer ${await getAuthToken()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {}
  if (!response.ok) {
    return {
      error: NextResponse.json(
        {
          error: String(
            data.message ||
              data.error ||
              text ||
              `iDempiere returned ${response.status}`,
          ),
        },
        { status: response.status },
      ),
    };
  }
  return { data };
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const maidId = Number((await context.params).id);
    if (!maidId)
      return NextResponse.json({ error: "Invalid maid ID" }, { status: 400 });
    const authorization = await authorizeOwner(request, maidId);
    if (authorization.error) return authorization.error;
    const input = await request.json();
    const payload = {
      Name: String(input.Name || "").trim(),
      Phone: String(input.Phone || "").trim(),
      MCS_Maid_Category: maidCategoryCode(input.MCS_Maid_Category),
      MCS_Services: String(input.MCS_Services || "").trim(),
      MCS_ExperienceYears: Number(input.MCS_ExperienceYears),
      MCS_Rate: Number(input.MCS_Rate),
      C_Currency_ID: Number(input.C_Currency_ID?.id || input.C_Currency_ID),
      C_Country_ID: Number(input.C_Country_ID?.id || input.C_Country_ID),
      C_City_ID: Number(input.C_City_ID?.id || input.C_City_ID),
      MCS_Languages: String(input.MCS_Languages || "").trim(),
      Address: String(input.Address || "").trim(),
      MCS_About: String(input.MCS_About || "").trim(),
      AD_User_ID: authorization.signedUserId,
      IsActive: true,
    };
    if (
      !payload.MCS_Maid_Category ||
      !payload.MCS_Services ||
      !payload.C_Currency_ID ||
      !payload.C_Country_ID ||
      !payload.C_City_ID ||
      !payload.Address ||
      !payload.MCS_About
    ) {
      return NextResponse.json(
        { error: "Complete all required maid profile fields." },
        { status: 400 },
      );
    }
    const result = await upstream("PUT", maidId, payload);
    if (result.error) return result.error;
    return NextResponse.json(result.data);
  } catch (error) {
    console.error("MCS_Maid update failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update maid profile",
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
    const maidId = Number((await context.params).id);
    if (!maidId)
      return NextResponse.json({ error: "Invalid maid ID" }, { status: 400 });
    const authorization = await authorizeOwner(request, maidId);
    if (authorization.error) return authorization.error;
    const result = await upstream("DELETE", maidId);
    if (result.error) return result.error;
    return NextResponse.json({ success: true, id: maidId });
  } catch (error) {
    console.error("MCS_Maid delete failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not delete maid profile",
      },
      { status: 500 },
    );
  }
}
