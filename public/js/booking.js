// Steve's Massage Parlor Management System - Online Appointment Booking Module
// DBIT 226 - Terence Mwaaki (BIT-0-8106-3/2025)

const Booking = {
  currentStep: 1,
  data: {
    service_id: null,
    therapist_id: 'any',
    appointment_date: null,
    appointment_time: null,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: '',
    payment_method: 'M-Pesa',
    mpesa_phone: ''
  },

  initModal() {
    let modal = document.getElementById('booking-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'booking-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box modal-lg">
          <div class="modal-header">
            <div>
              <h3><i class="fas fa-calendar-check text-gold"></i> Schedule Massage Appointment</h3>
              <p class="text-muted" style="font-size:0.85rem; margin:0;">Follow the simple 4-step wizard to reserve your wellness session</p>
            </div>
            <button class="modal-close-btn" onclick="Booking.closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Step Indicators -->
            <div class="booking-steps-bar">
              <div class="step-indicator active" id="step-ind-1">
                <div class="step-number">1</div>
                <span>Service</span>
              </div>
              <div class="step-indicator" id="step-ind-2">
                <div class="step-number">2</div>
                <span>Date & Time</span>
              </div>
              <div class="step-indicator" id="step-ind-3">
                <div class="step-number">3</div>
                <span>Your Details</span>
              </div>
              <div class="step-indicator" id="step-ind-4">
                <div class="step-number">4</div>
                <span>Payment</span>
              </div>
            </div>

            <!-- STEP 1: SERVICE & THERAPIST SELECTION -->
            <div id="booking-step-1" class="booking-step-content">
              <h4 style="margin-bottom:14px;">Select Desired Treatment & Specialist</h4>
              <div class="form-group">
                <label>Massage Service / Treatment</label>
                <select id="book-service-select" class="form-control" onchange="Booking.onServiceChanged()">
                  <option value="">-- Choose a Massage Service --</option>
                  ${App.services.map(s => `
                    <option value="${s.id}" data-price="${s.price_kes}" data-duration="${s.duration_mins}">
                      ${s.name} (${s.duration_mins} mins) - KES ${Number(s.price_kes).toLocaleString()}
                    </option>
                  `).join('')}
                </select>
              </div>
              <div id="service-summary-card" style="display:none; background:var(--sage-light); padding:16px; border-radius:12px; margin-bottom:18px;">
                <h5 id="sum-srv-name" style="margin-bottom:4px; color:var(--primary);"></h5>
                <p id="sum-srv-desc" style="font-size:0.85rem; color:var(--text-muted); margin-bottom:8px;"></p>
                <div style="font-weight:700; color:var(--primary);">
                  Price: KES <span id="sum-srv-price"></span> | Duration: <span id="sum-srv-duration"></span> mins
                </div>
              </div>

              <div class="form-group">
                <label>Preferred Therapist</label>
                <select id="book-therapist-select" class="form-control">
                  <option value="any">✨ Any Available Certified Therapist (Recommended)</option>
                  ${App.therapists.map(t => `
                    <option value="${t.id}">
                      ${t.name} • ${t.specialization} (${t.rating} ★)
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- STEP 2: DATE & TIME SLOTS -->
            <div id="booking-step-2" class="booking-step-content" style="display:none;">
              <h4 style="margin-bottom:14px;">Choose Appointment Date & Time</h4>
              <div class="form-group">
                <label>Select Date</label>
                <input type="date" id="book-date-input" class="form-control" onchange="Booking.fetchAvailableSlots()">
              </div>
              <div class="form-group">
                <label>Available Time Slots for Selected Date</label>
                <div id="slots-container" class="slots-grid">
                  <p class="text-muted" style="grid-column:1/-1;">Please select a date above to view open slots.</p>
                </div>
              </div>
            </div>

            <!-- STEP 3: CUSTOMER DETAILS & HEALTH NOTES -->
            <div id="booking-step-3" class="booking-step-content" style="display:none;">
              <h4 style="margin-bottom:14px;">Client Details & Wellness Preferences</h4>
              <div id="booking-client-status" style="margin-bottom:12px;"></div>
              <div class="form-row">
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" id="book-cust-name" class="form-control" placeholder="e.g. Terence Mwaaki">
                </div>
                <div class="form-group">
                  <label>Phone Number (M-Pesa)</label>
                  <input type="tel" id="book-cust-phone" class="form-control" placeholder="07XXXXXXXX" maxlength="10" inputmode="numeric" oninput="this.value=this.value.replace(/\D/g,'').slice(0,10)">
                </div>
              </div>
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="book-cust-email" class="form-control" placeholder="client@example.com">
              </div>
              <div class="form-group" id="book-pass-group">
                <label>Account Password <small class="text-muted">(Optional - defaults to Client@123)</small></label>
                <input type="password" id="book-cust-pass" class="form-control" placeholder="Set a password for your account">
              </div>
              <div class="form-group">
                <label>Special Focus Areas, Pressure Preferences or Health Notes</label>
                <textarea id="book-cust-notes" class="form-control" rows="3" placeholder="e.g. Chronic lower back pain, prefer medium-firm pressure, allergic to nut oils..."></textarea>
              </div>
            </div>

            <!-- STEP 4: PAYMENT SELECTION & CONFIRMATION -->
            <div id="booking-step-4" class="booking-step-content" style="display:none;">
              <h4 style="margin-bottom:14px;">Select Payment Method</h4>
              <div class="payment-methods-grid">
                <div class="pay-option-card active" id="pay-opt-mpesa" onclick="Booking.selectPayMethod('M-Pesa')">
                  <i class="fas fa-mobile-alt text-success"></i>
                  <h5>Safaricom M-Pesa</h5>
                  <span style="font-size:0.75rem; color:var(--text-muted);">Instant STK Push</span>
                </div>
                <div class="pay-option-card" id="pay-opt-card" onclick="Booking.selectPayMethod('Credit/Debit Card')">
                  <i class="fas fa-credit-card text-gold"></i>
                  <h5>Credit / Debit Card</h5>
                  <span style="font-size:0.75rem; color:var(--text-muted);">Visa / Mastercard</span>
                </div>
                <div class="pay-option-card" id="pay-opt-cash" onclick="Booking.selectPayMethod('Cash')">
                  <i class="fas fa-hand-holding-usd text-primary"></i>
                  <h5>Cash at Parlor</h5>
                  <span style="font-size:0.75rem; color:var(--text-muted);">Pay upon arrival</span>
                </div>
              </div>

              <div id="mpesa-fields" style="background:var(--success-bg); padding:18px; border-radius:12px; margin-bottom:20px;">
                <h5 style="color:var(--success); margin-bottom:8px;"><i class="fas fa-shield-alt"></i> M-Pesa Express Checkout</h5>
                <p style="font-size:0.84rem; color:var(--text-dark); margin-bottom:12px;">You will receive an instant STK PIN prompt on your Safaricom mobile phone.</p>

                <!-- Business M-Pesa receiving details -->
                <div style="background:#fff; border:1px solid #A9DFBF; border-radius:8px; padding:12px 14px; margin-bottom:12px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                  <div>
                    <div style="font-size:0.68rem; text-transform:uppercase; color:#27AE60; font-weight:700; margin-bottom:3px;"><i class="fas fa-mobile-alt"></i> Pay via M-Pesa Paybill</div>
                    <div style="font-size:1.3rem; font-weight:900; color:#1a5c38; font-family:monospace; letter-spacing:1px;">400200</div>
                    <div style="font-size:0.78rem; color:#555; margin-top:1px;">Account No: <strong>Your Booking Ref</strong></div>
                  </div>
                  <div style="border-left:1px solid #A9DFBF; padding-left:12px;">
                    <div style="font-size:0.68rem; text-transform:uppercase; color:#27AE60; font-weight:700; margin-bottom:3px;"><i class="fas fa-university"></i> Bank Transfer</div>
                    <div style="font-size:0.82rem; font-weight:700; color:#1a5c38;">Equity Bank Kenya</div>
                    <div style="font-size:0.78rem; color:#555;">Acc: <strong style="font-family:monospace;">0023456789</strong></div>
                    <div style="font-size:0.75rem; color:#777; margin-top:1px;">Buy Goods Till: <strong>5278441</strong></div>
                  </div>
                </div>

                <div class="form-group" style="margin-bottom:0;">
                  <label>M-Pesa Phone Number</label>
                  <input type="text" id="book-mpesa-number" class="form-control" placeholder="+2547XXXXXXXX">
                </div>
              </div>

              <!-- Booking Order Review -->
              <div style="background:#FAFAF8; border:1px solid var(--border); border-radius:12px; padding:20px;">
                <h5 style="margin-bottom:10px; color:var(--primary);"><i class="fas fa-file-invoice"></i> Booking Summary</h5>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.9rem;">
                  <span>Service:</span>
                  <strong id="final-summary-service">--</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.9rem;">
                  <span>Date & Time:</span>
                  <strong id="final-summary-datetime">--</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.9rem;">
                  <span>Therapist:</span>
                  <strong id="final-summary-therapist">--</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:12px; padding-top:10px; border-top:1px dashed var(--border); font-size:1.1rem;">
                  <strong>Total Amount Due:</strong>
                  <strong style="color:var(--primary);">KES <span id="final-summary-total">0</span></strong>
                </div>
              </div>
            </div>

            <!-- SUCCESS CONFIRMATION MODAL STATE -->
            <div id="booking-success-view" style="display:none; text-align:center; padding:20px 0;">
              <div style="width:72px; height:72px; border-radius:50%; background:var(--success-bg); color:var(--success); display:flex; align-items:center; justify-content:center; font-size:2.2rem; margin:0 auto 18px;">
                <i class="fas fa-check"></i>
              </div>
              <h3 style="color:var(--primary); margin-bottom:6px;">Booking Confirmed!</h3>
              <p class="text-muted" style="margin-bottom:20px;">Your massage appointment has been scheduled successfully.</p>
              
              <div id="success-receipt-details" class="receipt-box" style="text-align:left;">
                <!-- Populated dynamically -->
              </div>

              <div style="display:flex; justify-content:center; gap:12px;">
                <button class="btn btn-outline btn-sm" onclick="window.print()">
                  <i class="fas fa-print"></i> Print Receipt
                </button>
                <button class="btn btn-gold btn-sm" onclick="Booking.closeModal(); App.openPortal();">
                  <i class="fas fa-th-large"></i> View in Client Portal
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer" id="booking-modal-footer">
            <button class="btn btn-outline btn-sm" id="btn-wizard-prev" style="display:none;" onclick="Booking.prevStep()">Back</button>
            <button class="btn btn-gold btn-sm" id="btn-wizard-next" onclick="Booking.nextStep()">Continue <i class="fas fa-arrow-right"></i></button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
  },

  openBookingModal() {
    this.initModal();
    this.currentStep = 1;

    // Refresh dynamic options from latest loaded services and therapists
    const srvSelect = document.getElementById('book-service-select');
    if (srvSelect && App.services && App.services.length > 0) {
      const curVal = srvSelect.value;
      srvSelect.innerHTML = `
        <option value="">-- Choose a Massage Service --</option>
        ${App.services.map(s => `
          <option value="${s.id}" data-price="${s.price_kes}" data-duration="${s.duration_mins}">
            ${s.name} (${s.duration_mins} mins) - KES ${Number(s.price_kes).toLocaleString()}
          </option>
        `).join('')}
      `;
      if (curVal) srvSelect.value = curVal;
    }

    const thSelect = document.getElementById('book-therapist-select');
    if (thSelect && App.therapists && App.therapists.length > 0) {
      const curVal = thSelect.value || 'any';
      thSelect.innerHTML = `
        <option value="any">✨ Any Available Certified Therapist (Recommended)</option>
        ${App.therapists.map(t => `
          <option value="${t.id}">
            ${t.name} • ${t.specialization} (${t.rating} ★)
          </option>
        `).join('')}
      `;
      thSelect.value = curVal;
    }

    this.goToStep(1);

    // Set minimum date to today
    const dateInput = document.getElementById('book-date-input');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;

    // Prefill user details if logged in
    if (App.currentUser) {
      const cleanP = App.normalizePhone ? App.normalizePhone(App.currentUser.phone) : App.currentUser.phone;
      document.getElementById('book-cust-name').value = App.currentUser.name || '';
      document.getElementById('book-cust-email').value = App.currentUser.email || '';
      document.getElementById('book-cust-phone').value = cleanP || '';
      document.getElementById('book-mpesa-number').value = cleanP || '';
    }

    document.getElementById('booking-success-view').style.display = 'none';
    document.getElementById('booking-modal-footer').style.display = 'flex';
    document.getElementById('booking-modal').classList.add('show');

    // Trigger slots fetch for default date
    this.fetchAvailableSlots();
  },

  selectServiceAndOpen(serviceId) {
    this.openBookingModal();
    const select = document.getElementById('book-service-select');
    select.value = serviceId;
    this.onServiceChanged();
  },

  selectTherapistAndOpen(therapistId) {
    this.openBookingModal();
    const select = document.getElementById('book-therapist-select');
    select.value = therapistId;
  },

  closeModal() {
    App.closeModal('booking-modal');
  },

  onServiceChanged() {
    const select = document.getElementById('book-service-select');
    const opt = select.options[select.selectedIndex];
    const summaryCard = document.getElementById('service-summary-card');

    if (select.value) {
      const srv = App.services.find(s => s.id == select.value);
      if (srv) {
        document.getElementById('sum-srv-name').innerText = srv.name;
        document.getElementById('sum-srv-desc').innerText = srv.description;
        document.getElementById('sum-srv-price').innerText = Number(srv.price_kes).toLocaleString();
        document.getElementById('sum-srv-duration').innerText = srv.duration_mins;
        summaryCard.style.display = 'block';
      }
    } else {
      summaryCard.style.display = 'none';
    }
  },

  async fetchAvailableSlots() {
    const date = document.getElementById('book-date-input').value;
    const therapistId = document.getElementById('book-therapist-select').value;
    const container = document.getElementById('slots-container');

    if (!date) return;
    container.innerHTML = '<span class="text-muted">Loading open appointment slots...</span>';

    try {
      const res = await App.api(`/api/scheduling/availability?date=${date}&therapist_id=${therapistId}`);
      container.innerHTML = res.availableSlots.map(s => `
        <div class="slot-pill ${s.isAvailable ? '' : 'disabled'} ${this.data.appointment_time === s.time ? 'selected' : ''}"
             onclick="${s.isAvailable ? `Booking.selectSlot('${s.time}', this)` : ''}">
          ${s.time}
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<span style="color:red;">Error loading slots: ${err.message}</span>`;
    }
  },

  selectSlot(time, element) {
    this.data.appointment_time = time;
    document.querySelectorAll('.slot-pill').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
  },

  selectPayMethod(method) {
    this.data.payment_method = method;
    document.querySelectorAll('.pay-option-card').forEach(c => c.classList.remove('active'));
    if (method === 'M-Pesa') {
      document.getElementById('pay-opt-mpesa').classList.add('active');
      document.getElementById('mpesa-fields').style.display = 'block';
    } else if (method === 'Credit/Debit Card') {
      document.getElementById('pay-opt-card').classList.add('active');
      document.getElementById('mpesa-fields').style.display = 'none';
    } else {
      document.getElementById('pay-opt-cash').classList.add('active');
      document.getElementById('mpesa-fields').style.display = 'none';
    }
  },

  goToStep(step) {
    this.currentStep = step;
    for (let i = 1; i <= 4; i++) {
      const content = document.getElementById(`booking-step-${i}`);
      const ind = document.getElementById(`step-ind-${i}`);
      if (content) content.style.display = (i === step) ? 'block' : 'none';
      if (ind) {
        ind.classList.remove('active', 'completed');
        if (i === step) ind.classList.add('active');
        if (i < step) ind.classList.add('completed');
      }
    }

    if (step === 3) {
      this.updateStep3UI();
    }

    const prevBtn = document.getElementById('btn-wizard-prev');
    const nextBtn = document.getElementById('btn-wizard-next');
    prevBtn.style.display = step > 1 ? 'inline-flex' : 'none';

    if (step === 4) {
      nextBtn.innerHTML = '<i class="fas fa-lock"></i> Confirm & Book Appointment';
      this.updateFinalSummary();
    } else {
      nextBtn.innerHTML = 'Continue <i class="fas fa-arrow-right"></i>';
    }
  },

  updateStep3UI() {
    const statusEl = document.getElementById('booking-client-status');
    const passGroup = document.getElementById('book-pass-group');
    if (!statusEl) return;

    if (App.currentUser) {
      statusEl.innerHTML = `
        <div style="background:#E8F5E9; border:1px solid #C8E6C9; color:#2E7D32; padding:10px 14px; border-radius:8px; display:flex; align-items:center; gap:10px; font-size:0.86rem;">
          <i class="fas fa-check-circle" style="font-size:1.1rem;"></i>
          <div>
            <strong>Booking as active member:</strong> ${App.currentUser.name} (${App.currentUser.email})
          </div>
        </div>
      `;
      if (passGroup) passGroup.style.display = 'none';
      const nameEl = document.getElementById('book-cust-name');
      const emailEl = document.getElementById('book-cust-email');
      const phoneEl = document.getElementById('book-cust-phone');
      if (nameEl && !nameEl.value) nameEl.value = App.currentUser.name;
      if (emailEl && !emailEl.value) emailEl.value = App.currentUser.email;
      if (phoneEl && !phoneEl.value) phoneEl.value = App.currentUser.phone;
    } else {
      statusEl.innerHTML = `
        <div style="background:#FFF9E6; border:1px solid #FFE082; color:#5D4037; padding:10px 14px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; font-size:0.84rem;">
          <span><i class="fas fa-user-check text-gold"></i> A member account will be created automatically for you.</span>
          <a href="javascript:void(0)" onclick="Booking.promptLogin()" style="color:var(--primary); font-weight:700; text-decoration:underline;">Already registered? Sign In</a>
        </div>
      `;
      if (passGroup) passGroup.style.display = 'block';
    }
  },

  promptLogin() {
    App.openAuthModal('login');
  },

  nextStep() {
    if (this.currentStep === 1) {
      const srvId = document.getElementById('book-service-select').value;
      if (!srvId) return App.showToast('Please select a massage service', 'warning');
      this.data.service_id = Number(srvId);
      this.data.therapist_id = document.getElementById('book-therapist-select').value;
      this.fetchAvailableSlots();
      this.goToStep(2);
    } else if (this.currentStep === 2) {
      const date = document.getElementById('book-date-input').value;
      if (!date) return App.showToast('Please choose a date', 'warning');
      if (!this.data.appointment_time) return App.showToast('Please select a time slot', 'warning');
      this.data.appointment_date = date;
      this.goToStep(3);
    } else if (this.currentStep === 3) {
      const name = document.getElementById('book-cust-name').value.trim();
      const phone = document.getElementById('book-cust-phone').value.trim();
      const email = document.getElementById('book-cust-email').value.trim();
      if (!name || !phone || !email) return App.showToast('Please enter your name, phone, and email', 'warning');

      if (!App.validatePhone(phone)) {
        return App.showToast('Please enter a valid 10-digit Kenyan phone number (07XXXXXXXX or 01XXXXXXXX)', 'warning');
      }

      const cleanPhone = App.normalizePhone ? App.normalizePhone(phone) : phone;
      this.data.customer_name = name;
      this.data.customer_phone = cleanPhone;
      this.data.customer_email = email;
      this.data.notes = document.getElementById('book-cust-notes').value.trim();

      const passEl = document.getElementById('book-cust-pass');
      if (passEl && passEl.value) {
        if (passEl.value.trim().length < 6) {
          return App.showToast('Password must be at least 6 characters long', 'warning');
        }
        this.data.customer_password = passEl.value.trim();
      }

      const mpesaInput = document.getElementById('book-mpesa-number');
      if (!mpesaInput.value || mpesaInput.value === 'true' || !App.validatePhone(mpesaInput.value)) {
        mpesaInput.value = cleanPhone;
      }

      this.goToStep(4);
    } else if (this.currentStep === 4) {
      this.submitBooking();
    }
  },

  prevStep() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  },

  updateFinalSummary() {
    const srv = App.services.find(s => s.id == this.data.service_id);
    let thName = 'Any Certified Specialist';
    if (this.data.therapist_id !== 'any') {
      const th = App.therapists.find(t => t.id == this.data.therapist_id);
      if (th) thName = th.name;
    }

    document.getElementById('final-summary-service').innerText = srv ? srv.name : '';
    document.getElementById('final-summary-datetime').innerText = `${this.data.appointment_date} at ${this.data.appointment_time}`;
    document.getElementById('final-summary-therapist').innerText = thName;
    document.getElementById('final-summary-total').innerText = srv ? Number(srv.price_kes).toLocaleString() : '0';
  },

  async submitBooking() {
    const nextBtn = document.getElementById('btn-wizard-next');
    nextBtn.disabled = true;
    nextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
      const mpesaField = document.getElementById('book-mpesa-number');
      const cleanMpesa = App.normalizePhone ? App.normalizePhone(mpesaField ? mpesaField.value.trim() : '') : '';
      const payload = {
        ...this.data,
        mpesa_phone: cleanMpesa || this.data.customer_phone
      };

      const res = await App.api('/api/appointments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Automatically authenticate customer so they stay logged in without needing manual login
      if (res.token && res.user && !App.currentUser) {
        App.token = res.token;
        App.currentUser = res.user;
        localStorage.setItem('smp_token', res.token);
        App.updateAuthUI();
      }

      // If customer dashboard is currently active, refresh their appointment list
      if (typeof Customer !== 'undefined' && typeof Customer.loadAppointments === 'function') {
        const custArea = document.getElementById('customer-view-area');
        if (custArea) {
          Customer.loadAppointments();
        }
      }

      // Show confirmation view
      for (let i = 1; i <= 4; i++) {
        document.getElementById(`booking-step-${i}`).style.display = 'none';
      }
      document.querySelector('.booking-steps-bar').style.display = 'none';
      document.getElementById('booking-modal-footer').style.display = 'none';

      const appt = res.appointment;
      const receiptContainer = document.getElementById('success-receipt-details');
      receiptContainer.innerHTML = `
        <div class="receipt-header">
          <h4 style="margin:0; color:var(--primary);">STEVE'S MASSAGE PARLOR</h4>
          <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Official Booking & Payment Receipt</span>
        </div>
        <div class="receipt-row">
          <span class="text-muted">Booking Reference:</span>
          <strong>${appt.reference_no}</strong>
        </div>
        <div class="receipt-row">
          <span class="text-muted">Date & Time:</span>
          <span>${appt.appointment_date} at ${appt.appointment_time}</span>
        </div>
        <div class="receipt-row">
          <span class="text-muted">Therapist:</span>
          <span>${appt.therapist_name}</span>
        </div>
        <div class="receipt-row">
          <span class="text-muted">Service / Treatment:</span>
          <span>${appt.service_name}</span>
        </div>
        <div class="receipt-row">
          <span class="text-muted">Payment Method:</span>
          <span>${this.data.payment_method} (${appt.payment_status})</span>
        </div>
        <div class="receipt-row">
          <span class="text-muted">Transaction Ref:</span>
          <code>${appt.transaction_ref}</code>
        </div>
        <div class="receipt-row" style="background:#FFF9E6; border:1px solid #FFE082; padding:10px; border-radius:6px; margin:10px 0;">
          <span style="color:#795548; font-weight:600;"><i class="fas fa-shield-alt text-gold"></i> Finance Approval:</span>
          <span class="badge badge-warning" style="font-size:0.8rem; padding:4px 10px;">
            <i class="fas fa-clock"></i> Awaiting Finance Clearance (Patrick Mutua)
          </span>
        </div>
        <div class="receipt-row" style="margin-top:12px; padding-top:10px; border-top:1px dashed var(--border); font-size:1.1rem;">
          <strong>Total Paid / Due:</strong>
          <strong style="color:var(--primary);">KES ${Number(appt.price_kes).toLocaleString()}</strong>
        </div>
        <div style="margin-top:14px; background:var(--sage-light); padding:10px 14px; border-radius:8px; font-size:0.8rem; color:var(--primary);">
          <i class="fas fa-sms"></i> <strong>SMS Notification Sent:</strong> A confirmation SMS with directions and reference has been dispatched to ${this.data.customer_phone}. Payment record is submitted for Finance verification.
        </div>
        <div style="margin-top:16px; display:flex; gap:10px; justify-content:center;">
          <button class="btn btn-gold btn-sm" onclick="App.closeModal('booking-modal'); App.openPortal('customer');">
            <i class="fas fa-user-circle"></i> View in My Client Portal
          </button>
          <button class="btn btn-outline btn-sm" onclick="window.print()">
            <i class="fas fa-print"></i> Print Voucher
          </button>
        </div>
      `;

      document.getElementById('booking-success-view').style.display = 'block';
      App.showToast('Appointment successfully confirmed!');
    } catch (err) {
      App.showToast(err.message, 'danger');
      nextBtn.disabled = false;
      nextBtn.innerHTML = '<i class="fas fa-lock"></i> Confirm & Book Appointment';
    }
  },

  viewReceipt(ref, service, therapist, date, time, price, method) {
    let receiptModal = document.getElementById('receipt-view-modal');
    if (!receiptModal) {
      receiptModal = document.createElement('div');
      receiptModal.id = 'receipt-view-modal';
      receiptModal.className = 'modal-overlay';
      receiptModal.innerHTML = `
        <div class="modal-box">
          <div class="modal-header">
            <h3><i class="fas fa-receipt text-gold"></i> Service Receipt</h3>
            <button class="modal-close-btn" onclick="App.closeModal('receipt-view-modal')">&times;</button>
          </div>
          <div class="modal-body print-area" id="receipt-modal-content"></div>
          <div class="modal-footer no-print">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('receipt-view-modal')">Close</button>
            <button class="btn btn-gold btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print</button>
          </div>
        </div>
      `;
      document.body.appendChild(receiptModal);
    }

    document.getElementById('receipt-modal-content').innerHTML = `
      <div class="receipt-header">
        <h3 style="color:var(--primary); margin:0;">STEVE'S MASSAGE PARLOR</h3>
        <p style="font-size:0.82rem; color:var(--text-muted); margin:0;">Valley Arcade, Gitanga Rd, Nairobi • +254 712 345 678</p>
      </div>
      <div class="receipt-row"><span class="text-muted">Receipt Ref:</span><strong>${ref}</strong></div>
      <div class="receipt-row"><span class="text-muted">Client Name:</span><span>${App.currentUser ? App.currentUser.name : 'Valued Client'}</span></div>
      <div class="receipt-row"><span class="text-muted">Session:</span><span>${service}</span></div>
      <div class="receipt-row"><span class="text-muted">Assigned Specialist:</span><span>${therapist}</span></div>
      <div class="receipt-row"><span class="text-muted">Date & Time:</span><span>${date} @ ${time}</span></div>
      <div class="receipt-row"><span class="text-muted">Payment Mode:</span><span>${method}</span></div>
      <div class="receipt-row" style="font-size:1.15rem; margin-top:14px; padding-top:10px; border-top:1px dashed var(--border);">
        <strong>Total Amount:</strong>
        <strong>KES ${Number(price).toLocaleString()}</strong>
      </div>
      <div style="text-align:center; margin-top:20px; font-size:0.75rem; color:var(--text-muted);">
        Complies with Kenya Data Protection Act 2019 • Thank you for choosing Steve's Massage Parlor!
      </div>
    `;

    receiptModal.classList.add('show');
  }
};
