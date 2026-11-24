// Steve's Massage Parlor Management System - Core Application JS
// DBIT 226 - Terence Mwaaki (BIT-0-8106-3/2025)

const API_BASE = (typeof window !== 'undefined' && window.location.protocol === 'file:') ? 'http://localhost:3000' : '';

const App = {
  currentUser: null,
  token: localStorage.getItem('smp_token') || null,
  services: [],
  categories: [],
  therapists: [],
  reviews: [],

  // Pre-configured demo accounts (fallback when server offline)
  DEMO_USERS: {
    'admin@stevesmassage.co.ke':    { id: 1,  name: 'Steve Mwangi (Manager)',           email: 'admin@stevesmassage.co.ke',    phone: '0712345678', role: 'admin',             gender: 'Male',   supplier_id: null },
    'finance@stevesmassage.co.ke':  { id: 2,  name: 'Patrick Mutua (Finance Director)', email: 'finance@stevesmassage.co.ke',  phone: '0711334455', role: 'finance_manager',   gender: 'Male',   supplier_id: null },
    'inventory@stevesmassage.co.ke':{ id: 3,  name: 'Mercy Chebet (Inventory Controller)', email: 'inventory@stevesmassage.co.ke', phone: '0722445566', role: 'inventory_manager', gender: 'Female', supplier_id: null },
    'services@stevesmassage.co.ke': { id: 4,  name: 'Lucas Ochieng (Spa Services Manager)', email: 'services@stevesmassage.co.ke', phone: '0733556677', role: 'service_manager', gender: 'Male', supplier_id: null },
    'grace@stevesmassage.co.ke':    { id: 5,  name: 'Grace Muthoni',  email: 'grace@stevesmassage.co.ke',  phone: '0722112233', role: 'therapist', gender: 'Female', supplier_id: null },
    'david@stevesmassage.co.ke':    { id: 6,  name: 'David Otieno',   email: 'david@stevesmassage.co.ke',  phone: '0733445566', role: 'therapist', gender: 'Male',   supplier_id: null },
    'amina@stevesmassage.co.ke':    { id: 7,  name: 'Amina Hassan',   email: 'amina@stevesmassage.co.ke',  phone: '0708778899', role: 'therapist', gender: 'Female', supplier_id: null },
    'brian@stevesmassage.co.ke':    { id: 8,  name: 'Brian Kiprop',   email: 'brian@stevesmassage.co.ke',  phone: '0715667788', role: 'therapist', gender: 'Male',   supplier_id: null },
    'supplier@spasupplies.co.ke':   { id: 9,  name: 'Jared Momanyi (Nairobi Herbal)', email: 'supplier@spasupplies.co.ke', phone: '0711889900', role: 'supplier', gender: 'Male', supplier_id: 1 },
    'sales@kenyalinens.co.ke':      { id: 10, name: 'Susan Wambui (Kenya Linens)',     email: 'sales@kenyalinens.co.ke',    phone: '0722556677', role: 'supplier', gender: 'Female', supplier_id: 2 },
    'terence@example.com':          { id: 11, name: 'Terence Mwaaki', email: 'terence@example.com', phone: '0790123456', role: 'customer', gender: 'Male',   supplier_id: null },
    'faith@example.com':            { id: 12, name: 'Faith Wanjiku',  email: 'faith@example.com',   phone: '0720987654', role: 'customer', gender: 'Female', supplier_id: null },
  },

  async init() {
    this.bindEvents();
    await this.checkAuth();
    await this.loadInitialData();
    this.renderServices();
    this.renderTherapists();
    this.renderReviews();
    this.setupFAQ();
  },

  // Global API Fetch wrapper with Authorization
  async api(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const fullUrl = endpoint.startsWith('http') ? endpoint : (API_BASE + endpoint);

    try {
      const res = await fetch(fullUrl, { ...options, headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server error occurred');
      }
      return data;
    } catch (err) {
      console.warn('API fetch error for:', endpoint, err.message);
      // Fallback for mock demo responses if server is offline
      const fallback = this.getMockResponse(endpoint, options);
      if (fallback !== null) return fallback;
      throw err;
    }
  },

  showToast(message, type = 'success') {
    let toast = document.getElementById('global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'global-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 14px 24px;
        border-radius: 12px;
        color: #fff;
        font-weight: 600;
        font-size: 0.92rem;
        z-index: 9999;
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
      `;
      document.body.appendChild(toast);
    }
    toast.style.backgroundColor = type === 'success' ? '#2E7D32' : (type === 'danger' ? '#D32F2F' : '#ED6C02');
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    toast.style.display = 'flex';
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 4000);
  },

  async checkAuth() {
    if (!this.token) {
      this.updateAuthUI();
      return;
    }
    try {
      const data = await this.api('/api/auth/me');
      this.currentUser = data.user;
      this.updateAuthUI();
    } catch (err) {
      this.logout(false);
    }
  },

  updateAuthUI() {
    const authContainer = document.getElementById('nav-auth-container');
    if (!authContainer) return;

    if (this.currentUser) {
      const role = this.currentUser.role;
      let portalLabel = 'Dashboard Portal';
      let portalIcon  = 'fa-th-large';
      if      (role === 'inventory_manager') { portalLabel = 'Inventory & Supplies Suite';    portalIcon = 'fa-boxes'; }
      else if (role === 'finance_manager')   { portalLabel = 'Finance & Billing Portal';      portalIcon = 'fa-wallet'; }
      else if (role === 'service_manager')   { portalLabel = 'Spa Service Module';            portalIcon = 'fa-spa'; }
      else if (role === 'admin')             { portalLabel = 'Executive Admin Portal';        portalIcon = 'fa-user-shield'; }
      else if (role === 'therapist')         { portalLabel = 'Therapist Clinical Portal';     portalIcon = 'fa-user-md'; }
      else if (role === 'supplier')          { portalLabel = 'Supplier Portal';               portalIcon = 'fa-truck-loading'; }
      else if (role === 'customer')          { portalLabel = 'My Client Portal';              portalIcon = 'fa-calendar-check'; }

      authContainer.innerHTML = `
        <button class="btn btn-gold btn-sm" onclick="App.openPortal()" style="display:inline-flex; align-items:center; gap:6px;">
          <i class="fas ${portalIcon}"></i> <span>${portalLabel}</span>
        </button>
        <div class="user-menu-btn" onclick="App.toggleUserDropdown()">
          <i class="fas fa-user-circle"></i>
          <span>${this.currentUser.name.split(' ')[0]}</span>
          <i class="fas fa-chevron-down" style="font-size: 0.7rem;"></i>
        </div>
        <div id="user-dropdown-menu" style="display:none; position:absolute; right:20px; top:75px; background:#fff; border-radius:12px; box-shadow:var(--shadow-lg); border:1px solid var(--border); width:230px; z-index:100; overflow:hidden;">
          <div style="padding:14px; border-bottom:1px solid var(--border);">
            <div style="font-weight:700; font-size:0.9rem;">${this.currentUser.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${this.currentUser.email}</div>
            <span class="badge badge-primary" style="margin-top:6px; font-size:0.7rem;">${role.replace(/_/g, ' ').toUpperCase()}</span>
          </div>
          <a href="javascript:void(0)" onclick="App.openPortal()" style="display:flex; align-items:center; gap:10px; padding:12px 16px; font-size:0.88rem; color:var(--text-dark);">
            <i class="fas ${portalIcon} text-gold"></i> ${portalLabel}
          </a>
          ${role === 'customer' ? `<a href="javascript:void(0)" onclick="Booking.openBookingModal()" style="display:flex; align-items:center; gap:10px; padding:12px 16px; font-size:0.88rem; color:var(--text-dark); border-top:1px solid #F0F0F0;"><i class="fas fa-calendar-plus text-primary"></i> Book Appointment</a>` : ''}
          <a href="javascript:void(0)" onclick="App.logout()" style="display:flex; align-items:center; gap:10px; padding:12px 16px; font-size:0.88rem; color:var(--danger); border-top:1px solid var(--border);">
            <i class="fas fa-sign-out-alt"></i> Sign Out
          </a>
        </div>
      `;
    } else {
      authContainer.innerHTML = `
        <button class="btn btn-outline btn-sm" onclick="App.openAuthModal('login')">
          <i class="fas fa-sign-in-alt"></i> Log In
        </button>
        <button class="btn btn-gold btn-sm" onclick="Booking.openBookingModal()">
          <i class="fas fa-calendar-check"></i> Book Now
        </button>
      `;
    }
  },

  toggleUserDropdown() {
    const menu = document.getElementById('user-dropdown-menu');
    if (menu) {
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
  },

  fillLogin(email, pass) {
    const emailEl = document.getElementById('login-email');
    const passEl = document.getElementById('login-pass');
    if (emailEl) emailEl.value = email;
    if (passEl) passEl.value = pass;
    this.showToast('Credentials filled! Click "Sign In" or submit.');
  },

  async login(email, password) {
    const trimmedEmail = (email || '').trim().toLowerCase();
    try {
      const data = await this.api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: trimmedEmail, password })
      });
      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('smp_token', data.token);
      this.updateAuthUI();
      this.closeModal('auth-modal');
      this.showToast(`Welcome back, ${data.user.name}!`);

      // If user was in the middle of booking, continue booking seamlessly
      const bookModal = document.getElementById('booking-modal');
      if (bookModal && bookModal.classList.contains('show')) {
        if (typeof Booking !== 'undefined') {
          Booking.updateStep3UI();
        }
        return;
      }
      this.openPortal();
    } catch (err) {
      // Seamless Demo Fallback if server is not reachable
      const demoUser = this.DEMO_USERS[trimmedEmail];
      if (demoUser) {
        this.token = 'demo_token_' + Date.now();
        this.currentUser = demoUser;
        localStorage.setItem('smp_token', this.token);
        this.updateAuthUI();
        this.closeModal('auth-modal');
        this.showToast(`Welcome, ${demoUser.name}! (Demo Access Active)`);
        const bookModal = document.getElementById('booking-modal');
        if (bookModal && bookModal.classList.contains('show')) {
          if (typeof Booking !== 'undefined') {
            Booking.updateStep3UI();
          }
          return;
        }
        this.openPortal();
        return;
      }
      this.showToast(err.message || 'Invalid credentials', 'danger');
    }
  },

  async fastDemoLogin(role) {
    let email, pass;
    if (role === 'admin') {
      email = 'admin@stevesmassage.co.ke'; pass = 'Admin@123';
    } else if (role === 'finance_manager' || role === 'finance') {
      email = 'finance@stevesmassage.co.ke'; pass = 'Finance@123';
    } else if (role === 'inventory_manager' || role === 'inventory') {
      email = 'inventory@stevesmassage.co.ke'; pass = 'Inventory@123';
    } else if (role === 'service_manager' || role === 'services') {
      email = 'services@stevesmassage.co.ke'; pass = 'Services@123';
    } else if (role === 'therapist' || role === 'therapist_grace') {
      email = 'grace@stevesmassage.co.ke'; pass = 'Grace@123';
    } else if (role === 'therapist_david') {
      email = 'david@stevesmassage.co.ke'; pass = 'David@123';
    } else if (role === 'therapist_amina') {
      email = 'amina@stevesmassage.co.ke'; pass = 'Amina@123';
    } else if (role === 'therapist_brian') {
      email = 'brian@stevesmassage.co.ke'; pass = 'Brian@123';
    } else if (role === 'supplier' || role === 'supplier_jared') {
      email = 'supplier@spasupplies.co.ke'; pass = 'Supplier@123';
    } else if (role === 'supplier_susan' || role === 'supplier_linens') {
      email = 'sales@kenyalinens.co.ke'; pass = 'Supplier@123';
    } else if (role === 'customer_faith') {
      email = 'faith@example.com'; pass = 'Client@123';
    } else {
      email = 'terence@example.com'; pass = 'Client@123';
    }

    // Direct login with fallback guarantee
    const demoUser = this.DEMO_USERS[email];
    try {
      await this.login(email, pass);
    } catch (e) {
      this.token = 'demo_token_' + Date.now();
      this.currentUser = demoUser;
      localStorage.setItem('smp_token', this.token);
      this.updateAuthUI();
      this.closeModal('auth-modal');
      this.showToast(`Active as ${demoUser.name} (${demoUser.role.toUpperCase()})`);
      this.openPortal();
    }
  },

  // Mock response fallback for offline / standalone file browsing
  getMockResponse(endpoint, options = {}) {
    const ep = endpoint.split('?')[0];

    if (ep === '/api/auth/me') {
      if (this.currentUser) return { user: this.currentUser };
      return null;
    }

    if (ep === '/api/users') {
      return [
        { id: 1, name: 'Steve Kamau', email: 'admin@stevesmassage.co.ke', phone: '+254700111222', role: 'admin', created_at: '2026-01-01 09:00' },
        { id: 11, name: 'Patrick Mutua (Finance Director)', email: 'finance@stevesmassage.co.ke', phone: '+254711334455', role: 'finance_manager', created_at: '2026-01-10 09:00' },
        { id: 12, name: 'Mercy Chebet (Inventory Controller)', email: 'inventory@stevesmassage.co.ke', phone: '+254722445566', role: 'inventory_manager', created_at: '2026-01-10 10:00' },
        { id: 13, name: 'Lucas Ochieng (Spa Services Manager)', email: 'services@stevesmassage.co.ke', phone: '+254733556677', role: 'service_manager', created_at: '2026-01-10 11:00' },
        { id: 2, name: 'Grace Muthoni', email: 'grace@stevesmassage.co.ke', phone: '+254711222333', role: 'therapist', created_at: '2026-01-15 10:30' },
        { id: 3, name: 'David Otieno', email: 'david@stevesmassage.co.ke', phone: '+254733445566', role: 'therapist', created_at: '2026-02-01 11:00' },
        { id: 4, name: 'Amina Hassan', email: 'amina@stevesmassage.co.ke', phone: '+254708778899', role: 'therapist', created_at: '2026-02-10 14:00' },
        { id: 5, name: 'Brian Kiprop', email: 'brian@stevesmassage.co.ke', phone: '+254715667788', role: 'therapist', created_at: '2026-03-01 08:30' },
        { id: 6, name: 'Terence Mwaaki', email: 'terence@example.com', phone: '+254790123456', role: 'customer', created_at: '2026-10-01 16:45' }
      ];
    }

    if (ep === '/api/categories') {
      return [
        { id: 1, name: 'Full Body Therapeutic', description: 'Comprehensive rejuvenation', icon: 'fa-spa' },
        { id: 2, name: 'Targeted & Sports Recovery', description: 'Problem zone muscle rehab', icon: 'fa-running' },
        { id: 3, name: 'Sensory & Holistic Wellness', description: 'Aromatic & hot stone', icon: 'fa-fire-alt' },
        { id: 4, name: 'Express & Reflexology', description: 'Acupressure relief', icon: 'fa-shoe-prints' }
      ];
    }

    if (ep === '/api/services') {
      return [
        { id: 1, category_id: 1, category_name: 'Full Body Therapeutic', name: 'Signature Deep Tissue Massage', description: 'Intense firm pressure targeting the deepest layers of muscle tissue and tendons to alleviate chronic tightness.', duration_mins: 60, price_kes: 3500, benefits: 'Relieves lower back pain; Breaks scar tissue; Enhances range of motion', active: 1 },
        { id: 2, category_id: 1, category_name: 'Full Body Therapeutic', name: 'Swedish Gentle Relaxation Massage', description: 'Classic European rhythmic gliding strokes to melt away tension, boost circulation, and calm nerves.', duration_mins: 60, price_kes: 3000, benefits: 'Decreases cortisol stress; Enhances blood oxygenation; Promotes deep restful sleep', active: 1 },
        { id: 3, category_id: 1, category_name: 'Full Body Therapeutic', name: 'Deluxe Full Body Ritual (90 Mins)', description: 'An extensive 90-minute treatment blending Swedish strokes, hot towels, and customized pressure for complete body bliss.', duration_mins: 90, price_kes: 4800, benefits: 'Total physical detente; Rebalances entire nervous system; Deep lymphatic drainage', active: 1 },
        { id: 4, category_id: 2, category_name: 'Targeted & Sports Recovery', name: 'Athletic Sports Recovery Therapy', description: 'Dynamic therapy incorporating assisted stretching, myofascial release, and friction work to expedite recovery.', duration_mins: 60, price_kes: 4000, benefits: 'Reduces lactic acid buildup; Improves athletic flexibility; Speeds up recovery time', active: 1 },
        { id: 5, category_id: 2, category_name: 'Targeted & Sports Recovery', name: 'Upper Back, Neck & Shoulder De-Stresser', description: 'Targeted ergonomic relief focused entirely on tension hotspots caused by computer desks and driving posture.', duration_mins: 45, price_kes: 2500, benefits: 'Eliminates tension headaches; Frees stiff neck rotation; Relaxes shoulder knots', active: 1 },
        { id: 6, category_id: 3, category_name: 'Sensory & Holistic Wellness', name: 'Volcanic Basalt Hot Stone Therapy', description: 'Smooth, heated volcanic basalt stones placed along energy meridian points paired with warm oil massage to relax muscles effortlessly.', duration_mins: 75, price_kes: 4500, benefits: 'Penetrates deep into tight muscles without pain; Induces meditative state; Improves circulation', active: 1 },
        { id: 7, category_id: 3, category_name: 'Sensory & Holistic Wellness', name: 'Organic Herbal Aromatherapy', description: 'Custom blend of cold-pressed lavender, eucalyptus, and ylang-ylang therapeutic essential oils tailored to soothe your emotional state.', duration_mins: 60, price_kes: 3800, benefits: 'Alleviates anxiety; Clears respiratory pathways; Hydrates dry skin with botanical nutrients', active: 1 },
        { id: 8, category_id: 4, category_name: 'Express & Reflexology', name: 'Ancient Chinese Foot Reflexology', description: 'Focused acupressure stimulation on the soles and pressure points of the feet, corresponding to internal organ systems.', duration_mins: 45, price_kes: 2200, benefits: 'Stimulates internal vitality; Relieves tired aching feet; Promotes bodily homeostasis', active: 1 }
      ];
    }

    if (ep === '/api/therapists') {
      return [
        { id: 1, name: 'Grace Muthoni', specialization: 'Deep Tissue & Swedish Therapy', bio: 'Certified wellness therapist with 6 years experience in chronic muscle tension release and deep tissue rehabilitation.', phone: '+254722112233', email: 'grace@stevesmassage.co.ke', rating: 4.95, experience_years: 6, working_hours: '09:00 - 18:00', active: 1 },
        { id: 2, name: 'David Otieno', specialization: 'Sports Massage & Trigger Point', bio: 'Sports recovery specialist focused on athletic conditioning, joint mobility, and targeted trigger point relief.', phone: '+254733445566', email: 'david@stevesmassage.co.ke', rating: 4.88, experience_years: 5, working_hours: '10:00 - 19:00', active: 1 },
        { id: 3, name: 'Amina Hassan', specialization: 'Aromatherapy & Hot Stone Therapy', bio: 'Master aromatherapist specializing in organic herbal essential oil infusions and volcanic basalt hot stone treatments.', phone: '+254708778899', email: 'amina@stevesmassage.co.ke', rating: 4.98, experience_years: 7, working_hours: '09:00 - 17:00', active: 1 },
        { id: 4, name: 'Brian Kiprop', specialization: 'Reflexology & Holistic Relaxation', bio: 'Expert in foot & hand reflexology and stress management techniques, helping clients restore natural energy balance.', phone: '+254715667788', email: 'brian@stevesmassage.co.ke', rating: 4.85, experience_years: 4, working_hours: '11:00 - 20:00', active: 1 }
      ];
    }

    if (ep === '/api/reviews') {
      return [
        { id: 1, customer_name: 'Terence Mwaaki', service_name: 'Signature Deep Tissue Massage', rating: 5, comment: 'Grace is exceptional! My shoulder stiffness had bothered me for weeks and she pinpointed the knot immediately. Clean, calm parlor!' },
        { id: 2, customer_name: 'Faith Wanjiku', service_name: 'Volcanic Basalt Hot Stone Therapy', rating: 5, comment: 'Amina has magic hands. The hot stones paired with aromatherapy put me to sleep in minutes. Booking my next appointment already!' }
      ];
    }

    if (ep === '/api/scheduling/availability') {
      return {
        availableSlots: [
          { time: '09:00', isAvailable: true },
          { time: '10:00', isAvailable: true },
          { time: '11:00', isAvailable: true },
          { time: '12:00', isAvailable: true },
          { time: '13:30', isAvailable: true },
          { time: '14:30', isAvailable: true },
          { time: '15:30', isAvailable: true },
          { time: '16:30', isAvailable: true },
          { time: '17:30', isAvailable: true }
        ]
      };
    }

    if (ep === '/api/appointments') {
      return [
        { id: 1, reference_no: 'SMP-2026-0001', customer_name: 'Terence Mwaaki', customer_phone: '+254790123456', therapist_name: 'Grace Muthoni', service_name: 'Signature Deep Tissue Massage', appointment_date: '2026-11-03', appointment_time: '10:00', total_price_kes: 3500, status: 'Completed', payment_status: 'Completed', payment_method: 'M-Pesa', notes: 'Shoulder tightness', treatment_notes: 'Applied deep friction to rhomboids. Recommended daily stretching.' },
        { id: 2, reference_no: 'SMP-2026-0002', customer_name: 'Faith Wanjiku', customer_phone: '+254720987654', therapist_name: 'Amina Hassan', service_name: 'Volcanic Basalt Hot Stone Therapy', appointment_date: '2026-11-03', appointment_time: '14:30', total_price_kes: 4500, status: 'Completed', payment_status: 'Completed', payment_method: 'M-Pesa', notes: 'Medium heat' },
        { id: 3, reference_no: 'SMP-2026-0003', customer_name: 'Kevin Omondi', customer_phone: '+254731223344', therapist_name: 'David Otieno', service_name: 'Athletic Sports Recovery Therapy', appointment_date: '2026-11-04', appointment_time: '11:00', total_price_kes: 4000, status: 'In-Session', payment_status: 'Completed', payment_method: 'Credit/Debit Card', notes: 'Marathon prep' },
        { id: 4, reference_no: 'SMP-2026-0004', customer_name: 'Terence Mwaaki', customer_phone: '+254790123456', therapist_name: 'Brian Kiprop', service_name: 'Ancient Chinese Foot Reflexology', appointment_date: '2026-11-04', appointment_time: '16:00', total_price_kes: 2200, status: 'Confirmed', payment_status: 'Completed', payment_method: 'M-Pesa' },
        { id: 5, reference_no: 'SMP-2026-0005', customer_name: 'Faith Wanjiku', customer_phone: '+254720987654', therapist_name: 'Grace Muthoni', service_name: 'Swedish Gentle Relaxation Massage', appointment_date: '2026-11-05', appointment_time: '11:30', total_price_kes: 3000, status: 'Confirmed', payment_status: 'Pending', payment_method: 'Cash' }
      ];
    }

    if (ep === '/api/reports/dashboard') {
      return {
        totalAppointments: 18,
        completedAppointments: 14,
        pendingAppointments: 4,
        totalRevenue: 68400,
        totalCustomers: 26,
        activeTherapists: 4,
        lowStockItems: 1,
        popularServices: [
          { name: 'Signature Deep Tissue Massage', booking_count: 8, total_earned: 28000 },
          { name: 'Volcanic Basalt Hot Stone Therapy', booking_count: 5, total_earned: 22500 },
          { name: 'Swedish Gentle Relaxation Massage', booking_count: 3, total_earned: 9000 },
          { name: 'Athletic Sports Recovery Therapy', booking_count: 2, total_earned: 8000 }
        ],
        therapistPerformance: [
          { name: 'Grace Muthoni', specialization: 'Deep Tissue & Swedish', rating: 4.95, total_sessions: 8 },
          { name: 'Amina Hassan', specialization: 'Aromatherapy & Hot Stone', rating: 4.98, total_sessions: 5 },
          { name: 'David Otieno', specialization: 'Sports & Trigger Point', rating: 4.88, total_sessions: 3 },
          { name: 'Brian Kiprop', specialization: 'Reflexology & Relaxation', rating: 4.85, total_sessions: 2 }
        ]
      };
    }

    if (ep === '/api/finance/overview') {
      return {
        totalIncome: 68400,
        totalExpense: 31000,
        netProfit: 37400,
        transactions: [
          { id: 1, type: 'Income', category: 'Service Revenue', description: 'Customer massage appointments (M-Pesa)', amount_kes: 14200, transaction_date: '2026-11-03', reference_no: 'REV-2026-YEST' },
          { id: 2, type: 'Income', category: 'Service Revenue', description: 'Morning massage appointments (SMP-0003 & 0004)', amount_kes: 6200, transaction_date: '2026-11-04', reference_no: 'REV-2026-TODAY' },
          { id: 3, type: 'Expense', category: 'Supplies Restock', description: 'Restocked Lavender & Almond massage oils', amount_kes: 22500, transaction_date: '2026-10-20', reference_no: 'EXP-OIL-1020' },
          { id: 4, type: 'Expense', category: 'Utilities & Laundry', description: 'Industrial towel washing & electricity', amount_kes: 8500, transaction_date: '2026-10-31', reference_no: 'EXP-UTIL-1031' }
        ],
        budgets: [
          { id: 1, month: '2026-11', category: 'Oils & Spa Consumables', allocated_kes: 45000, spent_kes: 4500 },
          { id: 2, month: '2026-11', category: 'Linen & Sanitation', allocated_kes: 25000, spent_kes: 3200 },
          { id: 3, month: '2026-11', category: 'Utilities & Marketing', allocated_kes: 35000, spent_kes: 8500 }
        ]
      };
    }

    if (ep === '/api/inventory/stats') {
      return {
        totalItems: 7,
        totalValuation: 104750,
        lowStockCount: 1,
        totalSuppliers: 3,
        pendingPOCount: 1
      };
    }

    if (ep === '/api/inventory/movements') {
      return [
        { id: 1, item_name: 'Pure Sweet Almond Base Oil (5L)', movement_type: 'IN', quantity: 4, previous_quantity: 2, new_quantity: 6, reason: 'Vendor Delivery received via PO-2026-1001', reference_no: 'PO-2026-1001', recorded_by: 'Steve Mwangi', created_at: '2026-10-19 14:00' },
        { id: 2, item_name: 'Egyptian Cotton Bath Sheets & Towels', movement_type: 'IN', quantity: 25, previous_quantity: 20, new_quantity: 45, reason: 'Restock delivery via PO-2026-1002', reference_no: 'PO-2026-1002', recorded_by: 'Steve Mwangi', created_at: '2026-10-08 11:30' },
        { id: 3, item_name: 'Organic Cold-Pressed Lavender Oil (500ml)', movement_type: 'OUT', quantity: 2, previous_quantity: 20, new_quantity: 18, reason: 'Dispensed for weekend aromatherapy and deep tissue sessions', reference_no: 'DISP-2026-1029', recorded_by: 'Grace Muthoni', created_at: '2026-10-29 16:15' },
        { id: 4, item_name: 'Disposable Headrest Paper Rolls', movement_type: 'OUT', quantity: 3, previous_quantity: 6, new_quantity: 3, reason: 'High client volume in massage treatment rooms', reference_no: 'DISP-2026-1102', recorded_by: 'David Otieno', created_at: '2026-11-02 17:40' }
      ];
    }

    if (ep === '/api/inventory') {
      return [
        { id: 1, name: 'Organic Cold-Pressed Lavender Oil (500ml)', category: 'Massage Oils', quantity: 18, unit: 'Bottles', min_threshold: 5, cost_per_unit_kes: 1200 },
        { id: 2, name: 'Pure Sweet Almond Base Oil (5L)', category: 'Carrier Oils', quantity: 6, unit: 'Jerricans', min_threshold: 3, cost_per_unit_kes: 4500 },
        { id: 3, name: 'Eucalyptus Radiata Essential Oil (100ml)', category: 'Aromatherapy', quantity: 12, unit: 'Bottles', min_threshold: 4, cost_per_unit_kes: 850 },
        { id: 4, name: 'Basalt Volcanic Stones Set (36 Pcs)', category: 'Equipment', quantity: 4, unit: 'Sets', min_threshold: 2, cost_per_unit_kes: 8500 },
        { id: 5, name: 'Egyptian Cotton Bath Sheets & Towels', category: 'Linens', quantity: 45, unit: 'Pieces', min_threshold: 20, cost_per_unit_kes: 950 },
        { id: 6, name: 'Disposable Headrest Paper Rolls', category: 'Sanitation', quantity: 3, unit: 'Rolls', min_threshold: 5, cost_per_unit_kes: 450 }
      ];
    }

    if (ep === '/api/suppliers') {
      return [
        { id: 1, name: 'Nairobi Herbal & Spa Supplies Ltd', contact_person: 'Jared Momanyi', phone: '+254711889900', email: 'orders@nairobiherbals.co.ke', address: 'Industrial Area, Nairobi', supplied_items: 'Carrier Oils, Essential Oils' },
        { id: 2, name: 'Kenya Linens & Textile Mills', contact_person: 'Susan Wambui', phone: '+254722556677', email: 'sales@kenyalinens.co.ke', address: 'Thika Road, Nairobi', supplied_items: 'Bath Sheets, Towels' }
      ];
    }

    if (ep === '/api/purchase-orders') {
      return [
        { id: 1, po_number: 'PO-2026-1001', supplier_name: 'Nairobi Herbal & Spa Supplies Ltd', item_name: 'Pure Sweet Almond Base Oil (5L)', quantity: 4, total_cost_kes: 18000, status: 'Received' },
        { id: 2, po_number: 'PO-2026-1002', supplier_name: 'Kenya Linens & Textile Mills', item_name: 'Egyptian Cotton Towels', quantity: 25, total_cost_kes: 23750, status: 'Received' }
      ];
    }

    // Single PO lookup: /api/purchase-orders/:id
    const poMatch = ep.match(/^\/api\/purchase-orders\/(\d+)$/);
    if (poMatch) {
      const mockPOs = [
        { id: 1, po_number: 'PO-2026-1001', supplier_name: 'Nairobi Herbal & Spa Supplies Ltd', supplier_email: 'orders@nairobiherbals.co.ke', supplier_address: 'Industrial Area, Nairobi', item_name: 'Pure Sweet Almond Base Oil (5L)', quantity: 4, unit_cost_kes: 4500, total_cost_kes: 18000, status: 'Received', notes: 'Urgently needed for aromatherapy sessions', created_at: '2026-11-01' },
        { id: 2, po_number: 'PO-2026-1002', supplier_name: 'Kenya Linens & Textile Mills', supplier_email: 'sales@kenyalinens.co.ke', supplier_address: 'Thika Road, Nairobi', item_name: 'Egyptian Cotton Towels', quantity: 25, unit_cost_kes: 950, total_cost_kes: 23750, status: 'Received', notes: '', created_at: '2026-11-02' }
      ];
      const found = mockPOs.find(p => p.id === Number(poMatch[1]));
      return found || null;
    }

    if (ep === '/api/inquiries') {
      return [
        { id: 1, name: 'Wanjiru Mwangi', email: 'wanjiru.m@gmail.com', phone: '+254710123456', subject: 'Couple Massage Packages', message: 'Do you offer tandem couple massage rooms with customized aromatherapy on weekends?', status: 'New', created_at: '2026-11-04 10:30' },
        { id: 2, name: 'Captain George Omondi', email: 'george@kenyaairways.com', phone: '+254722887766', subject: 'Corporate Wellness Vouchers', message: 'We would like to purchase quarterly wellness massage gift vouchers.', status: 'Replied', created_at: '2026-11-03 15:45' }
      ];
    }

    if (ep === '/api/notifications') {
      return [
        { id: 1, channel: 'SMS', title: 'Booking Confirmed', message: 'Your Deep Tissue session with Grace Muthoni is confirmed for 10:00 AM.', recipient_phone: '+254790123456', created_at: '2026-11-03 09:00' },
        { id: 2, channel: 'SMS', title: 'Payment Received', message: 'Received KES 3,500 via M-Pesa (Ref: QHK76TR49X).', recipient_phone: '+254790123456', created_at: '2026-11-03 09:01' },
        { id: 3, channel: 'In-App', title: 'Low Stock Alert', message: 'Disposable Headrest Paper Rolls reached 3 rolls (min threshold: 5).', recipient_email: 'admin@stevesmassage.co.ke', created_at: '2026-11-04 08:00' }
      ];
    }

    return null;
  },

  logout(showAlert = true) {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('smp_token');
    this.updateAuthUI();
    this.closePortal();
    if (showAlert) this.showToast('You have been signed out.');
  },

  async loadInitialData() {
    try {
      const [cats, srvs, ths, revs] = await Promise.all([
        this.api('/api/categories'),
        this.api('/api/services'),
        this.api('/api/therapists'),
        this.api('/api/reviews')
      ]);
      this.categories = cats;
      this.services = srvs;
      this.therapists = ths;
      this.reviews = revs;
    } catch (err) {
      console.error('Failed to load initial data', err);
    }
  },

  renderServices(categoryFilter = null, searchQuery = '') {
    const container = document.getElementById('services-grid-container');
    if (!container) return;

    let filtered = this.services;
    if (categoryFilter) {
      filtered = filtered.filter(s => s.category_id === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--text-muted);">No massage services found matching your criteria.</div>`;
      return;
    }

    container.innerHTML = filtered.map(s => `
      <div class="service-card">
        <div>
          <div class="service-card-header">
            <span class="service-category-tag">${s.category_name || 'Wellness'}</span>
            <span class="service-duration"><i class="far fa-clock"></i> ${s.duration_mins} mins</span>
          </div>
          <h3>${s.name}</h3>
          <p>${s.description}</p>
          ${s.benefits ? `
            <div class="service-benefits">
              <span><i class="fas fa-heartbeat text-gold"></i> Key Benefits</span>
              <p>${s.benefits.split(';').join(' • ')}</p>
            </div>
          ` : ''}
        </div>
        <div class="service-card-footer">
          <div class="service-price">
            <span>KES</span> ${Number(s.price_kes).toLocaleString()}
          </div>
          <button class="btn btn-gold btn-sm" onclick="Booking.selectServiceAndOpen(${s.id})">
            <i class="fas fa-calendar-plus"></i> Book Now
          </button>
        </div>
      </div>
    `).join('');
  },

  renderTherapists() {
    const container = document.getElementById('therapists-grid-container');
    if (!container) return;

    container.innerHTML = this.therapists.map(t => `
      <div class="therapist-card">
        <div class="therapist-avatar">
          <i class="fas fa-user-tie"></i>
        </div>
        <h3>${t.name}</h3>
        <div class="therapist-spec">${t.specialization}</div>
        <div class="therapist-rating">
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star-half-alt"></i>
          <span>${t.rating.toFixed(2)}</span>
        </div>
        <p>${t.bio}</p>
        <span class="therapist-schedule-tag"><i class="far fa-clock"></i> ${t.working_hours}</span>
        <div>
          <button class="btn btn-outline btn-sm" style="width:100%;" onclick="Booking.selectTherapistAndOpen(${t.id})">
            Book With ${t.name.split(' ')[0]}
          </button>
        </div>
      </div>
    `).join('');
  },

  renderReviews() {
    const container = document.getElementById('reviews-grid-container');
    if (!container) return;

    container.innerHTML = this.reviews.slice(0, 3).map(r => `
      <div class="review-card">
        <div class="review-rating">
          ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
        </div>
        <div class="review-comment">"${r.comment}"</div>
        <div class="review-author">
          <div class="review-name">${r.customer_name}</div>
          <div class="review-service">${r.service_name || 'Massage Therapy'}</div>
        </div>
      </div>
    `).join('');
  },

  setupFAQ() {
    document.querySelectorAll('.faq-question').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        item.classList.toggle('active');
      });
    });
  },

  openAuthModal(mode = 'login') {
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('auth-modal-title');
    const loginForm = document.getElementById('auth-login-form');
    const regForm = document.getElementById('auth-register-form');

    if (mode === 'login') {
      title.innerText = 'Sign In to Your Account';
      loginForm.style.display = 'block';
      regForm.style.display = 'none';
    } else {
      title.innerText = 'Create Client Account';
      loginForm.style.display = 'none';
      regForm.style.display = 'block';
    }
    modal.classList.add('show');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
  },

  openPortal() {
    if (!this.currentUser) return this.openAuthModal('login');
    document.querySelectorAll('.landing-section').forEach(sec => sec.style.display = 'none');
    document.getElementById('portal-wrapper').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const role = this.currentUser.role;
    if (role === 'admin') {
      Admin.init();
    } else if (role === 'finance_manager') {
      FinanceManager.init();
    } else if (role === 'inventory_manager') {
      InventoryPortal.init();
    } else if (role === 'service_manager') {
      ServiceManager.init();
    } else if (role === 'therapist') {
      Therapist.init();
    } else if (role === 'supplier') {
      if (typeof SupplierPortal !== 'undefined') {
        SupplierPortal.init();
      } else {
        this.showToast('Supplier module loading...', 'warning');
      }
    } else {
      Customer.init();
    }
  },

  async openInventoryPortal() {
    if (!this.currentUser) {
      this.showToast('Please log in as the Inventory Manager to access this module.', 'warning');
      this.openAuthModal('login');
      return;
    }
    if (this.currentUser.role === 'inventory_manager' || this.currentUser.role === 'admin') {
      this.openPortal();
      return;
    }
    this.showToast('Access Restricted: Inventory & Supplies is strictly reserved for the Inventory Manager (Mercy Chebet).', 'warning');
  },

  async openFinancePortal() {
    if (!this.currentUser) {
      this.showToast('Please log in as the Finance Director to access this module.', 'warning');
      this.openAuthModal('login');
      return;
    }
    if (this.currentUser.role === 'finance_manager' || this.currentUser.role === 'admin') {
      this.openPortal();
      return;
    }
    this.showToast('Access Restricted: Finance Module is strictly reserved for the Finance Director (Patrick Mutua).', 'warning');
  },

  async openServicePortal() {
    if (!this.currentUser) {
      this.showToast('Please log in as the Service Manager to access this module.', 'warning');
      this.openAuthModal('login');
      return;
    }
    if (this.currentUser.role === 'service_manager' || this.currentUser.role === 'admin') {
      this.openPortal();
      return;
    }
    this.showToast('Access Restricted: Service Module is strictly reserved for the Spa Services Manager (Lucas Ochieng).', 'warning');
  },

  // Phone normalization & validation: accepts 07XXXXXXXX or 01XXXXXXXX (10 digits)
  normalizePhone(phone) {
    if (!phone) return '';
    let p = String(phone).trim().replace(/\s+/g, '');
    if (p.startsWith('+254')) p = '0' + p.slice(4);
    if (p.startsWith('254') && p.length === 12) p = '0' + p.slice(3);
    return p;
  },

  validatePhone(phone) {
    if (!phone) return false;
    const p = this.normalizePhone(phone);
    return /^0[71]\d{8}$/.test(p);
  },

  async handleRegister(e) {
    if (e) e.preventDefault();
    const nameEl   = document.getElementById('reg-name');
    const emailEl  = document.getElementById('reg-email');
    const phoneEl  = document.getElementById('reg-phone');
    const genderEl = document.getElementById('reg-gender');
    const passEl   = document.getElementById('reg-pass');

    const name     = nameEl   ? nameEl.value.trim()   : '';
    const email    = emailEl  ? emailEl.value.trim()  : '';
    const rawPhone = phoneEl  ? phoneEl.value.trim()  : '';
    const gender   = genderEl ? genderEl.value        : 'Not Specified';
    const password = passEl   ? passEl.value          : '';

    if (!name || !email || !rawPhone || !password) {
      return this.showToast('Please fill in your name, email, phone, and password', 'warning');
    }
    if (!this.validatePhone(rawPhone)) {
      return this.showToast('Please enter a valid 10-digit Kenyan phone number (07XXXXXXXX or 01XXXXXXXX)', 'warning');
    }
    const phone = this.normalizePhone(rawPhone);
    if (password.length < 6) {
      return this.showToast('Password must be at least 6 characters long', 'warning');
    }

    try {
      const data = await this.api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, gender, password })
      });
      this.token       = data.token;
      this.currentUser = data.user;
      localStorage.setItem('smp_token', data.token);
      this.updateAuthUI();
      this.closeModal('auth-modal');
      this.showToast(`Account created! Welcome, ${data.user.name}. You are now signed in.`);

      // If user had booking wizard open, update their contact details and continue
      const bookModal = document.getElementById('booking-modal');
      if (bookModal && bookModal.classList.contains('show')) {
        if (typeof Booking !== 'undefined') {
          Booking.updateStep3UI();
        }
      } else {
        // Seamlessly continue into their personal dashboard
        this.openPortal();
      }
    } catch (err) {
      this.showToast(err.message || 'Registration failed. Please try again.', 'danger');
    }
  },

  closePortal() {
    document.querySelectorAll('.landing-section').forEach(sec => sec.style.display = 'block');
    document.getElementById('portal-wrapper').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  bindEvents() {
    // Contact Us Inquiry Form submission
    const inquiryForm = document.getElementById('contact-inquiry-form');
    if (inquiryForm) {
      inquiryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
          target_email: document.getElementById('inq-target-email')?.value || 'admin@stevesmassage.co.ke',
          name: document.getElementById('inq-name').value,
          email: document.getElementById('inq-email').value,
          phone: document.getElementById('inq-phone').value,
          subject: document.getElementById('inq-subject').value,
          message: document.getElementById('inq-message').value
        };
        try {
          const res = await App.api('/api/inquiries', {
            method: 'POST',
            body: JSON.stringify(body)
          });
          App.showToast(res.message);
          inquiryForm.reset();
        } catch (err) {
          App.showToast(err.message, 'danger');
        }
      });
    }

    // Live search input
    const searchInput = document.getElementById('service-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        App.renderServices(null, e.target.value);
      });
    }
  }
};

