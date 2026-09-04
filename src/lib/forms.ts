/**
 * Form delivery.
 *
 * Submissions POST to this app's own `/api/contact` route, which relays them to
 * MMG's inbox through Resend. This replaced a direct client-side POST to
 * FormSubmit.co: that required the recipient to click an activation email
 * before anything was delivered, and until someone did, every RSVP was quietly
 * discarded.
 *
 * Going through our own route also keeps the destination address out of the
 * client bundle — it used to be baked into the endpoint URL.
 *
 * Delivery NEVER gates the UI. The confirmation screen shows immediately and
 * the request runs alongside it — flaky hotel wifi at an event should not make
 * an RSVP look like it failed.
 */

export type DeliveryStatus = "sent" | "failed" | "skipped";

export interface DeliveryResult {
  status: DeliveryStatus;
  message?: string;
}

const ENDPOINT = "/api/contact";

const TIMEOUT_MS = 12_000;

export interface SubmitPayload {
  subject: string;
  fields: Record<string, string | number | undefined>;
}

function isDeliveryStatus(value: unknown): value is DeliveryStatus {
  return value === "sent" || value === "failed" || value === "skipped";
}

export async function submitForm({ subject, fields }: SubmitPayload): Promise<DeliveryResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      // `website` is the honeypot: a real submission always leaves it empty.
      body: JSON.stringify({ subject, fields, website: "" }),
      signal: controller.signal,
    });

    const data: unknown = await response.json().catch(() => null);
    const status =
      data && typeof data === "object" && "status" in data
        ? (data as { status: unknown }).status
        : undefined;
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : undefined;

    if (response.ok && isDeliveryStatus(status)) {
      return { status, message };
    }

    return { status: "failed", message: message ?? `Mail relay returned ${response.status}.` };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return { status: "failed", message: aborted ? "Request timed out." : "Network unavailable." };
  } finally {
    clearTimeout(timer);
  }
}
