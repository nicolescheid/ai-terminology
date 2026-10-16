// Outbound mail from Lexi to Nicole, via the Cloudflare Email Service
// send_email binding (EMAIL in wrangler.jsonc, restricted to lexi@).

export const LEXI_ADDRESS = "lexi@ai-terminology.com";
export const NICOLE_ADDRESS = "nicole.scheid@gmail.com";

// headers: only allow-listed ones (In-Reply-To, References, X-*). Returns
// { ok, messageId } or { ok:false, error, code }.
export async function sendToNicole(env, { subject, text, html, headers }) {
  if (!env.EMAIL) return { ok: false, error: "EMAIL binding not configured" };
  try {
    const res = await env.EMAIL.send({
      to: NICOLE_ADDRESS,
      from: { email: LEXI_ADDRESS, name: "Lexi" },
      replyTo: LEXI_ADDRESS,
      subject,
      text,
      html,
      ...(headers && Object.keys(headers).length ? { headers } : {})
    });
    return { ok: true, messageId: res?.messageId || null };
  } catch (err) {
    console.error("lexi-mail send failed", err.code, err.message);
    return { ok: false, error: err.message, code: err.code || null };
  }
}
