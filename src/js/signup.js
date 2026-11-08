function messageFor(d, httpStatus) {
  d = d || {};
  if (d.status === 'confirm_sent' && d.emailSent === true) {
    return 'Check your email to confirm. You are not on the list until you confirm.';
  }
  if (d.status === 'saved_unsent' && d.emailSent !== true && d.reason === 'mailer_not_configured') {
    return 'We saved your request, but confirmation email is not set up yet. You are not on the list.';
  }
  if (d.status === 'saved_unsent' && d.emailSent !== true && d.reason === 'preview_mail_disabled') {
    return 'We saved your request on this preview, but preview deployments do not send email. You are not on the list.';
  }
  if (d.status === 'saved_unsent' && d.emailSent !== true) {
    return 'We saved your request, but the confirmation email could not be sent. You are not on the list. Try again later.';
  }
  if (d.status === 'already_confirmed' && d.onList === true && d.emailSent !== true) {
    return 'This email is already confirmed.';
  }
  if (d.status === 'already_pending_sent' && d.emailSent === true) {
    return 'This email is still waiting for confirmation. We sent another confirmation email.';
  }
  if (d.status === 'already_pending' && d.emailSent !== true) {
    return 'This email is still waiting for confirmation. You are not on the list yet.';
  }
  if (d.status === 'confirmed' && d.onList === true && d.emailSent !== true) {
    return 'You are confirmed for the weekly joulemath email. You were not on the list until now.';
  }
  if (d.status === 'unsubscribed' && d.onList !== true && d.emailSent !== true) {
    return 'You are unsubscribed. This address is not on the list.';
  }
  if (d.status === 'cancelled' && d.onList !== true && d.emailSent !== true) {
    return 'This request is cancelled. This address is not on the list.';
  }
  if (d.status === 'already_unsubscribed' && d.onList !== true && d.emailSent !== true) {
    return 'This address is already unsubscribed.';
  }
  if (d.status === 'invalid_email') return 'That email does not look right.';
  if (d.status === 'consent_required' && d.reason === 'consent_version') {
    return 'Refresh the page and submit the form again so your consent matches the current text.';
  }
  if (d.status === 'consent_required') return 'Check the box to confirm you want the weekly email.';
  if (d.status === 'invalid_token') return 'This link is invalid or expired.';
  if (d.status === 'rate_limited' || httpStatus === 429) return 'Too many attempts. Try again later.';
  if (d.status === 'preview_isolated') return 'This preview does not accept newsletter signups.';
  if (d.status === 'forbidden') return 'Open joulemath.com and use the signup form there.';
  if (d.status === 'unavailable') return 'Signup is unavailable right now. Try again later.';
  if (d.status === 'too_large' || d.status === 'bad_request') return 'That signup could not be read. Try again.';
  return 'Something went wrong. Nothing was confirmed. Try again later.';
}
/*end-messageFor*/

document.querySelectorAll('form.signup').forEach(f => f.addEventListener('submit', async e => {
  e.preventDefault();
  const m = f.querySelector('.signup-msg');
  const btn = f.querySelector('button[type=submit]');
  if (btn) btn.disabled = true;
  if (m) m.textContent = 'Sending...';
  try {
    const r = await fetch('/api/subscribe', {method: 'POST', body: new FormData(f), headers: {Accept: 'application/json'}});
    const d = await r.json().catch(() => ({}));
    if (m) m.textContent = messageFor(d, r.status);
    if (d && d.emailSent === true && (d.status === 'confirm_sent' || d.status === 'already_pending_sent')) f.reset();
    if (d && d.onList === true && d.status === 'already_confirmed') f.reset();
  } catch {
    if (m) m.textContent = messageFor({}, 0);
  } finally {
    if (btn) btn.disabled = false;
  }
}));
