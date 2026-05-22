<template>
  <div class="dashboard">
    <!-- Greeting -->
    <div class="greeting-bar">
      <div>
        <h2 class="greeting-title">Good {{ timeOfDay }}, {{ auth.user?.name?.split(' ')[0] || 'there' }} 👋</h2>
        <p class="greeting-sub">Here's what's happening at BrewFlow today.</p>
      </div>
      <div class="greeting-date">{{ todayDate }}</div>
    </div>

    <!-- Stat Cards -->
    <div class="stat-grid">
      <div class="stat-card stat-blue">
        <div class="stat-card-bg"></div>
        <div class="stat-icon-wrap">
          <el-icon size="22"><ShoppingCart /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.ordersToday }}</div>
          <div class="stat-label">Orders Today</div>
        </div>
        <div class="stat-trend">↑ Live</div>
      </div>

      <div class="stat-card stat-green">
        <div class="stat-card-bg"></div>
        <div class="stat-icon-wrap">
          <el-icon size="22"><Money /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">₱{{ stats.revenueToday.toFixed(2) }}</div>
          <div class="stat-label">Revenue Today</div>
        </div>
        <div class="stat-trend">Today</div>
      </div>

      <div class="stat-card stat-amber">
        <div class="stat-card-bg"></div>
        <div class="stat-icon-wrap">
          <el-icon size="22"><User /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.employees }}</div>
          <div class="stat-label">Total Employees</div>
        </div>
        <div class="stat-trend">Active</div>
      </div>

      <div class="stat-card" :class="stats.lowStock > 0 ? 'stat-red' : 'stat-teal'">
        <div class="stat-card-bg"></div>
        <div class="stat-icon-wrap">
          <el-icon size="22"><Box /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.lowStock }}</div>
          <div class="stat-label">Low Stock Items</div>
        </div>
        <div class="stat-trend" v-if="stats.lowStock > 0">⚠ Alert</div>
        <div class="stat-trend" v-else>All OK</div>
      </div>
    </div>

    <!-- Recent Invoices -->
    <div class="section-card">
      <div class="section-header">
        <div class="section-title-group">
          <div class="section-dot"></div>
          <span class="section-title">Recent Invoices</span>
        </div>
        <button class="view-all-btn" @click="$router.push('/finance')">
          View all →
        </button>
      </div>

      <div v-if="loading" class="table-loading">
        <el-skeleton :rows="5" animated />
      </div>

      <table v-else class="brew-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Order ID</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in recentInvoices" :key="inv.id" class="table-row">
            <td class="td-id">#{{ inv.id }}</td>
            <td class="td-muted">ORD-{{ inv.order_id }}</td>
            <td class="td-strong">₱{{ Number(inv.total).toFixed(2) }}</td>
            <td>
              <span class="status-badge" :class="inv.status === 'paid' ? 'badge-green' : 'badge-amber'">
                {{ inv.status }}
              </span>
            </td>
            <td class="td-muted">{{ new Date(inv.issued_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) }}</td>
          </tr>
          <tr v-if="!recentInvoices.length">
            <td colspan="5" class="td-empty">No invoices yet</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getInvoices } from '../api/finance';
import { getItems } from '../api/inventory';
import { getEmployees } from '../api/hr';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const loading = ref(true);
const recentInvoices = ref([]);
const stats = ref({ ordersToday: 0, revenueToday: 0, employees: 0, lowStock: 0 });

const timeOfDay = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
});

const todayDate = computed(() =>
  new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
);

