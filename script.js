(function(){
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

  // Navigate to checkout
  const supportBtn = document.getElementById('supportBtn');
  supportBtn.addEventListener('click', () => {
    pageLanding.hidden = true;
    pageCheckout.hidden = false;
    window.scrollTo({top:0, behavior:'instant'});

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
  });

  // Checkout page: amount select toggles custom field
  const amountSelect = document.getElementById('amountSelect');
  const checkoutCustomWrap = document.getElementById('checkoutCustomAmountWrap');
  amountSelect.addEventListener('change', () => {
    checkoutCustomWrap.hidden = amountSelect.value !== 'custom';
  });

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
  companyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      companyBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const isCompany = btn.dataset.company === 'igen';
      companyFields.hidden = !isCompany;
      companyName.required = isCompany;
      taxNumber.required = isCompany;
    });
  });

  // Form submit
  document.getElementById('donationForm').addEventListener('submit', (e) => {
    e.preventDefault();
    // Adományozás indítása logikája később kerül kifejtésre
    alert('Adományozás indítása – a fizetési folyamat hamarosan elérhető lesz.');
  });
})();
