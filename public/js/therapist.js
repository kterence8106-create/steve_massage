// Steve's Massage Parlor Management System - Therapist Portal
// DBIT 226 - Terence Mwaaki (BIT-0-8106-3/2025)

const Therapist = {
  _pollTimer: null,
  _lastNotifCount: 0,
  _currentTherapistEmail: null,

  async init() {
    // Store the therapist email for polling/switch
    this._currentTherapistEmail = App.currentUser ? App.currentUser.email : null;

    const portal = document.getElementById('portal-content');
    portal.innerHTML = `
      <div class="portal-header">
        <div>
          <h2><i class="fas fa-user-md text-gold"></i> Therapist Clinical Portal</h2>
          <p class="text-muted" style="margin:0; font-size:0.85rem;">Welcome, <strong>${App.currentUser.name}</strong> &bull; Certified Wellness Therapist</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick="Therapist.loadSchedule()" title="Refresh now">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
          <button class="btn btn-outline btn-sm" onclick="App.closePortal()">
            <i class="fas fa-eye"></i> Public Site
          </button>
        </div>
      </div>

      <div class="portal-nav-tabs" style="margin-bottom:0;">
        <button class="portal-tab active" id="th-tab-sched" onclick="Therapist.loadSchedule()">
          <i class="fas fa-calendar-alt"></i> My Client Schedule
        </button>
        <button class="portal-tab" id="th-tab-notifs" onclick="Therapist.loadNotifications()">
          <i class="fas fa-bell"></i> Client Notifications
          <span id="th-notif-badge" style="display:none; background:#E63946; color:#fff; border-radius:50%; font-size:0.7rem; font-weight:700; padding:1px 6px; margin-left:5px; vertical-align:middle;">0</span>
        </button>
        <button class="portal-tab" id="th-tab-avail" onclick="Therapist.loadAvailabilitySettings()">
          <i class="fas fa-user-clock"></i> Working Hours &amp; Roster
        </button>
      </div>

      <div id="therapist-main-view" style="margin-top:0;"></div>
    `;

    this._highlightSwitchBtn();
    await this.loadSchedule();
    this._startPolling();
  },

  _highlightSwitchBtn() {
    const email = App.currentUser ? App.currentUser.email.toLowerCase() : '';
    const map = {
      'grace@stevesmassage.co.ke': 'sw-btn-grace',
      'david@stevesmassage.co.ke': 'sw-btn-david',
      'amina@stevesmassage.co.ke': 'sw-btn-amina',
      'brian@stevesmassage.co.ke': 'sw-btn-brian',
    };
    Object.entries(map).forEach(([e, btnId]) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      if (email === e) {
        btn.className = 'btn btn-gold btn-sm';
        btn.style.cssText = 'font-size:0.78rem; padding:5px 12px; font-weight:700;';
      } else {
        btn.className = 'btn btn-outline btn-sm';
        btn.style.cssText = 'font-size:0.78rem; padding:5px 12px;';
      }
    });
  },

  async switchTherapist(email, pass) {
    this._stopPolling();
    App.showToast(`Switching to ${email.split('@')[0]}…`);
    try {
      await App.login(email, pass);
      // login() calls openPortal() → Therapist.init() automatically
    } catch (e) {
      // Fallback: set demo user manually
      const demo = App.DEMO_USERS[email];
      if (demo) {
        App.token = 'demo_token_' + Date.now();
        App.currentUser = demo;
        localStorage.setItem('smp_token', App.token);
        App.updateAuthUI();
        App.openPortal();
      } else {
        App.showToast('Could not switch therapist: ' + e.message, 'danger');
      }
    }
  },

  _setActiveTab(tabId) {
    ['th-tab-sched', 'th-tab-notifs', 'th-tab-avail'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
  },

  _startPolling() {
    this._stopPolling();
    // Poll every 9 seconds for new appointments and notifications
    this._pollTimer = setInterval(async () => {
      await this._pollNewData();
    }, 9000);
  },

  _stopPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  },

  async _pollNewData() {
    try {
      // Check unread notification count
      const notifs = await App.api('/api/notifications?unread=1');
      const unread = Array.isArray(notifs) ? notifs.filter(n => !n.is_read).length : 0;

      const badge = document.getElementById('th-notif-badge');
      if (badge) {
        if (unread > 0) {
          badge.textContent = unread > 9 ? '9+' : unread;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }

      // If count changed and we're on schedule tab, flash a live alert banner
      if (unread > this._lastNotifCount) {
        this._showNewBookingAlert(unread);
        const activeTab = document.querySelector('.portal-tab.active');
        if (activeTab && activeTab.id === 'th-tab-sched') {
          await this.loadSchedule(true); // silent reload
        }
      }
      this._lastNotifCount = unread;
    } catch (e) {
      // Silently ignore polling errors
    }
  },

  _showNewBookingAlert(count) {
    // Remove any existing alert
    const old = document.getElementById('th-new-booking-alert');
    if (old) old.remove();

    const container = document.getElementById('therapist-main-view');
    if (!container) return;

    const alert = document.createElement('div');
    alert.id = 'th-new-booking-alert';
    alert.style.cssText = `
      background: linear-gradient(135deg, #2D5A27, #4A7C59);
      color: #fff;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 4px 16px rgba(45,90,39,0.25);
      animation: fadeIn 0.4s ease;
    `;
    alert.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <i class="fas fa-bell" style="font-size:1.3rem; animation: pulse 1s infinite;"></i>
        <div>
          <strong style="font-size:0.95rem;">📅 New Client Appointment!</strong>
          <div style="font-size:0.82rem; opacity:0.9; margin-top:2px;">You have ${count} unread notification${count > 1 ? 's' : ''}. Your schedule has been updated.</div>
        </div>
      </div>
      <div style="display:flex; gap:8px;">
        <button onclick="Therapist.loadNotifications()" style="background:rgba(255,255,255,0.2); color:#fff; border:1px solid rgba(255,255,255,0.4); border-radius:6px; padding:6px 14px; cursor:pointer; font-size:0.82rem; font-weight:600;">
          <i class="fas fa-bell"></i> View
        </button>
        <button onclick="document.getElementById('th-new-booking-alert').remove(); Therapist.loadSchedule();" style="background:rgba(255,255,255,0.2); color:#fff; border:1px solid rgba(255,255,255,0.4); border-radius:6px; padding:6px 14px; cursor:pointer; font-size:0.82rem;">
          ✕
        </button>
      </div>
    `;
    container.insertBefore(alert, container.firstChild);

    // Auto-dismiss after 15 seconds
    setTimeout(() => { if (alert.parentNode) alert.remove(); }, 15000);
  },

  async loadSchedule(silent = false) {
    this._setActiveTab('th-tab-sched');

    const container = document.getElementById('therapist-main-view');
    if (!silent) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px;">
          <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:var(--primary);"></i>
          <p class="text-muted" style="margin-top:12px;">Loading your appointments…</p>
        </div>`;
    }

    try {
      const appointments = await App.api('/api/appointments');

      // Check for any upcoming appointment in next 30 mins
      const now = new Date();
      const upcoming = appointments.filter(a => {
        const apptDT = new Date(`${a.appointment_date}T${a.appointment_time}`);
        const diffMins = (apptDT - now) / 60000;
        return diffMins >= 0 && diffMins <= 30 && a.status !== 'Cancelled' && a.status !== 'Completed';
      });

      const upcomingBanner = upcoming.length > 0 ? `
        <div style="background:#FFF8E7; border:1px solid #F4A923; border-radius:10px; padding:12px 18px; margin-bottom:16px; display:flex; align-items:center; gap:12px;">
          <i class="fas fa-clock" style="color:#F4A923; font-size:1.3rem;"></i>
          <div>
            <strong style="font-size:0.9rem; color:#7A5C00;">⏰ Upcoming Session Alert</strong>
            <div style="font-size:0.82rem; color:#7A5C00; margin-top:2px;">
              ${upcoming.map(a => `<strong>${a.customer_name}</strong> for <em>${a.service_name}</em> at <strong>${a.appointment_time}</strong> (in &lt;30 min)`).join(' | ')}
            </div>
          </div>
        </div>` : '';

      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appointments.filter(a => a.appointment_date === today);
      const totalAppts = appointments.length;

      container.innerHTML = `
        ${upcomingBanner}
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3><i class="fas fa-calendar-alt text-gold"></i> Assigned Massage Sessions</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:4px 0 0;">Track sessions, enter treatment findings, and record care recommendations</p>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
              <span class="badge badge-primary">${totalAppts} Total</span>
              <span class="badge badge-success">${todayAppts.length} Today</span>
              <button class="btn btn-outline btn-sm" onclick="Therapist.loadSchedule()">
                <i class="fas fa-sync-alt"></i> Refresh
              </button>
            </div>
          </div>

          ${appointments.length === 0 ? `
            <div style="text-align:center; padding:60px 20px; color:var(--text-muted);">
              <i class="fas fa-calendar-check" style="font-size:3rem; opacity:0.3; margin-bottom:16px; display:block;"></i>
              <h4>No appointments yet</h4>
              <p style="font-size:0.85rem;">Client bookings will appear here automatically once confirmed.</p>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Booking Ref</th>
                    <th>Client Name</th>
                    <th>Contact</th>
                    <th>Treatment</th>
                    <th>Date &amp; Time</th>
                    <th>Client Notes</th>
                    <th>Status</th>
                    <th>Clinical Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${appointments.map(a => {
                    const isToday = a.appointment_date === today;
                    return `
                    <tr style="${isToday ? 'background:#FAFFF8;' : ''}">
                      <td><strong style="color:var(--primary);">${a.reference_no}</strong>${isToday ? ' <span class="badge badge-success" style="font-size:0.65rem; padding:2px 6px;">Today</span>' : ''}</td>
                      <td><strong>${a.customer_name}</strong></td>
                      <td><small>${a.customer_phone || '—'}</small></td>
                      <td><span class="badge badge-primary" style="font-size:0.75rem;">${a.service_name}</span></td>
                      <td style="white-space:nowrap;">
                        <strong>${a.appointment_date}</strong><br>
                        <small style="color:var(--text-muted);">${a.appointment_time}</small>
                      </td>
                      <td style="max-width:180px;"><small class="text-muted">${a.notes || '<em>None</em>'}</small></td>
                      <td>
                        <select class="form-control" style="padding:4px 8px; font-size:0.78rem; width:130px;" onchange="Therapist.updateStatus(${a.id}, this.value)">
                          <option value="Confirmed"  ${a.status === 'Confirmed'  ? 'selected' : ''}>Confirmed</option>
                          <option value="In-Session" ${a.status === 'In-Session' ? 'selected' : ''}>In-Session</option>
                          <option value="Completed"  ${a.status === 'Completed'  ? 'selected' : ''}>Completed</option>
                          <option value="Cancelled"  ${a.status === 'Cancelled'  ? 'selected' : ''}>Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <button class="btn btn-gold btn-sm" onclick="Therapist.openNotesModal(${a.id}, '${a.customer_name.replace(/'/g, "\\'")}', '${(a.treatment_notes || '').replace(/'/g, "\\'")}')">
                          <i class="fas fa-notes-medical"></i> ${a.treatment_notes ? 'Edit Notes' : 'Add Notes'}
                        </button>
                      </td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--danger);">
          <i class="fas fa-exclamation-circle" style="font-size:2rem; margin-bottom:12px; display:block;"></i>
          <strong>Could not load appointments</strong>
          <p style="font-size:0.85rem; margin-top:8px;">${err.message}</p>
          <button class="btn btn-outline btn-sm" onclick="Therapist.loadSchedule()"><i class="fas fa-sync-alt"></i> Retry</button>
        </div>`;
    }
  },

  async updateStatus(id, newStatus) {
    try {
      await App.api(`/api/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      App.showToast(`Session marked as ${newStatus}`);
      // Reload silently so dropdown doesn't jump
      setTimeout(() => Therapist.loadSchedule(true), 600);
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  },

  openNotesModal(apptId, clientName, existingNotes) {
    let modal = document.getElementById('treatment-notes-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'treatment-notes-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-box">
          <div class="modal-header">
            <h3><i class="fas fa-file-medical-alt text-gold"></i> Clinical Treatment Record</h3>
            <button class="modal-close-btn" onclick="App.closeModal('treatment-notes-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <h5 id="notes-client-name" style="color:var(--primary); margin-bottom:12px;"></h5>
            <div class="form-group">
              <label>Therapist Clinical Observations &amp; Follow-Up Advice</label>
              <textarea id="treatment-notes-input" class="form-control" rows="5"
                placeholder="Document muscle tightness, knots relieved, trigger points treated, client response, recommended home care / water intake…"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" onclick="App.closeModal('treatment-notes-modal')">Cancel</button>
            <button class="btn btn-gold btn-sm" id="btn-save-notes"><i class="fas fa-save"></i> Save Clinical Notes</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    document.getElementById('notes-client-name').innerText = `Client: ${clientName}`;
    document.getElementById('treatment-notes-input').value = existingNotes || '';
    document.getElementById('btn-save-notes').onclick = async () => {
      const notes = document.getElementById('treatment-notes-input').value.trim();
      try {
        await App.api(`/api/appointments/${apptId}`, {
          method: 'PUT',
          body: JSON.stringify({ treatment_notes: notes })
        });
        App.showToast('Treatment observations saved to client record.');
        App.closeModal('treatment-notes-modal');
        Therapist.loadSchedule();
      } catch (err) {
        App.showToast(err.message, 'danger');
      }
    };

    modal.classList.add('show');
  },

  async loadNotifications() {
    this._setActiveTab('th-tab-notifs');

    const container = document.getElementById('therapist-main-view');
    container.innerHTML = `
      <div style="text-align:center; padding:40px;">
        <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:var(--primary);"></i>
        <p class="text-muted" style="margin-top:12px;">Loading notifications…</p>
      </div>`;

    try {
      const notifs = await App.api('/api/notifications');
      const unread = notifs.filter(n => !n.is_read).length;

      // Update badge
      const badge = document.getElementById('th-notif-badge');
      if (badge) {
        badge.textContent = unread > 9 ? '9+' : unread;
        badge.style.display = unread > 0 ? 'inline-block' : 'none';
      }
      this._lastNotifCount = unread;

      container.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div>
              <h3><i class="fas fa-bell text-gold"></i> Client Notifications</h3>
              <p class="text-muted" style="font-size:0.8rem; margin:4px 0 0;">Real-time alerts for new bookings, cancellations, and appointment updates</p>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
              ${unread > 0 ? `<span class="badge" style="background:#E63946; color:#fff;">${unread} Unread</span>` : '<span class="badge badge-success">All Read</span>'}
              ${unread > 0 ? `
                <button class="btn btn-outline btn-sm" onclick="Therapist.markAllRead()">
                  <i class="fas fa-check-double"></i> Mark All Read
                </button>` : ''}
              <button class="btn btn-outline btn-sm" onclick="Therapist.loadNotifications()">
                <i class="fas fa-sync-alt"></i> Refresh
              </button>
            </div>
          </div>

          ${notifs.length === 0 ? `
            <div style="text-align:center; padding:60px 20px; color:var(--text-muted);">
              <i class="fas fa-bell-slash" style="font-size:3rem; opacity:0.3; margin-bottom:16px; display:block;"></i>
              <h4>No notifications yet</h4>
              <p style="font-size:0.85rem;">Client bookings and schedule updates will appear here.</p>
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap:12px; padding:16px;">
              ${notifs.map(n => `
                <div style="
                  border-radius:10px;
                  border:1px solid ${n.is_read ? 'var(--border)' : '#4A7C59'};
                  background:${n.is_read ? '#FAFAFA' : '#F0FAF3'};
                  padding:14px 18px;
                  display:flex;
                  gap:14px;
                  align-items:flex-start;
                  transition:all 0.2s;">
                  <div style="
                    width:40px; height:40px; border-radius:50%;
                    background:${n.is_read ? '#E8E8E8' : 'linear-gradient(135deg,#2D5A27,#4A7C59)'};
                    color:${n.is_read ? 'var(--text-muted)' : '#fff'};
                    display:flex; align-items:center; justify-content:center;
                    font-size:1rem; flex-shrink:0;">
                    <i class="fas ${n.title && n.title.includes('Cancel') ? 'fa-times-circle' : 'fa-calendar-check'}"></i>
                  </div>
                  <div style="flex:1; min-width:0;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                      <strong style="font-size:0.88rem; color:${n.is_read ? 'var(--text-dark)' : 'var(--primary)'};">
                        ${n.title || 'Notification'}
                        ${!n.is_read ? '<span style="background:#E63946; color:#fff; border-radius:50%; font-size:0.65rem; padding:1px 5px; margin-left:6px; vertical-align:middle;">NEW</span>' : ''}
                      </strong>
                      <small class="text-muted" style="white-space:nowrap; font-size:0.75rem;">${n.created_at || ''}</small>
                    </div>
                    <p style="margin:6px 0 0; font-size:0.84rem; color:var(--text-muted); line-height:1.5;">${n.message || ''}</p>
                    ${!n.is_read ? `
                      <button onclick="Therapist.markRead(${n.id})" style="
                        background:transparent; border:1px solid var(--primary); color:var(--primary);
                        border-radius:6px; padding:4px 10px; font-size:0.75rem; cursor:pointer; margin-top:8px;">
                        <i class="fas fa-check"></i> Mark as Read
                      </button>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--danger);">
          <i class="fas fa-exclamation-circle" style="font-size:2rem; margin-bottom:12px; display:block;"></i>
          <strong>Could not load notifications</strong>
          <p style="font-size:0.85rem; margin-top:8px;">${err.message}</p>
          <button class="btn btn-outline btn-sm" onclick="Therapist.loadNotifications()"><i class="fas fa-sync-alt"></i> Retry</button>
        </div>`;
    }
  },

  async markRead(notifId) {
    try {
      await App.api(`/api/notifications/${notifId}/read`, { method: 'PUT' });
      await this.loadNotifications();
    } catch (e) {
      App.showToast('Could not mark as read: ' + e.message, 'danger');
    }
  },

  async markAllRead() {
    try {
      const notifs = await App.api('/api/notifications');
      const unread = notifs.filter(n => !n.is_read);
      await Promise.all(unread.map(n => App.api(`/api/notifications/${n.id}/read`, { method: 'PUT' })));
      App.showToast('All notifications marked as read.');
      await this.loadNotifications();
    } catch (e) {
      App.showToast('Error: ' + e.message, 'danger');
    }
  },

  loadAvailabilitySettings() {
    this._setActiveTab('th-tab-avail');

    const container = document.getElementById('therapist-main-view');
    container.innerHTML = `
      <div class="table-card" style="max-width:760px; margin:0 auto; padding:30px;">
        <div class="table-header-bar" style="margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid var(--border);">
          <div>
            <h3><i class="fas fa-user-clock text-gold"></i> Working Hours &amp; Shift Roster</h3>
            <p class="text-muted" style="font-size:0.8rem; margin:0;">Configure clinical working hours to sync automated customer booking slots</p>
          </div>
          <span class="badge badge-success">Active Roster</span>
        </div>

        <div class="form-group" style="margin-bottom:20px;">
          <label>Standard Working Shift Schedule</label>
          <select id="th-shift-select" class="form-control">
            <option value="09:00 - 18:00" selected>Day Shift: 09:00 AM – 06:00 PM (Standard Regular)</option>
            <option value="10:00 - 19:00">Midday Shift: 10:00 AM – 07:00 PM (Afternoon Focus)</option>
            <option value="11:00 - 20:00">Evening Shift: 11:00 AM – 08:00 PM (Executive Late Care)</option>
          </select>
        </div>

        <div style="margin-bottom:24px;">
          <label style="font-weight:600; font-size:0.9rem; margin-bottom:12px; display:block;">Weekly Availability by Day</label>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Day of Week</th>
                  <th>Status</th>
                  <th>Shift Start</th>
                  <th>Shift End</th>
                </tr>
              </thead>
              <tbody>
                ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => {
                  const isOff = idx === 6;
                  return `
                    <tr>
                      <td><strong>${day}</strong></td>
                      <td>
                        <input type="checkbox" id="avail-chk-${idx}" ${isOff ? '' : 'checked'}
                          onchange="document.getElementById('avail-start-${idx}').disabled = !this.checked; document.getElementById('avail-end-${idx}').disabled = !this.checked;">
                        <label for="avail-chk-${idx}" style="margin-left:6px; font-size:0.85rem; font-weight:normal;">${isOff ? 'Off Day' : 'On Duty'}</label>
                      </td>
                      <td>
                        <input type="time" id="avail-start-${idx}" class="form-control" value="09:00" style="width:120px; padding:4px 8px;" ${isOff ? 'disabled' : ''}>
                      </td>
                      <td>
                        <input type="time" id="avail-end-${idx}" class="form-control" value="18:00" style="width:120px; padding:4px 8px;" ${isOff ? 'disabled' : ''}>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div style="background:#F8F9F8; border:1px solid var(--border); border-radius:8px; padding:16px; margin-bottom:24px;">
          <h4 style="margin:0 0 6px; font-size:0.9rem; color:var(--primary);"><i class="fas fa-shield-alt text-gold"></i> Roster &amp; Turnaround Policy</h4>
          <p class="text-muted" style="margin:0; font-size:0.82rem; line-height:1.5;">
            Sessions include a mandatory 15-minute room sanitization &amp; linen turnaround buffer between clients.
            Emergency leave or shift swaps must be requested at least 24 hours in advance via the Admin portal.
          </p>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px;">
          <button class="btn btn-gold" onclick="App.showToast('Weekly roster and shift schedule saved successfully!')">
            <i class="fas fa-save"></i> Save Roster Changes
          </button>
        </div>
      </div>
    `;
  }
};
