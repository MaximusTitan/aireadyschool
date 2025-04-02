import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

  const text = `${razorpay_order_id}|${razorpay_payment_id}`;
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(text)
    .digest("hex");

  const isAuthentic = signature === razorpay_signature;

  return NextResponse.json({
    verified: isAuthentic,
  });
}
