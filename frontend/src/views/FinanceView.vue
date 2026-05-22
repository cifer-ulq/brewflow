<template>
  <div class="page-wrap">

    <!-- ── Page Header ── -->
    <div class="page-header">
      <div>
        <h2 class="page-heading">Finance & Invoices</h2>
        <p class="page-sub">Revenue overview, daily breakdown, and invoice management</p>
      </div>
      <span class="date-badge">{{ todayLabel }}</span>
    </div>

    <!-- ── KPI Cards ── -->
    <div class="summary-grid" v-loading="loadingSummary">
      <div class="summary-card card-revenue">
        <div class="summary-icon"><el-icon size="22"><TrendCharts /></el-icon></div>
        <div class="summary-body">
          <div class="summary-value">₱{{ Number(summary.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</div>
          <div class="summary-label">Total Revenue</div>
        </div>
        <div class="card-badge">All Time</div>
      </div>
      <div class="summary-card card-invoices">
        <div class="summary-icon"><el-icon size="22"><Document /></el-icon></div>
        <div class="summary-body">
          <div class="summary-value">{{ summary.total_invoices || 0 }}</div>
          <div class="summary-label">Total Invoices</div>
        </div>
        <div class="card-badge">Issued</div>
      </div>
      <div class="summary-card card-avg">
        <div class="summary-icon"><el-icon size="22"><Money /></el-icon></div>
        <div class="summary-body">
          <div class="summary-value">
            ₱{{ summary.total_invoices > 0
              ? (Number(summary.total_revenue) / Number(summary.total_invoices)).toLocaleString('en-PH', { minimumFractionDigits: 2 })
              : '0.00' }}
          </div>
          <div class="summary-label">Avg. Invoice Value</div>
        </div>
        <div class="card-badge">Per Invoice</div>
      </div>
    </div>

    <!-- ── Middle Row: Daily Trend + Status Breakdown ── -->
    <div class="mid-row">

      <!-- Daily Revenue -->
      <div class="panel panel-daily">
        <div class="panel-header">
          <div class="panel-title-group">
            <span class="panel-dot dot-blue"></span>
            <span class="panel-title">Daily Revenue</span>
          </div>
          <span class="panel-sub">Last 14 days</span>
        </div>
        <div class="panel-body" v-loading="loadingSummary">
          <div v-if="!dailyTrend.length" class="empty-msg">No data yet</div>
          <div
            v-for="row in dailyTrend"
            :key="row.date"
            class="trend-row"
          >
            <span class="trend-date">{{ formatDate(row.date) }}</span>
            <div class="trend-bar-wrap">
              <div
                class="trend-bar"
                :style="{ width: (Number(row.revenue) / maxRevenue * 100).toFixed(1) + '%' }"
              ></div>
            </div>
            <span class="trend-val">₱{{ Number(row.revenue).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}</span>
          </div>
        </div>
      </div>

      <!-- Invoice Status Breakdown -->
      <div class="panel panel-status">
        <div class="panel-header">
          <div class="panel-title-group">
            <span class="panel-dot dot-amber"></span>
            <span class="panel-title">Invoice Breakdown</span>
          </div>
          <span class="panel-sub">By status</span>
        </div>
        <div class="panel-body status-body" v-loading="loadingInvoices">
          <div class="status-stat">
            <div class="status-left">
              <span class="status-badge badge-green">Paid</span>
              <span class="status-count">{{ statusCounts.paid }} invoices</span>
            </div>
            <div class="status-right">
              <span class="status-amount">₱{{ statusAmounts.paid.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
              <div class="status-pct-bar"><div class="status-pct-fill fill-green" :style="{ width: statusPct('paid') + '%' }"></div></div>
            </div>
          </div>
          <div class="status-stat">
            <div class="status-left">
              <span class="status-badge badge-amber">Pending</span>
              <span class="status-count">{{ statusCounts.pending }} invoices</span>
            </div>
            <div class="status-right">
              <span class="status-amount">₱{{ statusAmounts.pending.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
              <div class="status-pct-bar"><div class="status-pct-fill fill-amber" :style="{ width: statusPct('pending') + '%' }"></div></div>
            </div>
          </div>
          <div class="status-stat">
            <div class="status-left">
              <span class="status-badge badge-gray">Void</span>
              <span class="status-count">{{ statusCounts.void }} invoices</span>
            </div>
            <div class="status-right">
              <span class="status-amount">₱{{ statusAmounts.void.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
              <div class="status-pct-bar"><div class="status-pct-fill fill-gray" :style="{ width: statusPct('void') + '%' }"></div></div>
            </div>
          </div>
          <div class="status-divider"></div>
          <div class="status-total-row">
            <span class="status-total-label">Total Collected</span>
            <span class="status-total-val">₱{{ statusAmounts.paid.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div class="status-total-row">
            <span class="status-total-label">Outstanding</span>
            <span class="status-total-val outstanding">₱{{ statusAmounts.pending.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Invoices Table ── -->
    <div class="section-card">
      <div class="section-header">
        <div class="section-title-group">
          <span class="panel-dot dot-purple"></span>
          <span class="section-title">All Invoices</span>
          <span class="record-count">{{ filteredInvoices.length }} record(s)</span>
        </div>
        <div class="table-controls">
          <el-input
            v-model="search"
            placeholder="Search invoice # or order…"
            size="small"
            clearable
            style="width: 220px;"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <div class="status-tabs">
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              class="stab"
              :class="{ active: activeTab === tab.value }"
              @click="activeTab = tab.value"
            >{{ tab.label }}</button>
          </div>
        </div>
      </div>

      <div v-if="loadingInvoices" class="loading-area"><el-skeleton :rows="6" animated /></div>
      <div v-else class="table-scroll">
        <table class="brew-table">
          <thead>
            <tr>
              <th style="width:100px">Invoice #</th>
              <th style="width:100px">Order</th>
              <th>Subtotal</th>
              <th>Tax (12%)</th>
              <th>Total</th>
              <th style="width:110px">Status</th>
              <th>Issued</th>
              <th v-if="isAdmin" style="width:130px">Change Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredInvoices" :key="row.id" class="trow">
              <td>
                <span class="inv-id">#{{ String(row.id).padStart(4,'0') }}</span>
              </td>
              <td class="td-muted">
                <span class="order-chip">ORD-{{ row.order_id }}</span>
              </td>
              <td class="td-num">₱{{ Number(row.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
              <td class="td-num td-muted">₱{{ Number(row.tax).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
              <td class="td-num td-bold">₱{{ Number(row.total).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="row.status === 'paid' ? 'badge-green' : row.status === 'void' ? 'badge-gray' : 'badge-amber'"
                >{{ row.status }}</span>
              </td>
              <td class="td-muted td-date-col">
                {{ new Date(row.issued_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) }}
              </td>
              <td v-if="isAdmin">
                <el-select
                  :model-value="row.status"
                  size="small"
                  style="width: 115px;"
                  @change="(val) => updateStatus(row, val)"
                >
                  <el-option label="paid"    value="paid" />
                  <el-option label="pending" value="pending" />
                  <el-option label="void"    value="void" />
                </el-select>
              </td>
            </tr>
            <tr v-if="!filteredInvoices.length">
              <td :colspan="isAdmin ? 8 : 7" class="td-empty">No invoices match your filter</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../store/auth';
import { getInvoices, getSummary, updateInvoiceStatus } from '../api/finance';

const auth = useAuthStore();
const isAdmin = computed(() => auth.user?.role === 'admin');

const invoices = ref([]);
const loadingInvoices = ref(false);
const summary = ref({ total_invoices: 0, total_revenue: 0 });
const daily = ref([]);
const loadingSummary = ref(false);
const search = ref('');
const activeTab = ref('all');

const statusTabs = [
  { label: 'All',     value: 'all' },
  { label: 'Paid',    value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Void',    value: 'void' },
];

const todayLabel = computed(() => new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

// Last 14 days for trend bars
const dailyTrend = computed(() => daily.value.slice(0, 14));
const maxRevenue = computed(() => Math.max(...dailyTrend.value.map(d => Number(d.revenue) || 0), 1));

const formatDate = (d) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

// Status breakdown
const statusCounts = computed(() => ({
  paid:    invoices.value.filter(i => i.status === 'paid').length,
  pending: invoices.value.filter(i => i.status === 'pending').length,
  void:    invoices.value.filter(i => i.status === 'void').length,
}));
const statusAmounts = computed(() => ({
  paid:    invoices.value.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0),
  pending: invoices.value.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.total), 0),
  void:    invoices.value.filter(i => i.status === 'void').reduce((s, i) => s + Number(i.total), 0),
}));
const totalInvoices = computed(() => invoices.value.length || 1);
const statusPct = (s) => ((statusCounts.value[s] / totalInvoices.value) * 100).toFixed(0);

// Filtered invoices
const filteredInvoices = computed(() => {
  let list = invoices.value;
  if (activeTab.value !== 'all') list = list.filter(i => i.status === activeTab.value);
  const q = search.value.trim().toLowerCase();
  if (q) list = list.filter(i => String(i.id).includes(q) || String(i.order_id).includes(q));
  return list;
});

const fetchAll = async () => {
  loadingInvoices.value = true;
  loadingSummary.value = true;
  try {
    const [invoicesRes, summaryRes] = await Promise.all([getInvoices(), getSummary()]);
    invoices.value = invoicesRes.data;
    summary.value  = summaryRes.data.overall;
    daily.value    = summaryRes.data.daily || [];
  } catch {
    ElMessage.error('Failed to load finance data');
  } finally {
    loadingInvoices.value = false;
    loadingSummary.value  = false;
  }
};

const updateStatus = async (row, status) => {
  try {
    await updateInvoiceStatus(row.id, status);
    row.status = status;
    ElMessage.success(`Invoice #${row.id} marked as ${status}`);
  } catch {
    ElMessage.error('Failed to update invoice status');
  }
};

onMounted(fetchAll);
</script>

<style scoped>
.page-wrap { display: flex; flex-direction: column; gap: 20px; font-family: 'Inter', sans-serif; }

/* ── Header ── */
.page-header { display: flex; align-items: flex-start; justify-content: space-between; }
.page-heading { font-size: 20px; font-weight: 800; color: #1C0A00; margin: 0 0 4px; letter-spacing: -0.4px; }
.page-sub { font-size: 13px; color: #9B7A5A; margin: 0; }
.date-badge {
  font-size: 12px; font-weight: 600; padding: 6px 14px;
  border-radius: 20px; background: #F5EFE8; color: #7C5A38;
  border: 1px solid #EDE0CC; white-space: nowrap; margin-top: 4px;
}

/* ── KPI Cards ── */
.summary-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
.summary-card {
  border-radius: 16px; padding: 20px 22px;
  display: flex; align-items: center; gap: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: transform 0.2s; position: relative; overflow: hidden;
}
.summary-card:hover { transform: translateY(-2px); }
.card-revenue  { background: linear-gradient(135deg,#14532D,#0F4222); }
.card-invoices { background: linear-gradient(135deg,#1E3A5F,#1A3050); }
.card-avg      { background: linear-gradient(135deg,#451A03,#3A1502); }

.summary-icon {
  width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.card-revenue  .summary-icon { background: rgba(34,197,94,0.18); color: #86EFAC; }
.card-invoices .summary-icon { background: rgba(59,130,246,0.18); color: #93C5FD; }
.card-avg      .summary-icon { background: rgba(245,158,11,0.18); color: #FCD34D; }

.summary-body { flex: 1; }
.summary-value { font-size: 22px; font-weight: 800; line-height: 1.1; letter-spacing: -0.5px; }
.summary-label { font-size: 11px; font-weight: 600; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
.card-revenue  .summary-value { color: #DCFCE7; } .card-revenue  .summary-label { color: #4A8063; }
.card-invoices .summary-value { color: #DBEAFE; } .card-invoices .summary-label { color: #6B8DB5; }
.card-avg      .summary-value { color: #FEF3C7; } .card-avg      .summary-label { color: #7C5E30; }

.card-badge {
  position: absolute; top: 14px; right: 16px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
  padding: 3px 8px; border-radius: 20px; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5);
}

/* ── Middle Row ── */
.mid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.panel {
  background: #FFFFFF; border-radius: 16px;
  border: 1px solid #EDE5D8; box-shadow: 0 1px 8px rgba(139,90,43,0.06);
  display: flex; flex-direction: column;
}
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #F5EFE8;
}
.panel-title-group { display: flex; align-items: center; gap: 8px; }
.panel-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.dot-blue   { background: #3B82F6; box-shadow: 0 0 7px rgba(59,130,246,0.6); }
.dot-amber  { background: #F59E0B; box-shadow: 0 0 7px rgba(245,158,11,0.6); }
.dot-purple { background: #A78BFA; box-shadow: 0 0 7px rgba(167,139,250,0.6); }
.panel-title { font-size: 14px; font-weight: 700; color: #1C0A00; }
.panel-sub   { font-size: 11px; color: #C4A882; font-weight: 500; }
.panel-body  { padding: 14px 20px; flex: 1; }
.empty-msg   { color: #C4A882; font-size: 13px; text-align: center; padding: 20px 0; }

/* Daily trend bars */
.trend-row {
  display: grid; grid-template-columns: 70px 1fr 80px;
  align-items: center; gap: 10px;
  padding: 5px 0; border-bottom: 1px solid #FAF6F1;
}
.trend-row:last-child { border-bottom: none; }
.trend-date { font-size: 11.5px; color: #9B7A5A; font-weight: 600; white-space: nowrap; }
.trend-bar-wrap { height: 8px; background: #F5EFE8; border-radius: 4px; overflow: hidden; }
.trend-bar { height: 100%; background: linear-gradient(90deg,#D97706,#F59E0B); border-radius: 4px; transition: width 0.4s ease; min-width: 2px; }
.trend-val { font-size: 11.5px; font-weight: 700; color: #1C0A00; text-align: right; }

/* Status breakdown */
.status-body { display: flex; flex-direction: column; gap: 14px; }
.status-stat { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.status-left { display: flex; align-items: center; gap: 8px; }
.status-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.status-count { font-size: 12px; color: #9B7A5A; }
.status-amount { font-size: 13px; font-weight: 700; color: #1C0A00; }
.status-pct-bar { width: 100px; height: 5px; background: #F5EFE8; border-radius: 3px; overflow: hidden; }
.status-pct-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.fill-green { background: #34D399; }
.fill-amber { background: #FBBF24; }
.fill-gray  { background: #9CA3AF; }
.status-divider { border-top: 1px dashed #EDE5D8; margin: 2px 0; }
.status-total-row { display: flex; justify-content: space-between; align-items: center; }
.status-total-label { font-size: 12px; color: #9B7A5A; font-weight: 500; }
.status-total-val { font-size: 14px; font-weight: 800; color: #1C0A00; }
.status-total-val.outstanding { color: #D97706; }

/* ── Section card (invoices) ── */
.section-card {
  background: #FFFFFF; border-radius: 16px;
  border: 1px solid #EDE5D8; box-shadow: 0 1px 8px rgba(139,90,43,0.06);
  overflow: hidden;
}
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 2px solid #F5EFE8; flex-wrap: wrap; gap: 10px;
}
.section-title-group { display: flex; align-items: center; gap: 8px; }
.section-title { font-size: 15px; font-weight: 700; color: #1C0A00; }
.record-count {
  font-size: 11px; font-weight: 600; padding: 2px 9px;
  border-radius: 20px; background: #F5EFE8; color: #9B7A5A;
  border: 1px solid #EDE0CC;
}
.table-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

/* Status tabs */
.status-tabs { display: flex; background: #F5EFE8; border-radius: 8px; padding: 3px; gap: 2px; }
.stab {
  border: none; background: transparent; border-radius: 6px;
  font-size: 12px; font-weight: 600; padding: 4px 12px; cursor: pointer;
  color: #9B7A5A; transition: all 0.15s;
}
.stab.active { background: #FFFFFF; color: #1C0A00; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.stab:hover:not(.active) { color: #1C0A00; }

/* Table */
.table-scroll { overflow-x: auto; }
.brew-table { width: 100%; border-collapse: collapse; min-width: 680px; }
.brew-table thead tr { background: #FEF9F3; border-bottom: 2px solid #EDE5D8; }
.brew-table th {
  font-size: 10.5px; font-weight: 700; color: #9B7A5A;
  text-transform: uppercase; letter-spacing: 0.7px;
  padding: 13px 16px; text-align: left; white-space: nowrap;
}
.brew-table tbody .trow { border-bottom: 1px solid #FAF6F1; transition: background 0.12s; }
.brew-table tbody .trow:last-child { border-bottom: none; }
.brew-table tbody .trow:hover { background: #FEF9F3; }
.brew-table td { padding: 11px 16px; font-size: 13px; vertical-align: middle; }

.inv-id { font-weight: 800; color: #1C0A00; font-size: 13.5px; letter-spacing: 0.3px; }
.order-chip {
  font-size: 11.5px; font-weight: 600; padding: 3px 9px;
  border-radius: 20px; background: #EDE5D8; color: #7C5A38;
}
.td-muted { color: #9B7A5A; }
.td-num { text-align: right; font-variant-numeric: tabular-nums; }
.td-bold { font-weight: 700; color: #1C0A00; }
.td-date-col { white-space: nowrap; }
.td-empty { text-align: center; color: #C4A882; padding: 48px; font-size: 14px; }

.status-badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 20px;
  font-size: 10.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.badge-green { background: #D1FAE5; color: #065F46; }
.badge-amber { background: #FEF3C7; color: #92400E; }
.badge-gray  { background: #F3F4F6; color: #6B7280; }

.loading-area { padding: 24px; }
</style>