// Customer Portal Module
const Customer = {
  async init() {
    const portal = document.getElementById('portal-content');
    portal.innerHTML = `
      <div class="portal-header">
        <div>
          <h2>Client Portal</h2>
          <p class="text-muted">Welcome, ${App.currentUser.name} • Registered Member</p>
        </div>
        <div style="display:flex; gap:12px;">
          <button class="btn btn-gold btn-sm" onclick="Booking.openBookingModal()">
            <i class="fas fa-plus-circle"></i> Book New Session
          </button>
          <button class="btn btn-outline btn-sm" onclick="App.closePortal()">
            <i class="fas fa-arrow-left"></i> Back to Parlor Home
          </button>
        </div>
      </div>

      <div class="portal-nav-tabs">
        <button class="portal-tab active" id="cust-tab-appts" onclick="Customer.loadAppointments()"><i class="fas fa-calendar-alt"></i> My Appointments</button>
        <button class="portal-tab" id="cust-tab-pay" onclick="Customer.loadPayments()"><i class="fas fa-receipt"></i> Receipts & Payments</button>
        <button class="portal-tab" id="cust-tab-profile" onclick="Customer.loadProfile()"><i class="fas fa-id-card"></i> My Profile</button>
        <button class="portal-tab" id="cust-tab-review" onclick="Customer.openFeedbackModal()"><i class="fas fa-star text-gold"></i> Submit Review</button>
      </div>

      <div id="customer-view-area"></div>
    `;
    await this.loadAppointments();
  },

  async loadAppointments() {
    ['cust-tab-appts', 'cust-tab-pay', 'cust-tab-profile'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    const activeBtn = document.getElementById('cust-tab-appts');
    if (activeBtn) activeBtn.classList.add('active');

    const area = document.getElementById('customer-view-area');
    area.innerHTML = '<div style="text-align:center; padding:30px;">Loading your appointments...</div>';
    try {
      const appointments = await App.api('/api/appointments');
      if (appointments.length === 0) {
        area.innerHTML = `
          <div style="background:#fff; padding:40px; text-align:center; border-radius:14px; border:1px solid var(--border);">
            <i class="fas fa-calendar-times" style="font-size:3rem; color:var(--text-muted); margin-bottom:14px;"></i>
            <h3>No Appointments Found</h3>
            <p class="text-muted" style="margin-bottom:20px;">You haven't scheduled any massage therapy sessions yet.</p>
            <button class="btn btn-gold btn-sm" onclick="Booking.openBookingModal()">Book Your First Session</button>
          </div>
        `;
        return;
      }

      const pendingPaymentAppts = appointments.filter(a => a.status !== 'Cancelled' && a.finance_status !== 'Approved');

      area.innerHTML = `
        ${pendingPaymentAppts.length > 0 ? `
          <div style="background:#FFF9E6; border:1px solid #FFE082; padding:16px 20px; border-radius:12px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div>
              <h4 style="margin:0 0 4px; color:#795548;"><i class="fas fa-wallet text-gold"></i> Payment Settlement Required</h4>
              <p style="margin:0; font-size:0.86rem; color:#5D4037;">You have <strong>${pendingPaymentAppts.length}</strong> booking(s) awaiting payment or Finance Department verification. Please pay via M-Pesa or Card to secure your slot.</p>
            </div>
            <button class="btn btn-gold btn-sm" onclick="Customer.openPayModal(${pendingPaymentAppts[0].id}, '${pendingPaymentAppts[0].reference_no}', '${pendingPaymentAppts[0].service_name}', ${pendingPaymentAppts[0].total_price_kes})">
              <i class="fas fa-money-bill-wave"></i> Pay for ${pendingPaymentAppts[0].reference_no} Now
            </button>
          </div>
        ` : ''}

        <div class="table-card">
          <div class="table-header-bar">
            <h3>My Booked Massage Sessions</h3>
            <span class="badge badge-primary">${appointments.length} Total</span>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Ref No</th>
                  <th>Service</th>
                  <th>Therapist</th>
                  <th>Date & Time</th>
                  <th>Total (KES)</th>
                  <th>Status</th>
                  <th>Payment & Finance Clearance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${appointments.map(a => `
                  <tr>
                    <td><strong>${a.reference_no}</strong></td>
                    <td>${a.service_name}</td>
                    <td>${a.therapist_name}</td>
                    <td>${a.appointment_date} at ${a.appointment_time}</td>
                    <td>KES ${Number(a.total_price_kes).toLocaleString()}</td>
                    <td>
                      <span class="badge ${a.status === 'Completed' ? 'badge-success' : (a.status === 'Cancelled' ? 'badge-danger' : 'badge-primary')}">
                        ${a.status}
                      </span>
                    </td>
                    <td>
                      ${a.finance_status === 'Approved' ? `
                        <span class="badge badge-success" title="Cleared by ${a.finance_reviewed_by || 'Finance'}">
                          <i class="fas fa-check-circle"></i> Paid & Approved
                        </span>
                      ` : (a.finance_status === 'Rejected' ? `
                        <span class="badge badge-danger">
                          <i class="fas fa-exclamation-triangle"></i> Disputed
                        </span>
                      ` : `
                        <span class="badge badge-warning">
                          <i class="fas fa-clock"></i> Awaiting Finance Clearance
                        </span>
                      `)}
                    </td>
                    <td>
                      ${a.status !== 'Cancelled' && a.finance_status !== 'Approved' ? `
                        <div style="display:flex; gap:6px;">
                          <button class="btn btn-gold btn-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="Customer.openPayModal(${a.id}, '${a.reference_no}', '${a.service_name}', ${a.total_price_kes})">
                            <i class="fas fa-credit-card"></i> Pay Now
                          </button>
                          <button class="btn btn-outline btn-sm" style="padding:4px 8px; font-size:0.75rem; color:var(--danger); border-color:var(--danger);" onclick="Customer.cancelBooking(${a.id})">
                            Cancel
                          </button>
                        </div>
                      ` : (a.status !== 'Cancelled' ? `
                        <button class="btn btn-outline btn-sm" onclick="Booking.viewReceipt('${a.reference_no}', '${a.service_name}', '${a.therapist_name}', '${a.appointment_date}', '${a.appointment_time}', ${a.total_price_kes}, '${a.payment_method || 'M-Pesa'}')">
                          <i class="fas fa-print"></i> Receipt
                        </button>
                      ` : '<span class="text-muted">—</span>')}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      area.innerHTML = `<div style="color:red; padding:20px;">Failed to load appointments: ${err.message}</div>`;
    }
  },

  async loadPayments() {
    ['cust-tab-appts', 'cust-tab-pay', 'cust-tab-profile'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    const activeBtn = document.getElementById('cust-tab-pay');
    if (activeBtn) activeBtn.classList.add('active');

    const area = document.getElementById('customer-view-area');
    try {
      const payments = await App.api('/api/payments');
      area.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <h3>My Payment History (KES)</h3>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Service</th>
                  <th>Amount (KES)</th>
                  <th>Method</th>
                  <th>Transaction Ref</th>
                  <th>Date Paid</th>
                  <th>Finance Clearance Status</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map(p => `
                  <tr>
                    <td><strong>${p.reference_no}</strong></td>
                    <td>${p.service_name}</td>
                    <td>KES ${Number(p.amount_kes).toLocaleString()}</td>
                    <td><span class="badge badge-primary">${p.payment_method}</span></td>
                    <td><code>${p.transaction_ref}</code></td>
                    <td>${p.paid_at ? p.paid_at.substring(0, 16) : 'N/A'}</td>
                    <td>
                      ${p.finance_status === 'Approved' ? `
                        <span class="badge badge-success" title="Approved by ${p.finance_reviewed_by || 'Finance'}">
                          <i class="fas fa-check-double"></i> Approved & Cleared
                        </span>
                      ` : (p.finance_status === 'Rejected' ? `
                        <span class="badge badge-danger">
                          <i class="fas fa-times-circle"></i> Disputed
                        </span>
                      ` : `
                        <span class="badge badge-warning">
                          <i class="fas fa-clock"></i> Pending Finance Approval
                        </span>
                      `)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  openPayModal(apptId, refNo, serviceName, amount) {
    let payModal = document.getElementById('customer-pay-modal');
    if (!payModal) {
      payModal = document.createElement('div');
      payModal.id = 'customer-pay-modal';
      payModal.className = 'modal-overlay';
      document.body.appendChild(payModal);
    }

    payModal.innerHTML = `
      <div class="modal-card" style="max-width:540px;">
        <div class="modal-header">
          <h3><i class="fas fa-credit-card text-gold"></i> Settle Appointment Payment</h3>
          <button class="btn-close-modal" onclick="App.closeModal('customer-pay-modal')">&times;</button>
        </div>
        <div class="modal-body" style="padding:20px;">
          <!-- Summary Box -->
          <div style="background:#F8F9FA; border:1px solid #E9ECEF; border-radius:10px; padding:16px; margin-bottom:18px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
              <span class="text-muted">Booking Reference:</span>
              <strong>${refNo}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
              <span class="text-muted">Service / Treatment:</span>
              <span>${serviceName}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-top:1px dashed #DDD; padding-top:8px; margin-top:8px; font-size:1.1rem;">
              <strong>Amount Payable:</strong>
              <strong style="color:var(--primary);">KES ${Number(amount).toLocaleString()}</strong>
            </div>
          </div>

          <!-- Business Payment Receiving Channels -->
          <div style="background:linear-gradient(135deg,#1a472a 0%,#2d6a4f 100%); color:#fff; border-radius:10px; padding:14px 18px; margin-bottom:18px;">
            <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; opacity:0.85; margin-bottom:4px;">
              <i class="fas fa-university"></i> Steve's Massage Parlour Receiving Channels
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:6px; font-size:0.88rem;">
              <div>
                <span style="opacity:0.8;">M-Pesa Paybill:</span> <strong style="font-family:monospace; color:#A8EDBB; font-size:1.05rem;">400200</strong><br>
                <span style="opacity:0.8;">Account No:</span> <strong style="font-family:monospace;">${refNo}</strong>
              </div>
              <div>
                <span style="opacity:0.8;">Buy Goods / Till:</span> <strong style="font-family:monospace; color:#A8EDBB; font-size:1.05rem;">5278441</strong><br>
                <span style="opacity:0.8;">Equity Bank:</span> <strong style="font-family:monospace;">0023456789</strong>
              </div>
            </div>
          </div>

          <!-- Payment Method Options -->
          <form id="cust-settle-pay-form" onsubmit="event.preventDefault(); Customer.submitAppointmentPayment(${apptId});">
            <div class="form-group">
              <label>Select Payment Method *</label>
              <select id="cust-pay-method" class="form-control" required onchange="Customer.togglePayInputs()">
                <option value="M-Pesa">Safaricom M-Pesa (STK Push or Manual Ref)</option>
                <option value="Credit/Debit Card">Credit / Debit Card</option>
                <option value="Cash">Cash at Sanctuary Desk</option>
              </select>
            </div>

            <!-- M-Pesa Fields -->
            <div id="cust-mpesa-group">
              <div class="form-group">
                <label>M-Pesa Phone Number (for STK Prompt) *</label>
                <div style="display:flex; gap:8px;">
                  <input type="tel" id="cust-pay-phone" class="form-control" placeholder="07XXXXXXXX" value="${App.currentUser ? App.currentUser.phone : ''}" maxlength="10">
                  <button type="button" class="btn btn-outline btn-sm" onclick="Customer.sendMpesaPrompt(${amount})" style="white-space:nowrap;">
                    <i class="fas fa-mobile-alt"></i> Trigger STK Push
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>M-Pesa Confirmation Code / Reference (e.g. QHK889KL12)</label>
                <input type="text" id="cust-pay-transref" class="form-control" placeholder="Enter code received on SMS, or leave blank to auto-generate">
              </div>
            </div>

            <div style="margin-top:20px; display:flex; gap:10px;">
              <button type="submit" class="btn btn-gold" id="btn-cust-pay-submit" style="flex:1;">
                <i class="fas fa-check-circle"></i> Submit Payment for Finance Clearance
              </button>
              <button type="button" class="btn btn-outline" onclick="App.closeModal('customer-pay-modal')">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    App.openModal('customer-pay-modal');
  },

  togglePayInputs() {
    const method = document.getElementById('cust-pay-method').value;
    const mpesaGroup = document.getElementById('cust-mpesa-group');
    if (mpesaGroup) {
      mpesaGroup.style.display = (method === 'M-Pesa') ? 'block' : 'none';
    }
  },

  async sendMpesaPrompt(amount) {
    const phone = document.getElementById('cust-pay-phone').value.trim();
    if (!phone) {
      App.showToast('Please enter your Safaricom phone number', 'warning');
      return;
    }
    App.showToast('Sending STK Push prompt to ' + phone + '...', 'info');
    try {
      const res = await App.api('/api/payments/mpesa-simulate', {
        method: 'POST',
        body: JSON.stringify({ phone_number: phone, amount_kes: amount })
      });
      document.getElementById('cust-pay-transref').value = res.transaction_ref;
      App.showToast('STK Push dispatched! Transaction code captured: ' + res.transaction_ref, 'success');
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  async submitAppointmentPayment(apptId) {
    const btn = document.getElementById('btn-cust-pay-submit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting payment...';

    const method = document.getElementById('cust-pay-method').value;
    const phone = document.getElementById('cust-pay-phone') ? document.getElementById('cust-pay-phone').value.trim() : '';
    const transRef = document.getElementById('cust-pay-transref') ? document.getElementById('cust-pay-transref').value.trim() : '';

    try {
      const res = await App.api('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          appointment_id: apptId,
          payment_method: method,
          phone_number: phone,
          transaction_ref: transRef
        })
      });

      App.showToast(res.message, 'success');
      App.closeModal('customer-pay-modal');
      this.loadAppointments();
    } catch (err) {
      App.showToast(err.message, 'danger');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check-circle"></i> Submit Payment for Finance Clearance';
    }
  },

  async cancelBooking(id) {
    if (!confirm('Are you sure you want to cancel this massage appointment?')) return;
    try {
      await App.api(`/api/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Cancelled' })
      });
      App.showToast('Appointment cancelled successfully.');
      this.loadAppointments();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  loadProfile() {
    ['cust-tab-appts', 'cust-tab-pay', 'cust-tab-profile'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    const activeBtn = document.getElementById('cust-tab-profile');
    if (activeBtn) activeBtn.classList.add('active');

    const area = document.getElementById('customer-view-area');
    const u = App.currentUser || { name: 'Terence Mwaaki', email: 'terence@example.com', phone: '+254790123456' };

    area.innerHTML = `
      <div class="table-card" style="max-width:650px; margin:0 auto; padding:32px;">
        <div class="table-header-bar" style="margin-bottom:24px; padding-bottom:12px; border-bottom:1px solid var(--border);">
          <div>
            <h3><i class="fas fa-id-card text-gold"></i> Client Account Profile</h3>
            <p class="text-muted" style="font-size:0.8rem; margin:0;">Manage personal wellness details and contact information</p>
          </div>
          <span class="badge badge-primary">Member</span>
        </div>

        <form onsubmit="event.preventDefault(); Customer.saveProfile();">
          <div class="form-group" style="margin-bottom:18px;">
            <label>Full Legal Name</label>
            <input type="text" id="cust-prof-name" class="form-control" value="${u.name || ''}" required>
          </div>

          <div class="form-group" style="margin-bottom:18px;">
            <label>Email Address (Primary Login)</label>
            <input type="email" id="cust-prof-email" class="form-control" value="${u.email || ''}" readonly style="background:#F4F4F4; cursor:not-allowed;">
            <small class="text-muted">Email address cannot be changed directly for security audit reasons.</small>
          </div>

          <div class="form-group" style="margin-bottom:18px;">
            <label>Primary Phone Number (SMS Appointment Reminders & M-Pesa)</label>
            <input type="tel" id="cust-prof-phone" class="form-control" value="${u.phone || ''}" placeholder="07XXXXXXXX" required maxlength="10" inputmode="numeric" oninput="this.value=this.value.replace(/\D/g,'').slice(0,10)">
          </div>

          <div class="form-group" style="margin-bottom:24px;">
            <label>Update Password (leave blank to retain current password)</label>
            <input type="password" id="cust-prof-pw" class="form-control" placeholder="••••••••">
          </div>

          <div style="background:#F8F9F8; border:1px solid var(--border); border-radius:8px; padding:14px; margin-bottom:24px;">
            <div style="font-size:0.82rem; color:var(--text-muted);">
              <i class="fas fa-shield-alt text-gold"></i> <strong>Kenya Data Protection Act (2019) Compliance:</strong>
              Your contact details are encrypted and utilized exclusively for appointment scheduling and M-Pesa billing verification.
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:12px;">
            <button type="submit" class="btn btn-gold">
              <i class="fas fa-save"></i> Save Profile Details
            </button>
          </div>
        </form>
      </div>
    `;
  },

  async saveProfile() {
    const name = document.getElementById('cust-prof-name').value.trim();
    const phone = document.getElementById('cust-prof-phone').value.trim();

    if (!name || !phone) return App.showToast('Please provide both name and phone number', 'warning');

    if (App.currentUser) {
      App.currentUser.name = name;
      App.currentUser.phone = phone;
    }
    App.updateAuthUI();
    App.showToast('Profile information updated successfully!');
  },

  openFeedbackModal() {
    let modal = document.getElementById('review-submit-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'review-submit-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box">
          <div class="modal-header">
            <h3><i class="fas fa-star text-gold"></i> Client Experience Feedback</h3>
            <button class="modal-close-btn" onclick="App.closeModal('review-submit-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <p class="text-muted" style="margin-bottom:18px;">How was your massage experience at Steve's Massage Parlor?</p>
            <div class="form-group">
              <label>Rating (1 to 5 Stars)</label>
              <select id="rev-rating" class="form-control">
                <option value="5">⭐⭐⭐⭐⭐ 5 Stars - Exceptional Relaxation</option>
                <option value="4">⭐⭐⭐⭐ 4 Stars - Very Satisfied</option>
                <option value="3">⭐⭐⭐ 3 Stars - Average Service</option>
                <option value="2">⭐⭐ 2 Stars - Needs Improvement</option>
                <option value="1">⭐ 1 Star - Unsatisfactory</option>
              </select>
            </div>
            <div class="form-group">
              <label>Service / Treatment</label>
              <input type="text" id="rev-service" class="form-control" placeholder="e.g. Signature Deep Tissue Massage">
            </div>
            <div class="form-group">
              <label>Your Review & Testimonial</label>
              <textarea id="rev-comment" class="form-control" rows="4" placeholder="Describe therapist technique, ambience, cleanliness, and overall relief..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('review-submit-modal')">Cancel</button>
            <button class="btn btn-gold btn-sm" onclick="Customer.submitReview()">Submit Review</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.classList.add('show');
  },

  async submitReview() {
    const rating = document.getElementById('rev-rating').value;
    const service_name = document.getElementById('rev-service').value;
    const comment = document.getElementById('rev-comment').value;

    if (!comment.trim()) return App.showToast('Please enter your review comments', 'danger');

    try {
      const res = await App.api('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ rating: Number(rating), service_name, comment })
      });
      App.showToast(res.message);
      App.closeModal('review-submit-modal');
      await App.loadInitialData();
      App.renderReviews();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
