import "server-only";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/env";
import { ORDER_STATUS_LABEL } from "@/lib/format";
import { SITE } from "@/lib/site";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

let client: Resend | undefined;

/**
 * Sends one email. Never throws: an email that can't be sent is logged, so it can't break the
 * order or payment it's about. Does nothing until RESEND_API_KEY and EMAIL_FROM are set.
 */
async function sendEmail(to: string, subject: string, text: string, html: string) {
  if (!isEmailConfigured()) return;
  try {
    client ??= new Resend(process.env.RESEND_API_KEY);
    const { error } = await client.emails.send({ from: process.env.EMAIL_FROM!, to, subject, text, html });
    if (error) console.error("Email not sent", { subject, error: error.message });
  } catch (err) {
    console.error("Email not sent", { subject, err });
  }
}

/**
 * Tells the customer about a change to their order, with a link to its page (the tracking link, so it
 * works for guests too). `message` is shown as written, e.g. the note a pharmacist posted.
 */
export async function emailOrderUpdate(orderId: string, message: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { email: true, customerName: true, reference: true, status: true, trackingToken: true },
  });
  if (!order) return;

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const link = `${site}/orders/${orderId}?token=${order.trackingToken}`;
  const status = ORDER_STATUS_LABEL[order.status];
  const firstName = order.customerName.split(" ")[0];
  const subject = `Your ${SITE.name} order ${order.reference}: ${status}`;

  const text = [`Hi ${firstName},`, "", message, "", `Order ${order.reference} · ${status}`, `View your order: ${link}`, "", `${SITE.legalName}`].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1f1d3d;max-width:520px">
<p>Hi ${escapeHtml(firstName)},</p>
<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
<p style="color:#6b6a80">Order ${escapeHtml(order.reference)} · ${escapeHtml(status)}</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#2a2556;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none">View your order</a></p>
<p style="color:#6b6a80;font-size:13px">${escapeHtml(SITE.legalName)}</p>
</div>`;

  await sendEmail(order.email, subject, text, html);
}