onMounted(async () => {
  try {
    const [invoicesRes, itemsRes, empRes] = await Promise.all([
      getInvoices(),
      getItems(),
      getEmployees(),
    ]);

    const invoices = invoicesRes.data;
    const today = new Date().toDateString();
    const todayInvoices = invoices.filter(
      (i) => new Date(i.issued_at).toDateString() === today
    );

    stats.value = {
      ordersToday: todayInvoices.length,
      revenueToday: todayInvoices.reduce((s, i) => s + Number(i.total), 0),
      employees: empRes.data.length,
      lowStock: itemsRes.data.filter(
        (i) => Number(i.quantity) <= Number(i.reorder_level)
      ).length,
    };

    recentInvoices.value = invoices.slice(0, 8);
  } catch {
    // services may not be ready yet on first load
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: 'Inter', sans-serif;
}

/* Greeting */
.greeting-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: linear-gradient(135deg, #1C0A00 0%, #3D1C0A 100%);
  border-radius: 16px;
  padding: 24px 28px;
  color: white;
  box-shadow: 0 4px 24px rgba(139,69,19,0.25);
}
.greeting-title {
  font-size: 20px;
  font-weight: 700;
  color: #FEFCE8;
  margin: 0 0 4px;
  letter-spacing: -0.3px;
}
.greeting-sub {
  font-size: 13px;
  color: #92784D;
  margin: 0;
}
.greeting-date {
  font-size: 12px;
  color: #6B4C2A;
  font-weight: 500;
  text-align: right;
  padding-top: 4px;
}

/* Stat grid */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.stat-card {
  position: relative;
  border-radius: 16px;
  padding: 22px 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.stat-card-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Color variants */
.stat-blue  { background: linear-gradient(135deg, #1E3A5F 0%, #1A3050 100%); }
.stat-blue .stat-icon-wrap  { background: rgba(59,130,246,0.25); color: #93C5FD; }
.stat-blue .stat-value  { color: #DBEAFE; }
.stat-blue .stat-label  { color: #6B8DB5; }
.stat-blue .stat-trend  { color: #60A5FA; }

.stat-green { background: linear-gradient(135deg, #14532D 0%, #0F4222 100%); }
.stat-green .stat-icon-wrap { background: rgba(34,197,94,0.25); color: #86EFAC; }
.stat-green .stat-value { color: #DCFCE7; }
.stat-green .stat-label { color: #4A8063; }
.stat-green .stat-trend { color: #4ADE80; }

.stat-amber { background: linear-gradient(135deg, #451A03 0%, #3A1502 100%); }
.stat-amber .stat-icon-wrap { background: rgba(245,158,11,0.25); color: #FCD34D; }
.stat-amber .stat-value { color: #FEF3C7; }
.stat-amber .stat-label { color: #7C5E30; }
.stat-amber .stat-trend { color: #FBBF24; }

.stat-red   { background: linear-gradient(135deg, #450A0A 0%, #3A0808 100%); }
.stat-red .stat-icon-wrap   { background: rgba(239,68,68,0.25); color: #FCA5A5; }
.stat-red .stat-value   { color: #FEE2E2; }
.stat-red .stat-label   { color: #7C3A3A; }
.stat-red .stat-trend   { color: #F87171; }

.stat-teal  { background: linear-gradient(135deg, #042F2E 0%, #032524 100%); }
.stat-teal .stat-icon-wrap  { background: rgba(20,184,166,0.25); color: #5EEAD4; }
.stat-teal .stat-value  { color: #CCFBF1; }
.stat-teal .stat-label  { color: #2A6B65; }
.stat-teal .stat-trend  { color: #2DD4BF; }

.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-body {
  flex: 1;
}
.stat-value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -1px;
}
.stat-label {
  font-size: 12px;
  font-weight: 500;
  margin-top: 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stat-trend {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* Section card */
.section-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 1px 8px rgba(139,90,43,0.06);
  border: 1px solid #EDE5D8;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.section-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-dot {
  width: 10px; height: 10px;
  background: #F59E0B;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(245,158,11,0.5);
}
.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #1C0A00;
}
.view-all-btn {
  font-size: 13px;
  font-weight: 600;
  color: #D97706;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: color 0.15s;
  padding: 0;
}
.view-all-btn:hover { color: #B45309; }

/* Table */
.brew-table {
  width: 100%;
  border-collapse: collapse;
}
.brew-table thead tr {
  border-bottom: 2px solid #F5EFE8;
}
.brew-table th {
  font-size: 11px;
  font-weight: 700;
  color: #9B7A5A;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 0 12px 12px;
  text-align: left;
}
.brew-table tbody .table-row {
  border-bottom: 1px solid #FAF6F1;
  transition: background 0.12s;
}
.brew-table tbody .table-row:hover {
  background: #FEF9F3;
}
.brew-table td {
  padding: 12px;
  font-size: 13.5px;
  vertical-align: middle;
}
.td-id { font-weight: 700; color: #1C0A00; }
.td-muted { color: #9B7A5A; }
.td-strong { font-weight: 600; color: #1C0A00; }
.td-empty { text-align: center; color: #C4A882; padding: 32px; font-size: 14px; }

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.badge-green { background: #D1FAE5; color: #065F46; }
.badge-amber { background: #FEF3C7; color: #92400E; }

/* Loading */
.table-loading { padding: 20px 0; }

@media (max-width: 900px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
