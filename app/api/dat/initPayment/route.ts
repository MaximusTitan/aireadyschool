import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID!,
  key_secret: process.env.RAZORPAY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();

    // Validate amount
    if (amount !== 299) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const payment = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return NextResponse.json({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
    });
  } catch (err) {
    console.error('Payment initialization error:', err);
    return NextResponse.json(
      { error: "Payment initialization failed" },
      { status: 500 }
    );
  }
}
