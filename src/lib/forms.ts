/**
 * Form delivery for a zero-backend app.
 *
 * Submissions POST straight to FormSubmit.co's AJAX endpoint, which forwards
 * them to contact@millersmarketinggroup.com. There is no server of our own in
 * the path, which is the point.
 *
 * Delivery NEVER gates the UI. The confirmation screen shows immediately and
 * the request runs alongside it — a flaky hotel wifi connection at an event
 * should not make an RSVP look like it failed.
 */

export type DeliveryStatus = "sent" | "pending" | "failed" | "skipped";

export interface DeliveryResult {
  status: DeliveryStatus;
  message?: string;
}

const RECIPIENT = "contact@millersmarketinggroup.com";

/**
 * Override with a FormSubmit alias token (recommended for production — it
 * keeps the inbox address out of the client bundle):
 *   NEXT_PUBLIC_FORMSUBMIT_ENDPOINT=https://formsubmit.co/ajax/abc123...
 * Set NEXT_PUBLIC_FORMS_DISABLED=true to run the app as a pure UI demo.
 */
const ENDPOINT =
  process.env.NEXT_PUBLIC_FORMSUBMIT_ENDPOINT ?? `https://formsubmit.co/ajax/${RECIPIENT}`;

const DISABLED = process.env.NEXT_PUBLIC_FORMS_DISABLED === "true";

const TIMEOUT_MS = 12_000;

export interface SubmitPayload {
  subject: string;
  fields: Record<string, string | number | undefined>;
}

export async function submitForm({ subject, fields }: SubmitPayload): Promise<DeliveryResult> {
  if (DISABLED) {
    return { status: "skipped", message: "Email delivery is turned off in this environment." };
  }

  const body: Record<string, string> = {
    _subject: subject,
    // FormSubmit shows a captcha page on the redirect flow; the AJAX flow needs
    // it off or the request resolves without ever reaching the inbox.
    _captcha: "false",
    _template: "table",
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === "") continue;
    body[key] = String(value);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { status: "failed", message: `Mail relay returned ${response.status}.` };
    }

    const data: unknown = await response.json().catch(() => null);
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : undefined;

    // FormSubmit returns 200 with a "confirm your email" message until the
    // recipient activates the address for the first time.
    if (message && /confirm/i.test(message)) {
      return { status: "pending", message };
    }

    return { status: "sent", message };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return { status: "failed", message: aborted ? "Request timed out." : "Network unavailable." };
  } finally {
    clearTimeout(timer);
  }
}
