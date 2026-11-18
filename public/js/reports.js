// Steve's Massage Parlor Management System - Reports & Analytics Module
// DBIT 226 - Specific Objective 4: Module for Generating Reports
// Terence Mwaaki (BIT-0-8106-3/2025) - Kenya Methodist University

const Reports = {
  async render() {
    const container = document.getElementById('admin-main-view');
    container.innerHTML = '<div style="text-align:center; padding:40px;">Synthesizing analytics and financial reports...</div>';

    try {
      const [dash, finance, appointments] = await Promise.all([
        App.api('/api/reports/dashboard'),
        App.api('/api/finance/overview'),
        App.api('/api/appointments')
      ]);

      container.innerHTML = `
        <div class="print-area">
          <div class="table-card" style="padding:28px; margin-bottom:24px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid var(--border); padding-bottom:18px; margin-bottom:20px;">
              <div>
                <h2 style="color:var(--primary); margin:0;">STEVE'S MASSAGE PARLOR</h2>
                <h4 style="color:var(--accent); margin:4px 0 0;">OPERATIONAL & FINANCIAL PERFORMANCE REPORT</h4>
                <p class="text-muted" style="font-size:0.82rem; margin:0;">Nairobi, Kenya • Research Project Unit: DBIT 226 (KEMU)</p>
              </div>
              <div class="no-print" style="display:flex; gap:10px;">
                <button class="btn btn-outline btn-sm" onclick="Reports.exportCSV(${JSON.stringify(appointments).replace(/"/g, '&quot;')})">
                  <i class="fas fa-file-csv"></i> Export CSV
                </button>
                <button class="btn btn-gold btn-sm" onclick="window.print()">
                  <i class="fas fa-print"></i> Print Report
                </button>
              </div>
            </div>

            <!-- Metric Summary Highlights -->
            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:30px;">
              <div style="background:#F8F9F8; padding:18px; border-radius:10px; border:1px solid var(--border);">
                <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Gross Bookings</div>
                <div style="font-size:1.6rem; font-weight:800; color:var(--primary);">${dash.totalAppointments} Sessions</div>
              </div>
              <div style="background:#F8F9F8; padding:18px; border-radius:10px; border:1px solid var(--border);">
                <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Completed Rate</div>
                <div style="font-size:1.6rem; font-weight:800; color:var(--success);">
                  ${Math.round((dash.completedAppointments / (dash.totalAppointments || 1)) * 100)}%
                </div>
              </div>
              <div style="background:#F8F9F8; padding:18px; border-radius:10px; border:1px solid var(--border);">
                <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Total Revenue</div>
                <div style="font-size:1.6rem; font-weight:800; color:var(--accent);">KES ${Number(dash.totalRevenue).toLocaleString()}</div>
              </div>
              <div style="background:#F8F9F8; padding:18px; border-radius:10px; border:1px solid var(--border);">
                <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Net Cashflow</div>
                <div style="font-size:1.6rem; font-weight:800; color:var(--primary);">KES ${Number(finance.netProfit).toLocaleString()}</div>
              </div>
            </div>

            <!-- Service Revenue Table -->
            <h4 style="margin-bottom:12px; color:var(--primary);"><i class="fas fa-chart-pie text-gold"></i> Service Utilization & Revenue Breakdown</h4>
            <div class="table-responsive" style="margin-bottom:30px;">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Service Treatment</th>
                    <th>Bookings</th>
                    <th>Total Earned (KES)</th>
                    <th>Revenue Contribution (%)</th>
                  </tr>
                </thead>
                <tbody>
                  ${dash.popularServices.map(s => {
                    const pct = Math.round((s.total_earned / (dash.totalRevenue || 1)) * 100);
                    return `
                      <tr>
                        <td><strong>${s.name}</strong></td>
                        <td>${s.booking_count}</td>
                        <td>KES ${Number(s.total_earned).toLocaleString()}</td>
                        <td>
                          <div style="display:flex; align-items:center; gap:8px;">
                            <div style="flex:1; height:8px; background:#EEE; border-radius:4px; overflow:hidden;">
                              <div style="height:100%; width:${pct}%; background:var(--accent);"></div>
                            </div>
                            <span>${pct}%</span>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Therapist Productivity Table -->
            <h4 style="margin-bottom:12px; color:var(--primary);"><i class="fas fa-user-check text-gold"></i> Specialist Staff Productivity & Feedback Rating</h4>
            <div class="table-responsive" style="margin-bottom:24px;">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Therapist</th>
                    <th>Specialization</th>
                    <th>Completed Sessions</th>
                    <th>Client Rating</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${dash.therapistPerformance.map(t => `
                    <tr>
                      <td><strong>${t.name}</strong></td>
                      <td>${t.specialization}</td>
                      <td>${t.total_sessions} completed</td>
                      <td><span class="text-gold">★ ${t.rating}</span> / 5.0</td>
                      <td><span class="badge badge-success">Top Performer</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="padding-top:20px; border-top:1px solid var(--border); font-size:0.8rem; color:var(--text-muted); display:flex; justify-content:space-between;">
              <span>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</span>
              <span>Prepared for: Kenya Methodist University - DBIT 226 Research Examination</span>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red;">Error generating reports: ${err.message}</div>`;
    }
  },

  printBusinessSummary() {
    this.render().then(() => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  },

  exportCSV(appointments) {
    if (!appointments || appointments.length === 0) {
      return App.showToast('No booking records to export', 'warning');
    }

    const headers = ['Ref No', 'Client Name', 'Phone', 'Service', 'Therapist', 'Date', 'Time', 'Amount KES', 'Status', 'Payment Method'];
    const rows = appointments.map(a => [
      a.reference_no,
      `"${a.customer_name}"`,
      `"${a.customer_phone}"`,
      `"${a.service_name}"`,
      `"${a.therapist_name}"`,
      a.appointment_date,
      a.appointment_time,
      a.total_price_kes,
      a.status,
      a.payment_method || 'M-Pesa'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `steves_massage_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    App.showToast('CSV Report downloaded successfully!');
  }
};
