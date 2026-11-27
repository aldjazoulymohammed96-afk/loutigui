/**
 * Real notification providers. Nothing here simulates a delivery: when a
 * provider is not configured, calls fail explicitly with the missing keys.
 */

import type { PaymentProviderStatus } from "@/lib/payment-provider";

export type NotificationChannel = "SMS" | "EMAIL";

export interface ProviderStatus {
  configured: boolean;
  provider: string;
  missing: string[];
}

export interface NotificationStatus {
  sms: ProviderStatus;
  email: ProviderStatus;
  payments?: PaymentProviderStatus;
  checkedAt: string;
}

export interface SendNotificationInput {
  channel: NotificationChannel;
  to: string;
  toName?: string;
  text: string;
  subject?: string;
  html?: string;
}

export interface SendNotificationResult {
  ok: boolean;
  provider: string;
  providerMessageId?: string;
  configured: boolean;
  error?: string;
}

function env(name: string): string {
  return (process.env[name] || "").trim();
}

function missingKeys(names: string[]): string[] {
  return names.filter((name) => !env(name));
}

async function postJson(
  url: string,
  headers: Record<string, string>,
  body: string
): Promise<{ ok: boolean; status: number; json: Record<string, unknown> | null; messageId?: string; errorText: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    let json: Record<string, unknown> | null = null;
    try {
      json = (await res.json()) as Record<string, unknown> | null;
    } catch {
      // SendGrid answers 202 with an empty body.
    }
    return {
      ok: res.ok,
      status: res.status,
      json,
      messageId: res.headers.get("x-message-id") || undefined,
      errorText: json
        ? String(json.message || json.error || json.description || JSON.stringify(json)).slice(0, 300)
        : `HTTP ${res.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      json: null,
      errorText: error instanceof Error && error.name === "AbortError"
        ? "Délai dépassé lors de l'appel au fournisseur"
        : "Fournisseur injoignable",
    };
  } finally {
    clearTimeout(timer);
  }
}

export function getNotificationStatus(): NotificationStatus {
  const smsProvider = (env("SMS_PROVIDER") || (env("TWILIO_ACCOUNT_SID") ? "twilio" : "generic")).toLowerCase();
  const emailProvider = (
    env("EMAIL_PROVIDER") ||
    (env("RESEND_API_KEY") ? "resend" : env("BREVO_API_KEY") ? "brevo" : env("SENDGRID_API_KEY") ? "sendgrid" : "resend")
  ).toLowerCase();

  let smsMissing: string[];
  if (smsProvider === "twilio") {
    smsMissing = missingKeys(["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"]);
  } else {
    smsMissing = missingKeys(["SMS_GATEWAY_URL", "SMS_GATEWAY_FROM"]);
  }

  let emailMissing: string[];
  if (emailProvider === "sendgrid") {
    emailMissing = missingKeys(["SENDGRID_API_KEY", "EMAIL_FROM"]);
  } else if (emailProvider === "brevo") {
    emailMissing = missingKeys(["BREVO_API_KEY", "EMAIL_FROM"]);
  } else {
    emailMissing = missingKeys(["RESEND_API_KEY", "EMAIL_FROM"]);
  }

  return {
    sms: {
      configured: smsMissing.length === 0,
      provider: smsProvider === "twilio" ? "Twilio" : "Passerelle HTTP",
      missing: smsMissing,
    },
    email: {
      configured: emailMissing.length === 0,
      provider: emailProvider === "sendgrid" ? "SendGrid" : emailProvider === "brevo" ? "Brevo" : "Resend",
      missing: emailMissing,
    },
    checkedAt: new Date().toISOString(),
  };
}

function notConfigured(channel: NotificationChannel): SendNotificationResult {
  const status = getNotificationStatus();
  const side = status[channel.toLowerCase() as "sms" | "email"];
  return {
    ok: false,
    configured: false,
    provider: side.provider,
    error: `${side.provider} non configuré. Renseignez : ${side.missing.join(", ")} dans .env.local puis redémarrez le serveur.`,
  };
}

async function sendSms(input: SendNotificationInput): Promise<SendNotificationResult> {
  const status = getNotificationStatus().sms;
  if (!status.configured) return notConfigured("SMS");

  if (status.provider === "Twilio") {
    const sid = env("TWILIO_ACCOUNT_SID");
    const token = env("TWILIO_AUTH_TOKEN");
    const from = env("TWILIO_FROM_NUMBER");
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const result = await postJson(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
      {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      new URLSearchParams({ To: input.to, From: from, Body: input.text }).toString()
    );
    return {
      ok: result.ok && !!result.json?.sid,
      configured: true,
      provider: "Twilio",
      providerMessageId: typeof result.json?.sid === "string" ? result.json.sid : undefined,
      error: result.ok ? undefined : result.errorText,
    };
  }

  const apiKey = env("SMS_GATEWAY_API_KEY");
  const result = await postJson(
    env("SMS_GATEWAY_URL"),
    {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    JSON.stringify({ to: input.to, from: env("SMS_GATEWAY_FROM"), text: input.text })
  );
  const id = result.json?.id ?? result.json?.messageId ?? result.json?.reference;
  return {
    ok: result.ok,
    configured: true,
    provider: "Passerelle HTTP",
    providerMessageId: typeof id === "string" ? id : undefined,
    error: result.ok ? undefined : result.errorText,
  };
}

async function sendEmail(input: SendNotificationInput): Promise<SendNotificationResult> {
  const status = getNotificationStatus().email;
  if (!status.configured) return notConfigured("EMAIL");

  const from = env("EMAIL_FROM");
  const fromName = env("EMAIL_FROM_NAME") || "LOUTIGUI";
  const subject = input.subject || "Notification LOUTIGUI";
  const text = input.text;
  const html = input.html || `<p>${text.replace(/</g, "&lt;")}</p>`;
  const toName = input.toName || input.to;

  if (status.provider === "Resend") {
    const safeFromName = fromName.replace(/[<>\r\n]/g, "").trim();
    const result = await postJson(
      "https://api.resend.com/emails",
      {
        Authorization: `Bearer ${env("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      JSON.stringify({
        from: safeFromName ? `${safeFromName} <${from}>` : from,
        to: [input.to],
        subject,
        text,
        html,
      })
    );
    const id = result.json?.id;
    return {
      ok: result.ok,
      configured: true,
      provider: "Resend",
      providerMessageId: typeof id === "string" ? id : result.messageId,
      error: result.ok ? undefined : result.errorText,
    };
  }

  if (status.provider === "SendGrid") {
    const result = await postJson(
      "https://api.sendgrid.com/v3/mail/send",
      {
        Authorization: `Bearer ${env("SENDGRID_API_KEY")}`,
        "Content-Type": "application/json",
      },
      JSON.stringify({
        personalizations: [{ to: [{ email: input.to, name: toName }] }],
        from: { email: from, name: fromName },
        subject,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      })
    );
    return {
      ok: result.ok,
      configured: true,
      provider: "SendGrid",
      providerMessageId: result.messageId,
      error: result.ok ? undefined : result.errorText,
    };
  }

  const result = await postJson(
    "https://api.brevo.com/v3/smtp/email",
    {
      "api-key": env("BREVO_API_KEY"),
      "Content-Type": "application/json",
    },
    JSON.stringify({
      sender: { email: from, name: fromName },
      to: [{ email: input.to, name: toName }],
      subject,
      textContent: text,
      htmlContent: html,
    })
  );
  const id = result.json?.messageId;
  return {
    ok: result.ok,
    configured: true,
    provider: "Brevo",
    providerMessageId: typeof id === "string" ? id : undefined,
    error: result.ok ? undefined : result.errorText,
  };
}

export function sendNotification(input: SendNotificationInput): Promise<SendNotificationResult> {
  return input.channel === "SMS" ? sendSms(input) : sendEmail(input);
}
