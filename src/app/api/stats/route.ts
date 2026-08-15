import { NextResponse } from "next/server";

export async function GET() {
  // Simulate fetching business data for NexusCart
  return NextResponse.json({
    stats: [
      { value: 150, suffix: "+", label: "Stores powered" },
      { value: 98, suffix: "%", label: "Merchant retention" },
      { value: 12, suffix: "", label: "Years of platform stability" },
      { value: 40, suffix: "+", label: "Platform engineers" },
    ]
  });
}
