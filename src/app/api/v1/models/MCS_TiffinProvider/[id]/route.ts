import { NextRequest, NextResponse } from "next/server";
import { fetchModelRecord, getAuthToken } from "@/lib/idempiere";
import { verifyFavoriteUser } from "@/lib/favorite-session";

const API_URL =
  process.env.IDEMPIERE_API_URL || "http://15.207.222.86:8080/api/v1";

type Reference = { id?: number | string };
type ProviderRecord = { AD_User_ID?: Reference | number | string };

function referenceId(value: Reference | number | string | undefined) {
  return Number(typeof value === "object" && value !== null ? value.id : value);
}

async function authorizeOwner(request: NextRequest, providerId: number) {
  const userId = verifyFavoriteUser(
    request.cookies.get("mcs_favorite_user")?.value,
  );
  if (!userId) {
    return {
      error: NextResponse.json(
        { error: "Please sign in again." },
        { status: 401 },
      ),
    };
  }

  const provider = (await fetchModelRecord(
    "MCS_TiffinProvider",
    providerId,
  )) as ProviderRecord;
  if (referenceId(provider.AD_User_ID) !== userId) {
    return {
      error: NextResponse.json(
        {
          error: "You can only change the tiffin provider profile you created.",
        },
        { status: 403 },
      ),
    };
  }

  return { userId };
}

async function upstream(
  method: "PUT" | "DELETE",
  providerId: number,
  body?: unknown,
) {
  const response = await fetch(
    `${API_URL}/models/MCS_TiffinProvider/${providerId}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    },
  );
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
    const providerId = Number((await context.params).id);
    if (!providerId) {
      return NextResponse.json(
        { error: "Invalid tiffin provider ID." },
        { status: 400 },
      );
    }

    const authorization = await authorizeOwner(request, providerId);
    if (authorization.error) return authorization.error;
    const input = await request.json();

    const payload = {
      AD_User_ID: authorization.userId,
      C_Country_ID: Number(input.C_Country_ID?.id || input.C_Country_ID),
      C_City_ID: Number(input.C_City_ID?.id || input.C_City_ID),
      C_Currency_ID: Number(input.C_Currency_ID?.id || input.C_Currency_ID),
      MCS_Tiffin_Category_ID: Number(
        input.MCS_Tiffin_Category_ID?.id || input.MCS_Tiffin_Category_ID,
      ),
      MCS_About: String(input.MCS_About || "").trim(),
      MCS_DeliveryInfo: String(input.MCS_DeliveryInfo || "").trim(),
      MCS_ExperienceYears: Number(input.MCS_ExperienceYears),
      MCS_IsVeg: input.MCS_IsVeg === true,
      MCS_Menu: String(input.MCS_Menu || "").trim(),
      MCS_PricePerMeal: Number(input.MCS_PricePerMeal),
      MCS_PricePerMonth: Number(input.MCS_PricePerMonth),
      MCS_Specialty: String(input.MCS_Specialty || "").trim(),
      MCS_ServiceDays: Number(input.MCS_ServiceDays),
      IsActive: true,
    };

    if (
      !payload.C_Country_ID ||
      !payload.C_City_ID ||
      !payload.C_Currency_ID ||
      !payload.MCS_Tiffin_Category_ID ||
      !payload.MCS_About ||
      !payload.MCS_DeliveryInfo ||
      !payload.MCS_Menu ||
      !payload.MCS_Specialty ||
      !Number.isFinite(payload.MCS_ExperienceYears) ||
      payload.MCS_ExperienceYears < 0 ||
      !Number.isFinite(payload.MCS_PricePerMeal) ||
      payload.MCS_PricePerMeal < 0 ||
      !Number.isFinite(payload.MCS_PricePerMonth) ||
      payload.MCS_PricePerMonth < 0 ||
      !Number.isInteger(payload.MCS_ServiceDays) ||
      payload.MCS_ServiceDays < 1
    ) {
      return NextResponse.json(
        { error: "Complete all required tiffin provider fields." },
        { status: 400 },
      );
    }

    const result = await upstream("PUT", providerId, payload);
    if (result.error) return result.error;
    return NextResponse.json(result.data);
  } catch (error) {
    console.error("MCS_TiffinProvider update failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update tiffin provider profile",
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
    const providerId = Number((await context.params).id);
    if (!providerId) {
      return NextResponse.json(
        { error: "Invalid tiffin provider ID." },
        { status: 400 },
      );
    }

    const authorization = await authorizeOwner(request, providerId);
    if (authorization.error) return authorization.error;
    const result = await upstream("DELETE", providerId);
    if (result.error) return result.error;
    return NextResponse.json({ success: true, id: providerId });
  } catch (error) {
    console.error("MCS_TiffinProvider delete failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not delete tiffin provider profile",
      },
      { status: 500 },
    );
  }
}
