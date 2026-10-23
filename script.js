/**
 * LifeDrop - Clean Blood Donor & Medical Inventory Management System
 * Blood-group tiles, donor registry, 56-day indicative eligibility calculation,
 * low-stock safety alerts, donation event logging, and privacy masking.
 */

(function () {
  'use strict';

  // Storage Keys
  const DONORS_KEY = 'lifedrop_donors_v1';
  const INVENTORY_KEY = 'lifedrop_inventory_v1';
  const EVENTS_KEY = 'lifedrop_events_v1';

  // Standard ABO/Rh blood groups
  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const MIN_SAFETY_STOCK = 5; // Low-stock threshold
  const ELIGIBILITY_CYCLE_DAYS = 56; // Standard whole blood rest cycle

  // Initial Sample Inventory (Simulated)
  const INITIAL_INVENTORY = {
    'O-': { units: 3, description: 'Universal RBC Donor (Emergency Trauma)', universal: 'Universal Donor' },
    'O+': { units: 14, description: 'High Demand Surgeries & Trauma', universal: null },
    'A+': { units: 18, description: 'Routine Surgical & Clinical Stock', universal: null },
    'A-': { units: 4, description: 'Rh-Negative RBC Compatible', universal: null },
    'B+': { units: 11, description: 'Hematology & Cancer Care', universal: null },
    'B-': { units: 5, description: 'Rare Group Reserve (Buffer Limit)', universal: null },
    'AB+': { units: 8, description: 'Universal RBC Recipient', universal: 'Universal Recipient' },
    'AB-': { units: 2, description: 'Ultra-Rare RBC / Universal Plasma', universal: null }
  };

  // Initial Sample Donors (Fictional)
  const INITIAL_DONORS = [
    {
      id: 'DON-2026-101',
      name: 'Dr. Samuel Vance',
      bloodGroup: 'A+',
      age: 32,
      phone: '+1 (555) 782-9014',
      email: 'samuel.vance@clinic.org',
      city: 'Northwood Metro',
      registeredAt: '2026-05-10',
      lastDonationDate: '2026-08-10', // ~74 days ago -> Eligible
      medicalNotes: 'Voluntary hospital staff donor; 14.2 g/dL Hb. Nil allergies.'
    },
    {
      id: 'DON-2026-102',
      name: 'Elena Rostova',
      bloodGroup: 'O-',
      age: 27,
      phone: '+1 (555) 438-9021',
      email: 'elena.rostova@health.net',
      city: 'Central Valley',
      registeredAt: '2026-06-12',
      lastDonationDate: '2026-10-05', // ~18 days ago -> Resting Period
      medicalNotes: 'Universal O- donor on emergency standby roster.'
    },
    {
      id: 'DON-2026-103',
      name: 'Marcus Brody',
      bloodGroup: 'B+',
      age: 35,
      phone: '+1 (555) 234-8890',
      email: 'm.brody@biotech.io',
      city: 'East Bay District',
      registeredAt: '2026-04-18',
      lastDonationDate: '2026-08-20', // ~64 days ago -> Eligible
      medicalNotes: 'Regular donor with 15.0 g/dL Hb. Excellent venous access.'
    },
    {
      id: 'DON-2026-104',
      name: 'Chloe Bennett',
      bloodGroup: 'O+',
      age: 24,
      phone: '+1 (555) 912-3341',
      email: 'c.bennett@apex.edu',
      city: 'South Shore',
      registeredAt: '2026-09-01',
      lastDonationDate: null, // First-time -> Eligible
      medicalNotes: 'First-time donor; pre-donation vitals screening approved.'
    },
    {
      id: 'DON-2026-105',
      name: 'Liam Sterling',
      bloodGroup: 'AB+',
      age: 29,
      phone: '+1 (555) 601-2299',
      email: 'l.sterling@design.org',
      city: 'Downtown Metro',
      registeredAt: '2026-03-14',
      lastDonationDate: '2026-07-28', // ~87 days ago -> Eligible
      medicalNotes: 'Universal plasma recipient profile; verified resting pulse 68 bpm.'
    },
    {
      id: 'DON-2026-106',
      name: 'Sophia Al-Mansoor',
      bloodGroup: 'A-',
      age: 31,
      phone: '+1 (555) 872-4019',
      email: 'sophia.m@research.ac',
      city: 'Hillcrest Health Park',
      registeredAt: '2026-06-20',
      lastDonationDate: '2026-09-22', // ~31 days ago -> Resting Period
      medicalNotes: 'Rh-negative donor. Scheduled for post-cycle follow up.'
    },
    {
      id: 'DON-2026-107',
      name: 'Kenji Takahashi',
      bloodGroup: 'B-',
      age: 26,
      phone: '+1 (555) 349-1120',
      email: 'kenji.t@techcore.jp',
      city: 'West Haven',
      registeredAt: '2026-05-30',
      lastDonationDate: '2026-07-20', // ~95 days ago -> Eligible
      medicalNotes: '14.5 g/dL Hb. Rare B- voluntary donor.'
    },
    {
      id: 'DON-2026-108',
      name: 'Derek Hoffman',
      bloodGroup: 'AB-',
      age: 40,
      phone: '+1 (555) 778-4509',
      email: 'derek.h@capital.com',
      city: 'Northwood Metro',
      registeredAt: '2026-07-15',
      lastDonationDate: '2026-10-11', // ~12 days ago -> Resting Period
      medicalNotes: 'AB- platelet/whole blood volunteer; well tolerated.'
    }
  ];

  // Initial Sample Donation Events Log
  const INITIAL_EVENTS = [
    {
      id: 'EVT-2026-094',
      donorId: 'DON-2026-102',
      donorName: 'Elena Rostova',
      bloodGroup: 'O-',
      units: 1,
      center: 'Central Metro Red Cross Blood Bank',
      date: '2026-10-05',
      vitalsNotes: '13.2 g/dL Hb, BP 118/76, 450 mL whole blood collected safely.'
    },
    {
      id: 'EVT-2026-093',
      donorId: 'DON-2026-108',
      donorName: 'Derek Hoffman',
      bloodGroup: 'AB-',
      units: 1,
      center: 'St. Jude Hospital Phlebotomy Unit',
      date: '2026-10-11',
      vitalsNotes: '14.8 g/dL Hb, BP 122/80, 450 mL unit banked in cold reserve.'
    },
    {
      id: 'EVT-2026-092',
      donorId: 'DON-2026-106',
      donorName: 'Sophia Al-Mansoor',
      bloodGroup: 'A-',
      units: 1,
      center: 'University Campus Blood Mobile Drive',
      date: '2026-09-22',
      vitalsNotes: '12.8 g/dL Hb, BP 114/72, hydration verified post-draw.'
    },
    {
      id: 'EVT-2026-091',
      donorId: 'DON-2026-101',
      donorName: 'Dr. Samuel Vance',
      bloodGroup: 'A+',
      units: 1,
      center: 'Downtown Community Donor Center',
      date: '2026-08-10',
      vitalsNotes: '14.2 g/dL Hb, BP 120/78, routine voluntary intake.'
    }
  ];

  // Application State
  let donors = [];
  let inventory = {};
  let events = [];
  let activeTab = 'dashboard';
  let activeFilterBloodGroup = 'ALL';
  let isPrivacyMaskActive = true;
  let activeDetailDonorId = null;

  // DOM Elements Map
  const dom = {
    // Navigation Tabs
    tabDashboard: document.getElementById('tabDashboard'),
    tabDonors: document.getElementById('tabDonors'),
    tabInventory: document.getElementById('tabInventory'),
    tabHistory: document.getElementById('tabHistory'),
    tabCompatibility: document.getElementById('tabCompatibility'),

    viewDashboard: document.getElementById('view-dashboard'),
    viewDonors: document.getElementById('view-donors'),
    viewInventory: document.getElementById('view-inventory'),
    viewHistory: document.getElementById('view-history'),
    viewCompatibility: document.getElementById('view-compatibility'),

    badgeDonorCount: document.getElementById('badgeDonorCount'),
    badgeLowStockCount: document.getElementById('badgeLowStockCount'),
    currentDateDisplay: document.getElementById('currentDateDisplay'),

    // Top Action Buttons
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    btnExportCSV: document.getElementById('btnExportCSV'),
    btnOpenRecordDonation: document.getElementById('btnOpenRecordDonation'),
    btnOpenRegisterDonor: document.getElementById('btnOpenRegisterDonor'),
    btnResetDemoData: document.getElementById('btnResetDemoData'),

    // Low Stock Alert Banner
    lowStockAlertBanner: document.getElementById('lowStockAlertBanner'),
    lowStockAlertMsg: document.getElementById('lowStockAlertMsg'),

    // KPIs
    kpiTotalDonors: document.getElementById('kpiTotalDonors'),
    kpiEligibleDonors: document.getElementById('kpiEligibleDonors'),
    kpiTotalUnits: document.getElementById('kpiTotalUnits'),
    kpiUnitsBreakdown: document.getElementById('kpiUnitsBreakdown'),
    kpiTotalDonations: document.getElementById('kpiTotalDonations'),

    // View 1: Dashboard
    bloodGroupTilesGrid: document.getElementById('bloodGroupTilesGrid'),
    dashRecentDonorsStream: document.getElementById('dashRecentDonorsStream'),
    dashRecentEventsStream: document.getElementById('dashRecentEventsStream'),

    // View 2: Donors Registry
    btnTogglePrivacyMask: document.getElementById('btnTogglePrivacyMask'),
    privacyMaskIcon: document.getElementById('privacyMaskIcon'),
    privacyMaskLabel: document.getElementById('privacyMaskLabel'),
    donorSearchInput: document.getElementById('donorSearchInput'),
    filterBloodGroup: document.getElementById('filterBloodGroup'),
    filterEligibility: document.getElementById('filterEligibility'),
    sortDonorsBy: document.getElementById('sortDonorsBy'),
    donorsCardsGrid: document.getElementById('donorsCardsGrid'),
    donorsEmptyState: document.getElementById('donorsEmptyState'),
    btnResetDonorFilters: document.getElementById('btnResetDonorFilters'),

    // View 3: Inventory
    inventoryTableBody: document.getElementById('inventoryTableBody'),

    // View 4: Events Log
    eventsTableBody: document.getElementById('eventsTableBody'),
    eventsEmptyState: document.getElementById('eventsEmptyState'),

    // Modal: Register Donor
    registerDonorModal: document.getElementById('registerDonorModal'),
    btnCloseRegisterModal: document.getElementById('btnCloseRegisterModal'),
    btnCancelRegisterModal: document.getElementById('btnCancelRegisterModal'),
    registerDonorForm: document.getElementById('registerDonorForm'),
    regDonorName: document.getElementById('regDonorName'),
    regBloodGroup: document.getElementById('regBloodGroup'),
    regAge: document.getElementById('regAge'),
    regPhone: document.getElementById('regPhone'),
    regEmail: document.getElementById('regEmail'),
    regCity: document.getElementById('regCity'),
    regLastDonationDate: document.getElementById('regLastDonationDate'),
    regMedicalNotes: document.getElementById('regMedicalNotes'),
    errRegDonorName: document.getElementById('errRegDonorName'),
    errRegBloodGroup: document.getElementById('errRegBloodGroup'),
    errRegAge: document.getElementById('errRegAge'),
    errRegPhone: document.getElementById('errRegPhone'),
    errRegEmail: document.getElementById('errRegEmail'),
    errRegCity: document.getElementById('errRegCity'),
    btnSubmitRegister: document.getElementById('btnSubmitRegister'),

    // Modal: Record Donation
    recordDonationModal: document.getElementById('recordDonationModal'),
    btnCloseRecordModal: document.getElementById('btnCloseRecordModal'),
    btnCancelRecordModal: document.getElementById('btnCancelRecordModal'),
    recordDonationForm: document.getElementById('recordDonationForm'),
    donationDonorSelect: document.getElementById('donationDonorSelect'),
    donationDate: document.getElementById('donationDate'),
    donationUnits: document.getElementById('donationUnits'),
    donationCenter: document.getElementById('donationCenter'),
    donorHemoglobin: document.getElementById('donorHemoglobin'),
    donorBloodPressure: document.getElementById('donorBloodPressure'),
    donationNotes: document.getElementById('donationNotes'),
    errDonationDonor: document.getElementById('errDonationDonor'),
    errDonationDate: document.getElementById('errDonationDate'),
    btnSubmitDonation: document.getElementById('btnSubmitDonation'),

    // Modal: Donor Detail
    donorDetailModal: document.getElementById('donorDetailModal'),
    btnCloseDetailModal: document.getElementById('btnCloseDetailModal'),
    btnCloseDetailFooter: document.getElementById('btnCloseDetailFooter'),
    btnDetailRecordDonation: document.getElementById('btnDetailRecordDonation'),
    detailBloodType: document.getElementById('detailBloodType'),
    detailDonorName: document.getElementById('detailDonorName'),
    detailDonorId: document.getElementById('detailDonorId'),
    detailEligibilityBadge: document.getElementById('detailEligibilityBadge'),
    detailLifetimeDonations: document.getElementById('detailLifetimeDonations'),
    detailLastDonation: document.getElementById('detailLastDonation'),
    detailNextEligibleHeading: document.getElementById('detailNextEligibleHeading'),
    detailNextEligibleText: document.getElementById('detailNextEligibleText'),
    detailPhone: document.getElementById('detailPhone'),
    detailEmail: document.getElementById('detailEmail'),
    detailCity: document.getElementById('detailCity'),
    detailAge: document.getElementById('detailAge'),
    detailDonationHistoryBody: document.getElementById('detailDonationHistoryBody'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  /**
   * System Initializer
   */
  function init() {
    loadData();
    renderHeaderDate();
    attachEventListeners();
    updateAllViews();
  }

  /**
   * Render Header Date
   */
  function renderHeaderDate() {
    const now = new Date();
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    if (dom.currentDateDisplay) {
      dom.currentDateDisplay.textContent = now.toLocaleDateString('en-US', options);
    }
  }

  /**
   * Load Data from LocalStorage or Defaults
   */
  function loadData() {
    try {
      const storedDonors = localStorage.getItem(DONORS_KEY);
      const storedInv = localStorage.getItem(INVENTORY_KEY);
      const storedEvts = localStorage.getItem(EVENTS_KEY);

      donors = storedDonors ? JSON.parse(storedDonors) : JSON.parse(JSON.stringify(INITIAL_DONORS));
      inventory = storedInv ? JSON.parse(storedInv) : JSON.parse(JSON.stringify(INITIAL_INVENTORY));
      events = storedEvts ? JSON.parse(storedEvts) : JSON.parse(JSON.stringify(INITIAL_EVENTS));

      if (!storedDonors || !storedInv || !storedEvts) {
        saveData();
      }
    } catch (e) {
      console.error('Data loading error:', e);
      donors = JSON.parse(JSON.stringify(INITIAL_DONORS));
      inventory = JSON.parse(JSON.stringify(INITIAL_INVENTORY));
      events = JSON.parse(JSON.stringify(INITIAL_EVENTS));
    }
  }

  /**
   * Save Data to LocalStorage
   */
  function saveData() {
    try {
      localStorage.setItem(DONORS_KEY, JSON.stringify(donors));
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
      localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Storage save error:', e);
      showToast('Storage capacity quota reached', 'crimson');
    }
  }

  /**
   * Calculate Indicative Eligibility for a Donor (56-Day Rule)
   */
  function calculateDonorEligibility(lastDonationDateStr) {
    if (!lastDonationDateStr) {
      return {
        isEligible: true,
        statusText: 'Eligible to Donate',
        badgeClass: 'eligible',
        remainingDays: 0,
        nextEligibleDateFormatted: 'Immediately (First-Time Donor)',
        explanation: 'No previous donation on record. First-time donor is eligible to donate.'
      };
    }

    const lastDate = new Date(lastDonationDateStr);
    if (isNaN(lastDate.getTime())) {
      return {
        isEligible: true,
        statusText: 'Eligible to Donate',
        badgeClass: 'eligible',
        remainingDays: 0,
        nextEligibleDateFormatted: 'Eligible Today',
        explanation: 'Rest cycle cleared.'
      };
    }

    const today = new Date();
    // Reset time components for clean day diff
    today.setHours(0, 0, 0, 0);
    const lastDay = new Date(lastDate);
    lastDay.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - lastDay.getTime();
    const elapsedDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (elapsedDays >= ELIGIBILITY_CYCLE_DAYS) {
      return {
        isEligible: true,
        statusText: 'Eligible to Donate',
        badgeClass: 'eligible',
        remainingDays: 0,
        nextEligibleDateFormatted: 'Eligible Today',
        explanation: `Rest cycle completed (${elapsedDays} days since last intake). Donor is medically cleared for donation.`
      };
    } else {
      const remainingDays = ELIGIBILITY_CYCLE_DAYS - elapsedDays;
      const nextDate = new Date(lastDay);
      nextDate.setDate(nextDate.getDate() + ELIGIBILITY_CYCLE_DAYS);

      return {
        isEligible: false,
        statusText: `Resting (${remainingDays}d left)`,
        badgeClass: 'resting',
        remainingDays: remainingDays,
        nextEligibleDateFormatted: formatDate(nextDate.toISOString().slice(0, 10)),
        explanation: `Indicative rule: 56 days of clinical rest required between whole blood donations. Eligible in ${remainingDays} day(s) on ${formatDate(nextDate.toISOString().slice(0, 10))}.`
      };
    }
  }

  /**
   * Master UI Refresh
   */
  function updateAllViews() {
    updateKPIs();
    renderBloodGroupTiles();
    renderDashboardRecentStreams();
    renderDonorsCards();
    renderInventoryTable();
    renderEventsTable();
    populateDonationDonorDropdown();
  }

  /**
   * Update KPI Summary & Low-Stock Alerts
   */
  function updateKPIs() {
    const totalDonors = donors.length;
    let eligibleCount = 0;

    donors.forEach(d => {
      const elig = calculateDonorEligibility(d.lastDonationDate);
      if (elig.isEligible) eligibleCount++;
    });

    let totalUnits = 0;
    const lowStockGroups = [];

    BLOOD_GROUPS.forEach(bg => {
      const item = inventory[bg] || { units: 0 };
      totalUnits += item.units;
      if (item.units <= MIN_SAFETY_STOCK) {
        lowStockGroups.push(`${bg} (${item.units} units)`);
      }
    });

    const totalDonations = events.length;

    if (dom.kpiTotalDonors) dom.kpiTotalDonors.textContent = totalDonors;
    if (dom.kpiEligibleDonors) dom.kpiEligibleDonors.textContent = eligibleCount;
    if (dom.kpiTotalUnits) dom.kpiTotalUnits.textContent = totalUnits;
    if (dom.kpiTotalDonations) dom.kpiTotalDonations.textContent = totalDonations;

    if (dom.badgeDonorCount) dom.badgeDonorCount.textContent = totalDonors;
    if (dom.badgeLowStockCount) {
      dom.badgeLowStockCount.textContent = `${lowStockGroups.length} Critical`;
      dom.badgeLowStockCount.className = `tab-badge ${lowStockGroups.length > 0 ? 'badge-crimson' : ''}`;
    }

    // Low Stock Alert Banner
    if (dom.lowStockAlertBanner) {
      if (lowStockGroups.length > 0) {
        dom.lowStockAlertBanner.classList.remove('hidden');
        if (dom.lowStockAlertMsg) {
          dom.lowStockAlertMsg.textContent = `CRITICAL LOW BUFFER: ${lowStockGroups.join(', ')} are at or below the minimum safety threshold (5 units). Please organize donor contact.`;
        }
      } else {
        dom.lowStockAlertBanner.classList.add('hidden');
      }
    }
  }

  /**
   * VIEW 1: Render 8 Blood Group Tiles
   */
  function renderBloodGroupTiles() {
    if (!dom.bloodGroupTilesGrid) return;

    dom.bloodGroupTilesGrid.innerHTML = BLOOD_GROUPS.map(bg => {
      const item = inventory[bg] || { units: 0, description: '', universal: null };
      const donorCount = donors.filter(d => d.bloodGroup === bg).length;
      const isLow = item.units <= MIN_SAFETY_STOCK;
      const isSelected = activeFilterBloodGroup === bg;

      return `
        <div class="blood-tile-card ${isSelected ? 'active-filter' : ''}" data-blood-group="${bg}" title="Click to filter donors by ${bg}">
          <div class="tile-drop-glyph">${bg}</div>
          <div class="tile-units-val">${item.units} Units</div>
          <div class="tile-units-sub">${donorCount} Donor${donorCount !== 1 ? 's' : ''} Listed</div>
          
          <div class="tile-status-pill ${isLow ? 'pill-low' : 'pill-safe'}">
            ${isLow ? 'Critical Low' : 'Buffer Safe'}
          </div>

          ${item.universal ? `<div class="tile-tag-universal">${item.universal}</div>` : ''}
        </div>
      `;
    }).join('');

    // Attach click listeners to tiles to trigger rapid filtering
    dom.bloodGroupTilesGrid.querySelectorAll('.blood-tile-card').forEach(tile => {
      tile.addEventListener('click', () => {
        const bg = tile.getAttribute('data-blood-group');
        if (activeFilterBloodGroup === bg) {
          activeFilterBloodGroup = 'ALL';
        } else {
          activeFilterBloodGroup = bg;
        }

        if (dom.filterBloodGroup) dom.filterBloodGroup.value = activeFilterBloodGroup;
        renderBloodGroupTiles();
        renderDonorsCards();
        switchTab('donors');
        showToast(`Filtered donors for Blood Group ${activeFilterBloodGroup}`, 'green');
      });
    });
  }

  /**
   * Render Recent Dashboard Activity Streams
   */
  function renderDashboardRecentStreams() {
    // Recent Donors Stream
    if (dom.dashRecentDonorsStream) {
      const recent = [...donors].slice(0, 4);
      if (recent.length === 0) {
        dom.dashRecentDonorsStream.innerHTML = '<span class="text-dim text-sm">No donors registered yet.</span>';
      } else {
        dom.dashRecentDonorsStream.innerHTML = recent.map(d => {
          const elig = calculateDonorEligibility(d.lastDonationDate);
          return `
            <div class="stream-card" data-donor-id="${escapeHTML(d.id)}">
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="blood-tile-mini">${escapeHTML(d.bloodGroup)}</span>
                <div>
                  <strong style="color:var(--slate-900);">${escapeHTML(d.name)}</strong>
                  <div style="font-size:0.72rem; color:var(--slate-500);">${escapeHTML(d.city)}</div>
                </div>
              </div>
              <span class="badge-eligibility ${elig.badgeClass}">${escapeHTML(elig.statusText)}</span>
            </div>
          `;
        }).join('');

        dom.dashRecentDonorsStream.querySelectorAll('.stream-card').forEach(c => {
          c.addEventListener('click', () => openDonorDetailModal(c.getAttribute('data-donor-id')));
        });
      }
    }

    // Recent Donation Events Stream
    if (dom.dashRecentEventsStream) {
      const recentEvents = [...events].slice(0, 4);
      if (recentEvents.length === 0) {
        dom.dashRecentEventsStream.innerHTML = '<span class="text-dim text-sm">No donation events recorded yet.</span>';
      } else {
        dom.dashRecentEventsStream.innerHTML = recentEvents.map(evt => `
          <div class="stream-card">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="blood-tile-mini">${escapeHTML(evt.bloodGroup)}</span>
              <div>
                <strong style="color:var(--slate-900);">${escapeHTML(evt.donorName)}</strong>
                <div style="font-size:0.72rem; color:var(--slate-500);">${escapeHTML(evt.center.split(' ')[0])} &bull; ${escapeHTML(evt.units)} Unit(s)</div>
              </div>
            </div>
            <span class="font-mono text-sm" style="color:var(--slate-500);">${escapeHTML(formatDate(evt.date))}</span>
          </div>
        `).join('');
      }
    }
  }

  /**
   * VIEW 2: Render Donors Cards Grid
   */
  function renderDonorsCards() {
    if (!dom.donorsCardsGrid) return;

    const searchTerm = dom.donorSearchInput ? dom.donorSearchInput.value.trim().toLowerCase() : '';
    const groupFilter = dom.filterBloodGroup ? dom.filterBloodGroup.value : activeFilterBloodGroup;
    const eligFilter = dom.filterEligibility ? dom.filterEligibility.value : 'ALL';
    const sortBy = dom.sortDonorsBy ? dom.sortDonorsBy.value : 'name_asc';

    const filtered = donors.filter(d => {
      if (groupFilter !== 'ALL' && d.bloodGroup !== groupFilter) return false;
      const elig = calculateDonorEligibility(d.lastDonationDate);
      if (eligFilter === 'ELIGIBLE' && !elig.isEligible) return false;
      if (eligFilter === 'RESTING' && elig.isEligible) return false;

      if (searchTerm) {
        const nMatch = d.name && d.name.toLowerCase().includes(searchTerm);
        const idMatch = d.id && d.id.toLowerCase().includes(searchTerm);
        const cMatch = d.city && d.city.toLowerCase().includes(searchTerm);
        const eMatch = d.email && d.email.toLowerCase().includes(searchTerm);
        const gMatch = d.bloodGroup && d.bloodGroup.toLowerCase().includes(searchTerm);
        if (!nMatch && !idMatch && !cMatch && !eMatch && !gMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'blood_group') return a.bloodGroup.localeCompare(b.bloodGroup);
      if (sortBy === 'id_desc') return b.id.localeCompare(a.id);
      if (sortBy === 'recent_donation') {
        const tA = a.lastDonationDate ? new Date(a.lastDonationDate).getTime() : 0;
        const tB = b.lastDonationDate ? new Date(b.lastDonationDate).getTime() : 0;
        return tB - tA;
      }
      return 0;
    });

    if (filtered.length === 0) {
      dom.donorsCardsGrid.innerHTML = '';
      if (dom.donorsEmptyState) dom.donorsEmptyState.classList.remove('hidden');
      return;
    }

    if (dom.donorsEmptyState) dom.donorsEmptyState.classList.add('hidden');

    dom.donorsCardsGrid.innerHTML = filtered.map(d => {
      const elig = calculateDonorEligibility(d.lastDonationDate);
      const displayPhone = isPrivacyMaskActive ? maskPhoneNumber(d.phone) : d.phone;

      // Count past donations
      const pastDonationsCount = events.filter(e => e.donorId === d.id).length;

      return `
        <div class="donor-card" data-donor-id="${escapeHTML(d.id)}">
          <div class="donor-card-header">
            <div class="donor-name-col">
              <h3>${escapeHTML(d.name)}</h3>
              <span class="donor-id-pill font-mono">${escapeHTML(d.id)} &bull; ${escapeHTML(d.city)}</span>
            </div>
            <div class="blood-type-badge">${escapeHTML(d.bloodGroup)}</div>
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span class="badge-eligibility ${elig.badgeClass}">
              ${elig.isEligible ? '&#9989; ' : '&#9203; '} ${escapeHTML(elig.statusText)}
            </span>
            <span style="font-size:0.75rem; color:var(--slate-500); font-weight:600;">
              ${pastDonationsCount} Past Donation${pastDonationsCount !== 1 ? 's' : ''}
            </span>
          </div>

          <!-- Contact & Vitals Box (Privacy Aware) -->
          <div class="donor-meta-box">
            <div class="meta-row">
              <span class="label">Contact:</span>
              <strong class="font-mono">${escapeHTML(displayPhone)}</strong>
            </div>
            <div class="meta-row">
              <span class="label">Email:</span>
              <span>${escapeHTML(d.email)}</span>
            </div>
            <div class="meta-row">
              <span class="label">Last Donation:</span>
              <span class="font-mono font-bold" style="color:var(--slate-800);">${d.lastDonationDate ? escapeHTML(formatDate(d.lastDonationDate)) : 'First-Time Donor'}</span>
            </div>
            ${!elig.isEligible ? `
              <div class="meta-row" style="color:var(--amber-600); font-weight:600;">
                <span class="label" style="color:var(--amber-600);">Next Eligible:</span>
                <span>${escapeHTML(elig.nextEligibleDateFormatted)}</span>
              </div>
            ` : ''}
          </div>

          <!-- Action Footer -->
          <div class="donor-card-footer">
            <button class="btn btn-secondary-crimson btn-sm btn-view-donor" data-donor-id="${escapeHTML(d.id)}">
              History & Timeline
            </button>
            <button class="btn btn-crimson btn-sm btn-quick-donate" data-donor-id="${escapeHTML(d.id)}">
              + Donate
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners
    dom.donorsCardsGrid.querySelectorAll('.btn-view-donor').forEach(b => {
      b.addEventListener('click', () => openDonorDetailModal(b.getAttribute('data-donor-id')));
    });

    dom.donorsCardsGrid.querySelectorAll('.btn-quick-donate').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-donor-id');
        openRecordDonationModal(id);
      });
    });
  }

  /**
   * Helper: Mask Phone Number for Privacy Protection
   */
  function maskPhoneNumber(phone) {
    if (!phone) return 'Confidential';
    // e.g. +1 (555) 782-9014 -> +1 (555) ***-9014
    return phone.replace(/(\d{3})[- ]?(\d{4})$/, '***-$2');
  }

  /**
   * VIEW 3: Render Blood Inventory Table
   */
  function renderInventoryTable() {
    if (!dom.inventoryTableBody) return;

    dom.inventoryTableBody.innerHTML = BLOOD_GROUPS.map(bg => {
      const item = inventory[bg] || { units: 0, description: '', universal: null };
      const donorCount = donors.filter(d => d.bloodGroup === bg).length;
      const isLow = item.units <= MIN_SAFETY_STOCK;
      const pct = Math.min(100, Math.round((item.units / 20) * 100));

      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="blood-tile-mini">${bg}</span>
              <strong style="color:var(--slate-900); font-size:1rem;">${bg}</strong>
            </div>
          </td>
          <td>
            <span>${escapeHTML(item.description)}</span>
          </td>
          <td>
            <div style="display:flex; flex-direction:column;">
              <strong class="font-mono" style="font-size:1.05rem; color:${isLow ? 'var(--crimson-600)' : 'var(--slate-900)'};">
                ${item.units} Units
              </strong>
              <div class="stock-meter-inline">
                <div class="stock-fill ${isLow ? 'fill-low' : 'fill-safe'}" style="width: ${pct}%;"></div>
              </div>
            </div>
          </td>
          <td>
            <span class="tile-status-pill ${isLow ? 'pill-low' : 'pill-safe'}" style="display:inline-block; width:auto;">
              ${isLow ? 'CRITICAL LOW' : 'BUFFER HEALTHY'}
            </span>
          </td>
          <td>
            <span class="font-mono font-bold">${donorCount} Registered</span>
          </td>
          <td>
            ${item.universal ? `<span class="badge-type">${item.universal}</span>` : '<span class="text-dim">Standard ABO/Rh</span>'}
          </td>
          <td class="text-right">
            <div class="flex-align-gap" style="justify-content:flex-end;">
              <button class="btn btn-secondary-crimson btn-sm btn-adjust-stock" data-bg="${bg}" data-delta="-1" title="Deduct unit for transfusion" ${item.units <= 0 ? 'disabled' : ''}>
                &minus; Transfuse
              </button>
              <button class="btn btn-crimson btn-sm btn-adjust-stock" data-bg="${bg}" data-delta="1" title="Simulate unit intake">
                &#43; Stock
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    dom.inventoryTableBody.querySelectorAll('.btn-adjust-stock').forEach(b => {
      b.addEventListener('click', () => {
        const bg = b.getAttribute('data-bg');
        const delta = parseInt(b.getAttribute('data-delta'), 10);
        adjustInventory(bg, delta);
      });
    });
  }

  /**
   * Adjust Inventory Stock Count
   */
  function adjustInventory(bloodGroup, delta) {
    if (!inventory[bloodGroup]) inventory[bloodGroup] = { units: 0 };
    const newCount = Math.max(0, inventory[bloodGroup].units + delta);
    inventory[bloodGroup].units = newCount;
    saveData();
    updateAllViews();
    showToast(`Inventory for ${bloodGroup} updated to ${newCount} units.`, newCount <= MIN_SAFETY_STOCK ? 'crimson' : 'green');
  }

  /**
   * VIEW 4: Render Donation Events Table
   */
  function renderEventsTable() {
    if (!dom.eventsTableBody) return;

    if (events.length === 0) {
      dom.eventsTableBody.innerHTML = '';
      if (dom.eventsEmptyState) dom.eventsEmptyState.classList.remove('hidden');
      return;
    }

    if (dom.eventsEmptyState) dom.eventsEmptyState.classList.add('hidden');

    dom.eventsTableBody.innerHTML = events.map(evt => `
      <tr>
        <td>
          <span class="font-mono text-crimson font-bold">${escapeHTML(evt.id)}</span>
        </td>
        <td>
          <strong style="color:var(--slate-900);">${escapeHTML(evt.donorName)}</strong>
        </td>
        <td>
          <span class="blood-tile-mini">${escapeHTML(evt.bloodGroup)}</span>
        </td>
        <td>
          <span class="font-mono font-bold">${escapeHTML(String(evt.units))} Unit (${evt.units * 450} mL)</span>
        </td>
        <td>
          <span>${escapeHTML(evt.center)}</span>
        </td>
        <td>
          <span style="font-size:0.78rem; color:var(--slate-600);">${escapeHTML(evt.vitalsNotes || 'Routine phlebotomy')}</span>
        </td>
        <td class="font-mono text-sm">${escapeHTML(formatDate(evt.date))}</td>
      </tr>
    `).join('');
  }

  /**
   * Tab Navigation Switcher
   */
  window.switchTab = function (tabId) {
    activeTab = tabId;

    [dom.tabDashboard, dom.tabDonors, dom.tabInventory, dom.tabHistory, dom.tabCompatibility].forEach(t => {
      if (t) t.classList.remove('active');
    });

    [dom.viewDashboard, dom.viewDonors, dom.viewInventory, dom.viewHistory, dom.viewCompatibility].forEach(p => {
      if (p) p.classList.remove('active');
    });

    if (tabId === 'dashboard') {
      if (dom.tabDashboard) dom.tabDashboard.classList.add('active');
      if (dom.viewDashboard) dom.viewDashboard.classList.add('active');
      renderBloodGroupTiles();
      renderDashboardRecentStreams();
    } else if (tabId === 'donors') {
      if (dom.tabDonors) dom.tabDonors.classList.add('active');
      if (dom.viewDonors) dom.viewDonors.classList.add('active');
      renderDonorsCards();
    } else if (tabId === 'inventory') {
      if (dom.tabInventory) dom.tabInventory.classList.add('active');
      if (dom.viewInventory) dom.viewInventory.classList.add('active');
      renderInventoryTable();
    } else if (tabId === 'history') {
      if (dom.tabHistory) dom.tabHistory.classList.add('active');
      if (dom.viewHistory) dom.viewHistory.classList.add('active');
      renderEventsTable();
    } else if (tabId === 'compatibility') {
      if (dom.tabCompatibility) dom.tabCompatibility.classList.add('active');
      if (dom.viewCompatibility) dom.viewCompatibility.classList.add('active');
    }
  };

  /**
   * MODAL 1: Register Voluntary Donor
   */
  window.openRegisterDonorModal = function () {
    resetRegisterForm();
    if (dom.registerDonorModal) {
      dom.registerDonorModal.classList.add('open');
      if (dom.regDonorName) dom.regDonorName.focus();
    }
  };

  function closeRegisterDonorModal() {
    if (dom.registerDonorModal) dom.registerDonorModal.classList.remove('open');
    resetRegisterForm();
  }

  function resetRegisterForm() {
    if (!dom.registerDonorForm) return;
    dom.registerDonorForm.reset();
    [
      dom.errRegDonorName, dom.errRegBloodGroup, dom.errRegAge,
      dom.errRegPhone, dom.errRegEmail, dom.errRegCity
    ].forEach(el => { if (el) el.textContent = ''; });
    document.querySelectorAll('.form-group.has-error').forEach(g => g.classList.remove('has-error'));
  }

  function handleRegisterSubmit(e) {
    e.preventDefault();
    [
      dom.errRegDonorName, dom.errRegBloodGroup, dom.errRegAge,
      dom.errRegPhone, dom.errRegEmail, dom.errRegCity
    ].forEach(el => { if (el) el.textContent = ''; });

    const name = dom.regDonorName ? dom.regDonorName.value.trim() : '';
    const bloodGroup = dom.regBloodGroup ? dom.regBloodGroup.value : '';
    const age = dom.regAge ? parseInt(dom.regAge.value, 10) : 0;
    const phone = dom.regPhone ? dom.regPhone.value.trim() : '';
    const email = dom.regEmail ? dom.regEmail.value.trim() : '';
    const city = dom.regCity ? dom.regCity.value.trim() : '';
    const lastDate = dom.regLastDonationDate && dom.regLastDonationDate.value ? dom.regLastDonationDate.value : null;
    const notes = dom.regMedicalNotes ? dom.regMedicalNotes.value.trim() : '';

    let isValid = true;

    if (!name || name.length < 2) {
      dom.errRegDonorName.textContent = 'Please provide full legal name of donor.';
      dom.regDonorName.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    if (!bloodGroup) {
      dom.errRegBloodGroup.textContent = 'Please specify verified blood group.';
      dom.regBloodGroup.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    if (isNaN(age) || age < 18 || age > 65) {
      dom.errRegAge.textContent = 'Donor must be between 18 and 65 years old for safety.';
      dom.regAge.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    if (!phone || phone.length < 7) {
      dom.errRegPhone.textContent = 'Please provide a valid contact phone number.';
      dom.regPhone.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      dom.errRegEmail.textContent = 'Please enter a valid email address.';
      dom.regEmail.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    if (!city || city.length < 2) {
      dom.errRegCity.textContent = 'Please enter donor city / metropolitan area.';
      dom.regCity.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    if (!isValid) return;

    // Generate Donor ID: DON-2026-XXX
    const nextSeq = 100 + donors.length + 1;
    const newDonor = {
      id: `DON-2026-${nextSeq}`,
      name: name,
      bloodGroup: bloodGroup,
      age: age,
      phone: phone,
      email: email,
      city: city,
      registeredAt: new Date().toISOString().slice(0, 10),
      lastDonationDate: lastDate,
      medicalNotes: notes || 'Voluntary donor registered. Initial physical screening passed.'
    };

    donors.unshift(newDonor);
    saveData();
    closeRegisterDonorModal();
    updateAllViews();
    showToast(`Registered donor ${name} (${bloodGroup})!`, 'green');

    // Switch to donors tab
    window.switchTab('donors');
  }

  /**
   * MODAL 2: Record Donation Event
   */
  window.openRecordDonationModal = function (preselectedDonorId) {
    resetRecordDonationForm();
    populateDonationDonorDropdown();

    if (preselectedDonorId && dom.donationDonorSelect) {
      dom.donationDonorSelect.value = preselectedDonorId;
    }

    // Default today's date
    if (dom.donationDate) {
      dom.donationDate.value = new Date().toISOString().slice(0, 10);
    }

    if (dom.recordDonationModal) {
      dom.recordDonationModal.classList.add('open');
    }
  };

  function closeRecordDonationModal() {
    if (dom.recordDonationModal) dom.recordDonationModal.classList.remove('open');
    resetRecordDonationForm();
  }

  function resetRecordDonationForm() {
    if (!dom.recordDonationForm) return;
    dom.recordDonationForm.reset();
    [dom.errDonationDonor, dom.errDonationDate].forEach(el => { if (el) el.textContent = ''; });
    document.querySelectorAll('.form-group.has-error').forEach(g => g.classList.remove('has-error'));
  }

  function populateDonationDonorDropdown() {
    if (!dom.donationDonorSelect) return;

    let html = '<option value="">-- Choose Registered Donor --</option>';

    donors.forEach(d => {
      const elig = calculateDonorEligibility(d.lastDonationDate);
      const tag = elig.isEligible ? '[Eligible]' : `[Resting: ${elig.remainingDays}d left]`;
      html += `
        <option value="${escapeHTML(d.id)}">
          ${escapeHTML(d.name)} &bull; ${escapeHTML(d.bloodGroup)} &bull; ${escapeHTML(d.id)} ${tag}
        </option>
      `;
    });

    dom.donationDonorSelect.innerHTML = html;
  }

  function handleDonationSubmit(e) {
    e.preventDefault();
    [dom.errDonationDonor, dom.errDonationDate].forEach(el => { if (el) el.textContent = ''; });

    const donorId = dom.donationDonorSelect ? dom.donationDonorSelect.value : '';
    const date = dom.donationDate ? dom.donationDate.value : '';
    const units = dom.donationUnits ? parseInt(dom.donationUnits.value, 10) : 1;
    const center = dom.donationCenter ? dom.donationCenter.value : 'Central Metro Red Cross Blood Bank';
    const hb = dom.donorHemoglobin ? dom.donorHemoglobin.value.trim() : '';
    const bp = dom.donorBloodPressure ? dom.donorBloodPressure.value.trim() : '';
    const notes = dom.donationNotes ? dom.donationNotes.value.trim() : '';

    let isValid = true;

    if (!donorId) {
      dom.errDonationDonor.textContent = 'Please choose a donor from the registry.';
      dom.donationDonorSelect.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    if (!date) {
      dom.errDonationDate.textContent = 'Please select donation date.';
      dom.donationDate.closest('.form-group').classList.add('has-error');
      isValid = false;
    }

    if (!isValid) return;

    const donor = donors.find(d => d.id === donorId);
    if (!donor) return;

    // Check indicative eligibility warning
    const elig = calculateDonorEligibility(donor.lastDonationDate);
    if (!elig.isEligible) {
      const proceed = confirm(`Note: Donor ${donor.name} is currently in a 56-day rest cycle (${elig.remainingDays} days remaining). Do you want to record this donation under exceptional clinical protocol?`);
      if (!proceed) return;
    }

    // 1. Create Event Record
    const nextEventSeq = 100 + events.length + 1;
    const vitalsStr = [
      hb ? `Hb: ${hb}` : '',
      bp ? `BP: ${bp}` : '',
      notes || 'Standard whole blood collection procedure completed.'
    ].filter(Boolean).join('; ');

    const newEvent = {
      id: `EVT-2026-${nextEventSeq}`,
      donorId: donor.id,
      donorName: donor.name,
      bloodGroup: donor.bloodGroup,
      units: units,
      center: center,
      date: date,
      vitalsNotes: vitalsStr
    };

    events.unshift(newEvent);

    // 2. Update Donor's Last Donation Date (resets 56-day clock)
    donor.lastDonationDate = date;

    // 3. Increment Inventory for that Blood Group
    if (!inventory[donor.bloodGroup]) {
      inventory[donor.bloodGroup] = { units: 0, description: 'Blood Reserve', universal: null };
    }
    inventory[donor.bloodGroup].units += units;

    saveData();
    closeRecordDonationModal();
    updateAllViews();

    showToast(`Recorded ${units} unit(s) of ${donor.bloodGroup} from ${donor.name}!`, 'green');
    window.switchTab('history');
  }

  /**
   * MODAL 3: Donor Detail & History Timeline
   */
  function openDonorDetailModal(donorId) {
    const donor = donors.find(d => d.id === donorId);
    if (!donor) return;

    activeDetailDonorId = donorId;
    const elig = calculateDonorEligibility(donor.lastDonationDate);
    const donorEvents = events.filter(e => e.donorId === donor.id);
    const totalUnits = donorEvents.reduce((sum, e) => sum + (e.units || 1), 0);

    if (dom.detailBloodType) dom.detailBloodType.textContent = donor.bloodGroup;
    if (dom.detailDonorName) dom.detailDonorName.textContent = donor.name;
    if (dom.detailDonorId) dom.detailDonorId.textContent = `${donor.id} • Registered: ${formatDate(donor.registeredAt)}`;

    if (dom.detailEligibilityBadge) {
      dom.detailEligibilityBadge.className = `badge-eligibility ${elig.badgeClass}`;
      dom.detailEligibilityBadge.textContent = elig.statusText;
    }

    if (dom.detailLifetimeDonations) dom.detailLifetimeDonations.textContent = `${totalUnits} Unit${totalUnits !== 1 ? 's' : ''}`;
    if (dom.detailLastDonation) {
      dom.detailLastDonation.textContent = donor.lastDonationDate ? formatDate(donor.lastDonationDate) : 'First-Time Donor';
    }

    // Eligibility Callout
    if (dom.detailNextEligibleHeading) {
      dom.detailNextEligibleHeading.textContent = elig.isEligible ? 'Indicative Eligibility Cleared (56-Day Rule):' : 'Resting Cycle in Progress (56-Day Rule):';
    }
    if (dom.detailNextEligibleText) {
      dom.detailNextEligibleText.textContent = elig.explanation;
    }

    const calcBox = document.querySelector('.eligibility-calc-box');
    if (calcBox) {
      calcBox.className = `eligibility-calc-box mb-3 ${elig.isEligible ? '' : 'box-resting'}`;
    }

    if (dom.detailPhone) dom.detailPhone.textContent = donor.phone;
    if (dom.detailEmail) dom.detailEmail.textContent = donor.email;
    if (dom.detailCity) dom.detailCity.textContent = donor.city;
    if (dom.detailAge) dom.detailAge.textContent = `Age: ${donor.age} Years`;

    // Past Donation History
    if (dom.detailDonationHistoryBody) {
      if (donorEvents.length === 0) {
        dom.detailDonationHistoryBody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align:center; color:var(--slate-500); padding:16px;">
              No past donations recorded yet for this donor.
            </td>
          </tr>
        `;
      } else {
        dom.detailDonationHistoryBody.innerHTML = donorEvents.map(e => `
          <tr>
            <td class="font-mono text-sm">${escapeHTML(formatDate(e.date))}</td>
            <td class="font-mono font-bold">${escapeHTML(String(e.units))} Unit</td>
            <td>${escapeHTML(e.center)}</td>
            <td style="font-size:0.78rem;">${escapeHTML(e.vitalsNotes)}</td>
          </tr>
        `).join('');
      }
    }

    if (dom.donorDetailModal) dom.donorDetailModal.classList.add('open');
  }

  function closeDonorDetailModal() {
    if (dom.donorDetailModal) dom.donorDetailModal.classList.remove('open');
    activeDetailDonorId = null;
  }

  /**
   * Toggle Contact Masking for Donor Privacy
   */
  function toggleContactMasking() {
    isPrivacyMaskActive = !isPrivacyMaskActive;
    if (dom.privacyMaskLabel) {
      dom.privacyMaskLabel.textContent = isPrivacyMaskActive ? 'Reveal Contact Numbers' : 'Mask Contact Numbers';
    }
    if (dom.privacyMaskIcon) {
      dom.privacyMaskIcon.innerHTML = isPrivacyMaskActive ? '&#128065;' : '&#128584;';
    }
    renderDonorsCards();
    showToast(isPrivacyMaskActive ? 'Contact numbers masked for privacy' : 'Contact numbers revealed for clinical staff', 'green');
  }

  /**
   * Export Donors & Events to CSV
   */
  function exportToCSV() {
    if (donors.length === 0) {
      showToast('No donors available to export', 'crimson');
      return;
    }

    const headers = [
      'Donor ID',
      'Full Name',
      'Blood Group',
      'Age',
      'Phone',
      'Email',
      'City',
      'Registration Date',
      'Last Donation Date',
      'Eligibility Status',
      'Notes'
    ];

    const rows = donors.map(d => {
      const elig = calculateDonorEligibility(d.lastDonationDate);
      return [
        escapeCSV(d.id),
        escapeCSV(d.name),
        escapeCSV(d.bloodGroup),
        d.age,
        escapeCSV(d.phone),
        escapeCSV(d.email),
        escapeCSV(d.city),
        escapeCSV(d.registeredAt),
        escapeCSV(d.lastDonationDate || 'None'),
        escapeCSV(elig.statusText),
        escapeCSV(d.medicalNotes || '')
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `lifedrop-donors-registry-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported ${donors.length} donor records to CSV`, 'green');
  }

  function escapeCSV(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * Reset Demo Data
   */
  function resetDemoData() {
    const confirmReset = confirm('Reset LifeDrop database to default sample donors, blood inventory, and donation events?');
    if (!confirmReset) return;

    donors = JSON.parse(JSON.stringify(INITIAL_DONORS));
    inventory = JSON.parse(JSON.stringify(INITIAL_INVENTORY));
    events = JSON.parse(JSON.stringify(INITIAL_EVENTS));
    activeFilterBloodGroup = 'ALL';

    saveData();
    updateAllViews();
    showToast('LifeDrop sample records restored to initial state', 'green');
  }

  /**
   * Toast Notification Helper
   */
  function showToast(message, type = 'green') {
    if (!dom.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast-item ${type === 'crimson' ? 'toast-crimson' : 'toast-green'}`;
    toast.textContent = message;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, 3200);
  }

  function formatDate(isoDate) {
    if (!isoDate) return 'N/A';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Event Listeners Registration
   */
  function attachEventListeners() {
    // Navigation Tabs
    if (dom.tabDashboard) dom.tabDashboard.addEventListener('click', () => switchTab('dashboard'));
    if (dom.tabDonors) dom.tabDonors.addEventListener('click', () => switchTab('donors'));
    if (dom.tabInventory) dom.tabInventory.addEventListener('click', () => switchTab('inventory'));
    if (dom.tabHistory) dom.tabHistory.addEventListener('click', () => switchTab('history'));
    if (dom.tabCompatibility) dom.tabCompatibility.addEventListener('click', () => switchTab('compatibility'));

    // Top Action Buttons
    if (dom.btnExportCSV) dom.btnExportCSV.addEventListener('click', exportToCSV);
    if (dom.btnOpenRegisterDonor) dom.btnOpenRegisterDonor.addEventListener('click', openRegisterDonorModal);
    if (dom.btnOpenRecordDonation) dom.btnOpenRecordDonation.addEventListener('click', () => openRecordDonationModal());
    if (dom.btnResetDemoData) dom.btnResetDemoData.addEventListener('click', resetDemoData);

    // Privacy Mask Toggle
    if (dom.btnTogglePrivacyMask) dom.btnTogglePrivacyMask.addEventListener('click', toggleContactMasking);

    // Register Modal Controls
    if (dom.btnCloseRegisterModal) dom.btnCloseRegisterModal.addEventListener('click', closeRegisterDonorModal);
    if (dom.btnCancelRegisterModal) dom.btnCancelRegisterModal.addEventListener('click', closeRegisterDonorModal);
    if (dom.registerDonorForm) dom.registerDonorForm.addEventListener('submit', handleRegisterSubmit);

    // Record Donation Modal Controls
    if (dom.btnCloseRecordModal) dom.btnCloseRecordModal.addEventListener('click', closeRecordDonationModal);
    if (dom.btnCancelRecordModal) dom.btnCancelRecordModal.addEventListener('click', closeRecordDonationModal);
    if (dom.recordDonationForm) dom.recordDonationForm.addEventListener('submit', handleDonationSubmit);

    // Donor Detail Modal Controls
    if (dom.btnCloseDetailModal) dom.btnCloseDetailModal.addEventListener('click', closeDonorDetailModal);
    if (dom.btnCloseDetailFooter) dom.btnCloseDetailFooter.addEventListener('click', closeDonorDetailModal);
    if (dom.btnDetailRecordDonation) {
      dom.btnDetailRecordDonation.addEventListener('click', () => {
        if (activeDetailDonorId) {
          const id = activeDetailDonorId;
          closeDonorDetailModal();
          openRecordDonationModal(id);
        }
      });
    }

    // Search & Filters in Donors Tab
    if (dom.donorSearchInput) dom.donorSearchInput.addEventListener('input', renderDonorsCards);
    if (dom.filterBloodGroup) {
      dom.filterBloodGroup.addEventListener('change', () => {
        activeFilterBloodGroup = dom.filterBloodGroup.value;
        renderBloodGroupTiles();
        renderDonorsCards();
      });
    }
    if (dom.filterEligibility) dom.filterEligibility.addEventListener('change', renderDonorsCards);
    if (dom.sortDonorsBy) dom.sortDonorsBy.addEventListener('change', renderDonorsCards);

    if (dom.btnResetDonorFilters) {
      dom.btnResetDonorFilters.addEventListener('click', () => {
        if (dom.donorSearchInput) dom.donorSearchInput.value = '';
        if (dom.filterBloodGroup) dom.filterBloodGroup.value = 'ALL';
        activeFilterBloodGroup = 'ALL';
        if (dom.filterEligibility) dom.filterEligibility.value = 'ALL';
        if (dom.sortDonorsBy) dom.sortDonorsBy.value = 'name_asc';
        renderBloodGroupTiles();
        renderDonorsCards();
      });
    }

    // Close Modals on Backdrop Click
    window.addEventListener('click', (e) => {
      if (e.target === dom.registerDonorModal) closeRegisterDonorModal();
      if (e.target === dom.recordDonationModal) closeRecordDonationModal();
      if (e.target === dom.donorDetailModal) closeDonorDetailModal();
    });

    // Close Modals on ESC Key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (dom.registerDonorModal && dom.registerDonorModal.classList.contains('open')) closeRegisterDonorModal();
        if (dom.recordDonationModal && dom.recordDonationModal.classList.contains('open')) closeRecordDonationModal();
        if (dom.donorDetailModal && dom.donorDetailModal.classList.contains('open')) closeDonorDetailModal();
      }
    });
  }

  // Start on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
