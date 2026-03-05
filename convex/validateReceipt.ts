import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Apple receipt validation endpoints
const APPLE_PRODUCTION_URL = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";

interface AppleReceiptResponse {
  status: number;
  environment?: string;
  latest_receipt_info?: Array<{
    product_id: string;
    expires_date_ms: string;
    is_trial_period: string;
    original_transaction_id: string;
    purchase_date_ms: string;
  }>;
}

async function validateWithApple(
  receipt: string,
  useSandbox: boolean = false
): Promise<AppleReceiptResponse> {
  const url = useSandbox ? APPLE_SANDBOX_URL : APPLE_PRODUCTION_URL;
  const appSharedSecret = process.env.APPLE_SHARED_SECRET || "";

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "receipt-data": receipt,
      password: appSharedSecret,
      "exclude-old-transactions": true,
    }),
  });

  return await response.json();
}

export const validate = httpAction(async (ctx, request) => {
  try {
    const { receipt, userId } = await request.json();

    if (!receipt) {
      return new Response(
        JSON.stringify({ isValid: false, error: "No receipt provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Try production first
    let result = await validateWithApple(receipt, false);

    // Status 21007 means it's a sandbox receipt, retry with sandbox
    if (result.status === 21007) {
      result = await validateWithApple(receipt, true);
    }

    // Status 0 = valid
    if (result.status !== 0) {
      console.error("Apple receipt validation failed, status:", result.status);
      return new Response(
        JSON.stringify({ isValid: false, error: `Status ${result.status}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find the latest subscription info
    const latestReceipt = result.latest_receipt_info?.[0];
    if (!latestReceipt) {
      return new Response(
        JSON.stringify({ isValid: false, error: "No subscription found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const expiresAt = parseInt(latestReceipt.expires_date_ms);
    const isExpired = expiresAt < Date.now();
    const isTrialPeriod = latestReceipt.is_trial_period === "true";

    // Update subscription in database if userId provided
    if (userId && !isExpired) {
      await ctx.runMutation(internal.subscriptions.updateFromApple, {
        clerkId: userId,
        productId: latestReceipt.product_id,
        originalTransactionId: latestReceipt.original_transaction_id,
        expiresAt,
        isTrialPeriod,
        environment: result.environment || "Production",
      });
    }

    return new Response(
      JSON.stringify({
        isValid: !isExpired,
        expiresAt,
        productId: latestReceipt.product_id,
        isTrialPeriod,
        originalTransactionId: latestReceipt.original_transaction_id,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Receipt validation error:", error);
    return new Response(
      JSON.stringify({ isValid: false, error: "Validation failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
