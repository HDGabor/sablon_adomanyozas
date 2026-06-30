const { getSupabaseClient } = require('./_lib/supabase');

const VALID_FREQUENCIES = ['eseti', 'rendszeres'];
const VALID_PAYMENT_METHODS = ['bankkartya', 'utalas'];
const MAX_AMOUNT = 50000000; // 50M Ft sanity ceiling
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const body = req.body || {};
  const {
    amount,
    frequency,
    paymentMethod,
    lastName,
    firstName,
    email,
    isCompany,
    companyName,
    taxNumber,
    zip,
    city,
    street,
    phone,
    privacyConsent
  } = body;

  const numericAmount = Number(amount);
  const errors = [];

  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > MAX_AMOUNT) {
    errors.push('amount');
  }
  if (!VALID_FREQUENCIES.includes(frequency)) errors.push('frequency');
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) errors.push('paymentMethod');
  if (!isNonEmptyString(lastName)) errors.push('lastName');
  if (!isNonEmptyString(firstName)) errors.push('firstName');
  if (!isNonEmptyString(email) || !EMAIL_RE.test(email.trim())) errors.push('email');
  if (privacyConsent !== true) errors.push('privacyConsent');

  const companyFlag = isCompany === true;
  if (companyFlag) {
    if (!isNonEmptyString(companyName)) errors.push('companyName');
    if (!isNonEmptyString(taxNumber)) errors.push('taxNumber');
  }

  if (errors.length > 0) {
    res.status(400).json({ error: 'validation_failed', fields: errors });
    return;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('donations')
      .insert({
        status: 'pending',
        amount: Math.round(numericAmount),
        frequency,
        payment_method: paymentMethod,
        last_name: lastName.trim(),
        first_name: firstName.trim(),
        email: email.trim(),
        is_company: companyFlag,
        company_name: companyFlag ? companyName.trim() : null,
        tax_number: companyFlag ? taxNumber.trim() : null,
        zip: isNonEmptyString(zip) ? zip.trim() : null,
        city: isNonEmptyString(city) ? city.trim() : null,
        street: isNonEmptyString(street) ? street.trim() : null,
        phone: isNonEmptyString(phone) ? phone.trim() : null,
        privacy_consent: true
      })
      .select('id')
      .single();

    if (error) throw error;

    res.status(201).json({ id: data.id });
  } catch (err) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
};
