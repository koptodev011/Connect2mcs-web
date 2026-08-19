import { NextResponse } from "next/server";
import { fetchModel } from "@/lib/idempiere";

type CategoryRecord = {
  id: string | number;
  Name?: string;
  Value?: string;
  IsActive?: boolean;
};

export async function GET() {
  try {
    const categories = (await fetchModel(
      "MCS_Business_Category",
      "IsActive eq true",
      { top: 200, orderby: "Name" },
    )) as CategoryRecord[];

    const records = categories
      .filter(
        (category) => category.IsActive !== false && category.Name?.trim(),
      )
      .map((category) => ({
        id: String(category.id),
        Name: category.Name!.trim(),
        Value: String(category.Value || ""),
        IsActive: category.IsActive !== false,
      }));

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Business category fetch failed:", error);
    return NextResponse.json(
      { error: "Could not load business categories", records: [] },
      { status: 500 },
    );
  }
}
