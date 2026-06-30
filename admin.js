(function(){
  const loginScreen = document.getElementById('login-screen');
  const adminApp = document.getElementById('admin-app');

  // --- Login ---
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    const password = document.getElementById('adminPassword').value;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res.ok) {
        loginError.hidden = false;
        return;
      }
      showAdminApp();
    } catch (err) {
      loginError.hidden = false;
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    adminApp.hidden = true;
    loginScreen.hidden = false;
  });

  function showAdminApp() {
    loginScreen.hidden = true;
    adminApp.hidden = false;
    loadStats();
    loadContent();
    loadDonations();
  }

  // --- Tabs ---
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabPanels = {
    stats: document.getElementById('tab-stats'),
    content: document.getElementById('tab-content'),
    donations: document.getElementById('tab-donations')
  };
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      Object.entries(tabPanels).forEach(([key, el]) => {
        el.hidden = key !== btn.dataset.tab;
      });
    });
  });

  // --- Stats tab ---
  const goalAmountInput = document.getElementById('goalAmount');
  const raisedAmountInput = document.getElementById('raisedAmount');
  const supporterCountInput = document.getElementById('supporterCount');
  const deadlineInput = document.getElementById('deadline');
  const missingAmountPreview = document.getElementById('missingAmountPreview');
  const statsSaved = document.getElementById('statsSaved');

  function updateMissingPreview() {
    const goal = Number(goalAmountInput.value) || 0;
    const raised = Number(raisedAmountInput.value) || 0;
    const missing = Math.max(0, goal - raised);
    missingAmountPreview.textContent = missing.toLocaleString('hu-HU') + ' Ft';
  }
  goalAmountInput.addEventListener('input', updateMissingPreview);
  raisedAmountInput.addEventListener('input', updateMissingPreview);

  async function loadStats() {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) return;
    const data = await res.json();
    goalAmountInput.value = data.goal_amount;
    raisedAmountInput.value = data.raised_amount;
    supporterCountInput.value = data.supporter_count;
    deadlineInput.value = data.deadline || '';
    updateMissingPreview();
  }

  document.getElementById('statsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    statsSaved.hidden = true;
    const res = await fetch('/api/admin/stats', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_amount: Number(goalAmountInput.value),
        raised_amount: Number(raisedAmountInput.value),
        supporter_count: Number(supporterCountInput.value),
        deadline: deadlineInput.value || null
      })
    });
    if (res.ok) {
      statsSaved.hidden = false;
      updateMissingPreview();
    }
  });

  // --- Content tab ---
  const heroTitleInput = document.getElementById('heroTitleInput');
  const heroSubtitleInput = document.getElementById('heroSubtitleInput');
  const introShortInput = document.getElementById('introShortInput');
  const introLongInput = document.getElementById('introLongInput');
  const contentSaved = document.getElementById('contentSaved');
  const logoPreview = document.getElementById('logoPreview');
  const heroPreview = document.getElementById('heroPreview');

  async function loadContent() {
    const res = await fetch('/api/admin/content');
    if (!res.ok) return;
    const data = await res.json();
    heroTitleInput.value = data.hero_title || '';
    heroSubtitleInput.value = data.hero_subtitle || '';
    introShortInput.value = data.intro_short_text || '';
    introLongInput.value = data.intro_long_text || '';
    if (data.logo_url) logoPreview.src = data.logo_url;
    if (data.hero_image_url) heroPreview.src = data.hero_image_url;
  }

  document.getElementById('contentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    contentSaved.hidden = true;
    const res = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hero_title: heroTitleInput.value,
        hero_subtitle: heroSubtitleInput.value,
        intro_short_text: introShortInput.value,
        intro_long_text: introLongInput.value
      })
    });
    if (res.ok) contentSaved.hidden = false;
  });

  function setupImageUpload(inputId, target, statusId, previewEl) {
    const input = document.getElementById(inputId);
    const status = document.getElementById(statusId);
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      status.textContent = 'Feltöltés...';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('target', target);

      try {
        const res = await fetch('/api/admin/upload-image', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) {
          status.textContent = 'Hiba: ' + (data.error || 'ismeretlen hiba');
          return;
        }
        previewEl.src = data.url;
        status.textContent = 'Feltöltve.';
      } catch (err) {
        status.textContent = 'Hiba a feltöltés közben.';
      }
    });
  }
  setupImageUpload('logoFileInput', 'logo_url', 'logoUploadStatus', logoPreview);
  setupImageUpload('heroFileInput', 'hero_image_url', 'heroUploadStatus', heroPreview);

  // --- Donations tab ---
  let currentPage = 1;
  const PAGE_SIZE = 50;
  const donationsTableBody = document.getElementById('donationsTableBody');
  const donationsTotal = document.getElementById('donationsTotal');
  const pageIndicator = document.getElementById('pageIndicator');

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('hu-HU') + ' ' + d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  }

  async function loadDonations() {
    const res = await fetch(`/api/admin/donations?page=${currentPage}&limit=${PAGE_SIZE}`);
    if (!res.ok) return;
    const data = await res.json();

    donationsTableBody.innerHTML = '';
    data.items.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDate(row.created_at)}</td>
        <td>${row.last_name} ${row.first_name}</td>
        <td>${row.email}</td>
        <td>${Number(row.amount).toLocaleString('hu-HU')} Ft</td>
        <td>${row.frequency}</td>
        <td>${row.payment_method}</td>
        <td>${row.is_company ? row.company_name : '–'}</td>
        <td>${row.status}</td>
      `;
      donationsTableBody.appendChild(tr);
    });

    donationsTotal.textContent = `Összesen: ${data.total} jelentkezés`;
    const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    pageIndicator.textContent = `${currentPage} / ${totalPages}`;
  }

  document.getElementById('prevPageBtn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      loadDonations();
    }
  });
  document.getElementById('nextPageBtn').addEventListener('click', () => {
    currentPage += 1;
    loadDonations();
  });
  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    window.location.href = '/api/admin/donations/export';
  });

  // --- Boot ---
  (async function checkSession(){
    try {
      const res = await fetch('/api/admin/session');
      if (res.ok) {
        showAdminApp();
      }
    } catch (err) {
      // stay on login screen
    }
  })();
})();
