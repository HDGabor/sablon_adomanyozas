(function(){
  const PRESET_AMOUNTS = [3000, 5000, 10000];
  const VALID_FREQUENCIES = ['eseti', 'rendszeres'];

  const state = {
    amount: 10000,
    customAmount: null,
    frequency: 'rendszeres',
    paymentMethod: 'bankkartya'
  };

  const pageLanding = document.getElementById('page-landing');
  const pageCheckout = document.getElementById('page-checkout');

  // Amount selection
  const amountBtns = document.querySelectorAll('.amount-btn');
  const customWrap = document.getElementById('customAmountWrap');
  const customInput = document.getElementById('customAmount');

  function selectAmount(amount, customValue){
    const isPreset = PRESET_AMOUNTS.includes(amount);
    amountBtns.forEach(b => {
      b.classList.toggle('selected', isPreset ? Number(b.dataset.amount) === amount : b.dataset.amount === 'custom');
    });
    if (isPreset) {
      state.amount = amount;
      customWrap.hidden = true;
    } else {
      state.amount = 'custom';
      state.customAmount = customValue != null ? customValue : amount;
      customWrap.hidden = false;
      customInput.value = state.customAmount;
    }
  }

  function selectFrequency(freq){
    if (!VALID_FREQUENCIES.includes(freq)) return;
    state.frequency = freq;
    freqBtns.forEach(b => b.classList.toggle('selected', b.dataset.freq === freq));
  }

  amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      amountBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const val = btn.dataset.amount;
      if (val === 'custom') {
        state.amount = 'custom';
        customWrap.hidden = false;
        customInput.focus();
      } else {
        state.amount = Number(val);
        customWrap.hidden = true;
      }
    });
  });

  customInput.addEventListener('input', () => {
    state.customAmount = customInput.value;
  });

  // Frequency selection
  const freqBtns = document.querySelectorAll('.freq-btn');
  freqBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      freqBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.frequency = btn.dataset.freq;
    });
  });

  // Apply current state to the checkout form's selects
  function applyStateToCheckoutForm(){
    document.getElementById('freqSelect').value = state.frequency;
    const amountSelect = document.getElementById('amountSelect');
    const checkoutCustomWrap = document.getElementById('checkoutCustomAmountWrap');
    if (state.amount === 'custom') {
      amountSelect.value = 'custom';
      checkoutCustomWrap.hidden = false;
      document.getElementById('checkoutCustomAmount').value = state.customAmount || '';
    } else {
      amountSelect.value = String(state.amount);
      checkoutCustomWrap.hidden = true;
    }
  }

  function goToCheckout(updateUrl){
    pageLanding.hidden = true;
    pageCheckout.hidden = false;
    window.scrollTo({top:0, behavior:'instant'});
    applyStateToCheckoutForm();

    if (updateUrl) {
      const params = new URLSearchParams();
      params.set('osszeg', state.amount === 'custom' ? state.customAmount : state.amount);
      params.set('tipus', state.frequency);
      const newUrl = window.location.pathname + '?' + params.toString();
      window.history.pushState({}, '', newUrl);
    }
  }

  // Navigate to checkout
  const supportBtn = document.getElementById('supportBtn');
  supportBtn.addEventListener('click', () => goToCheckout(true));

  // Checkout page: amount select toggles custom field
  const amountSelect = document.getElementById('amountSelect');
  const checkoutCustomWrap = document.getElementById('checkoutCustomAmountWrap');
  amountSelect.addEventListener('change', () => {
    checkoutCustomWrap.hidden = amountSelect.value !== 'custom';
  });

  // Pre-fill from query params (?osszeg=5000&tipus=eseti) and jump straight to checkout
  (function applyQueryParams(){
    const params = new URLSearchParams(window.location.search);
    const osszeg = params.get('osszeg');
    const tipus = params.get('tipus');
    if (!osszeg && !tipus) return;

    if (tipus) selectFrequency(tipus);
    if (osszeg) {
      const numericAmount = Number(osszeg);
      if (Number.isFinite(numericAmount) && numericAmount > 0) {
        selectAmount(numericAmount, osszeg);
      }
    }
    goToCheckout(false);
  })();

  // Payment method toggle
  const paymentBtns = document.querySelectorAll('.payment-btn');
  paymentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      paymentBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.paymentMethod = btn.dataset.method;
    });
  });

  // Company toggle
  const companyBtns = document.querySelectorAll('[data-company]');
  const companyFields = document.getElementById('companyFields');
  const companyName = document.getElementById('companyName');
  const taxNumber = document.getElementById('taxNumber');
  let isCompanyState = false;
  companyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      companyBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      isCompanyState = btn.dataset.company === 'igen';
      companyFields.hidden = !isCompanyState;
      companyName.required = isCompanyState;
      taxNumber.required = isCompanyState;
    });
  });

  // Form submit
  const donationForm = document.getElementById('donationForm');
  const formError = document.getElementById('formError');
  const formSubmitBtn = document.getElementById('formSubmitBtn');
  const donationSuccess = document.getElementById('donationSuccess');

  donationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;

    const amount = state.amount === 'custom' ? Number(state.customAmount) : state.amount;
    const payload = {
      amount,
      frequency: state.frequency,
      paymentMethod: state.paymentMethod,
      lastName: document.getElementById('lastName').value,
      firstName: document.getElementById('firstName').value,
      email: document.getElementById('email').value,
      isCompany: isCompanyState,
      companyName: companyName.value,
      taxNumber: taxNumber.value,
      zip: document.getElementById('zip').value,
      city: document.getElementById('city').value,
      street: document.getElementById('street').value,
      phone: document.getElementById('phone').value,
      privacyConsent: document.getElementById('privacyConsent').checked
    };

    formSubmitBtn.disabled = true;
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        formError.textContent = 'Hiba történt a jelentkezés mentése közben. Kérjük, ellenőrizd az adataidat és próbáld újra.';
        formError.hidden = false;
        formSubmitBtn.disabled = false;
        return;
      }

      donationForm.hidden = true;
      donationSuccess.hidden = false;
    } catch (err) {
      formError.textContent = 'Hiba történt a jelentkezés mentése közben. Kérjük, próbáld újra.';
      formError.hidden = false;
      formSubmitBtn.disabled = false;
    }
  });

  // Load live stats/content from the backend, replacing the hardcoded fallback in place
  (function loadPublicContent(){
    fetch('/api/public/content')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        const { stats, content } = data;

        if (content.hero_title) document.getElementById('heroTitle').textContent = content.hero_title;
        if (content.hero_subtitle) document.getElementById('heroSubtitle').textContent = content.hero_subtitle;
        if (content.intro_short_text) document.getElementById('introShortText').textContent = content.intro_short_text;
        if (content.intro_long_text) document.getElementById('introLongText').innerHTML = content.intro_long_text;
        if (content.logo_url) {
          const logoImg = document.getElementById('logoImg');
          const footerLogoImg = document.getElementById('footerLogoImg');
          if (logoImg) logoImg.src = content.logo_url;
          if (footerLogoImg) footerLogoImg.src = content.logo_url;
        }
        if (content.hero_image_url) {
          const heroImg = document.getElementById('heroImg');
          if (heroImg) heroImg.src = content.hero_image_url;
        }

        if (stats) {
          const fmt = n => Number(n).toLocaleString('hu-HU') + ' Ft';
          document.getElementById('statGoal').textContent = fmt(stats.goal_amount);
          document.getElementById('statMissing').textContent = fmt(stats.missing_amount);
          document.getElementById('statSupporters').textContent = stats.supporter_count;
          if (stats.deadline) {
            const d = new Date(stats.deadline);
            document.getElementById('statDeadline').textContent =
              `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.`;
          }
          const pct = stats.goal_amount > 0
            ? Math.min(100, Math.max(0, ((stats.goal_amount - stats.missing_amount) / stats.goal_amount) * 100))
            : 0;
          document.getElementById('progressBarFill').style.width = pct + '%';
        }
      })
      .catch(() => { /* keep hardcoded fallback content */ });
  })();
})();
