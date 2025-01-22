import Razorpay from "razorpay";
import { generate as shortidGenerate } from "shortid";

// Initialize razorpay object
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_KEY,
});

export async function POST(request) {
  try {
    const { productId } = await request.json();
    const payment_capture = 1;

    // Use productId to determine amount (you should implement your own logic here)
    const amount = productId === "example_ebook" ? 100 : 1 * 100; // amount in paisa
    const currency = "INR";
    const options = {
      amount: amount.toString(),
      currency,
      receipt: shortidGenerate(),
      payment_capture,
      notes: {
        paymentFor: "example_ebook",
        userId: "user_id_here",
        productId: productId, // Using the productId from the request
      },
    };

    const order = await razorpay.orders.create(options);
    return new Response(JSON.stringify(order), { status: 200 });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return new Response(JSON.stringify({ error: "Failed to create order" }), {
      status: 500,
    });
  }
}
