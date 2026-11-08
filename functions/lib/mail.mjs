// Live email is sent only when the production HTTP adapter passes deps.fetch.
// Preview never selects a provider. Tests pass deps.fetch or deps.sendMail and do not touch the network.
const PLAIN_FROM = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/i;
const NAMED_FROM = /^[\w .'-]{1,60}<[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}>$/i;

export function validFrom(raw) {
  const from = String(raw || '').trim();
  if (!from || from.length > 120 || /[\r\n\0]/.test(from)) return '';
  if (PLAIN_FROM.test(from) || NAMED_FROM.test(from)) return from;
  return '';
}

// Resend wins when both providers are configured. A bad from-address is treated as not configured
// so we never hand a header-breaking From to a provider.
export function mailPlan(env, plane) {
  if (plane !== 'production') return {mode: 'disabled', reason: 'preview_mail_disabled'};
  const from = validFrom(env && env.NEWSLETTER_FROM);
  const resend = !!(env && env.RESEND_API_KEY);
  const postmark = !!(env && env.POSTMARK_SERVER_TOKEN);
  if (!from || (!resend && !postmark)) return {mode: 'unconfigured', reason: 'mailer_not_configured'};
  if (resend) return {mode: 'resend', from, reason: ''};
  return {mode: 'postmark', from, reason: ''};
}

export async function deliverMail(env, plane, message, deps = {}) {
  if (plane !== 'production') return {ok: false, reason: 'preview_mail_disabled'};
  if (typeof deps.sendMail === 'function') {
    try {
      const out = await deps.sendMail(message);
      if (out && out.ok) return {ok: true};
      return {ok: false, reason: (out && out.reason) || 'delivery_failed'};
    } catch {
      return {ok: false, reason: 'delivery_failed'};
    }
  }
  const plan = mailPlan(env, plane);
  if (plan.mode !== 'resend' && plan.mode !== 'postmark') return {ok: false, reason: plan.reason};
  if (typeof deps.fetch !== 'function') return {ok: false, reason: 'delivery_failed'};
  try {
    const res = plan.mode === 'resend'
      ? await deps.fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json'},
          body: JSON.stringify({
            from: plan.from,
            to: [message.to],
            subject: message.subject,
            text: message.text,
            headers: {
              'List-Unsubscribe': `<${message.unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }),
          signal: AbortSignal.timeout(8000),
        })
      : await deps.fetch('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: {Accept: 'application/json', 'Content-Type': 'application/json', 'X-Postmark-Server-Token': env.POSTMARK_SERVER_TOKEN},
          body: JSON.stringify({
            From: plan.from,
            To: message.to,
            Subject: message.subject,
            TextBody: message.text,
            MessageStream: 'outbound',
            Headers: [
              {Name: 'List-Unsubscribe', Value: `<${message.unsubscribeUrl}>`},
              {Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click'},
            ],
          }),
          signal: AbortSignal.timeout(8000),
        });
    if (!res || !res.ok) return {ok: false, reason: 'delivery_failed'};
    return {ok: true};
  } catch {
    return {ok: false, reason: 'delivery_failed'};
  }
}
