<template>
  <div class="page-wrap">
    <!-- KPI Row -->
    <div class="kpi-grid" v-loading="loading">
      <div class="kpi-card kpi-blue">
        <div class="kpi-icon"><el-icon size="18"><ShoppingCart /></el-icon></div>
        <div class="kpi-value">{{ overall.total_orders || 0 }}</div>
        <div class="kpi-label">Total Orders</div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-icon"><el-icon size="18"><Money /></el-icon></div>
        <div class="kpi-value">₱{{ Number(overall.total_revenue || 0).toFixed(0) }}</div>
        <div class="kpi-label">Total Revenue</div>
      </div>
      <div class="kpi-card kpi-teal">
        <div class="kpi-icon"><el-icon size="18"><CircleCheck /></el-icon></div>
        <div class="kpi-value">{{ overall.completed || 0 }}</div>
        <div class="kpi-label">Completed</div>
      </div>
      <div class="kpi-card kpi-amber">
        <div class="kpi-icon"><el-icon size="18"><Clock /></el-icon></div>
        <div class="kpi-value">{{ overall.pending || 0 }}</div>
        <div class="kpi-label">Pending</div>
      </div>
      <div class="kpi-card kpi-red">
        <div class="kpi-icon"><el-icon size="18"><CircleClose /></el-icon></div>
        <div class="kpi-value">{{ overall.cancelled || 0 }}</div>
        <div class="kpi-label">Cancelled</div>
      </div>
    </div>

    <!-- Charts Row 1 -->
    <div class="charts-row">
      <div class="chart-card chart-wide">
        <div class="chart-header">
          <div class="section-dot dot-blue"></div>
          <span class="chart-title">Daily Revenue — Last 30 Days (₱)</span>
        </div>
        <v-chart :option="revenueChartOption" style="height:260px;" autoresize />
      </div>
      <div class="chart-card chart-narrow">
        <div class="chart-header">
          <div class="section-dot dot-purple"></div>
          <span class="chart-title">Order Status</span>
        </div>
        <v-chart :option="statusPieOption" style="height:260px;" autoresize />
      </div>
    </div>

    <!-- Charts Row 2 -->
    <div class="charts-row">
      <div class="chart-card chart-half">
        <div class="chart-header">
          <div class="section-dot dot-amber"></div>
          <span class="chart-title">Orders per Day — Last 30 Days</span>
        </div>
        <v-chart :option="ordersBarOption" style="height:240px;" autoresize />
      </div>
      <div class="chart-card chart-half">
        <div class="chart-header">
          <div class="section-dot dot-teal"></div>
          <span class="chart-title">Revenue by Branch</span>
        </div>
        <v-chart :option="branchChartOption" style="height:240px;" autoresize />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, DataZoomComponent,
} from 'echarts/components';
import { getOrderStats } from '../api/orders';
import { getSummary } from '../api/finance';

use([CanvasRenderer, LineChart, BarChart, PieChart,
     TitleComponent, TooltipComponent, GridComponent, LegendComponent, DataZoomComponent]);

const loading = ref(false);
const overall  = ref({});
const daily    = ref([]);
const byBranch = ref([]);
const finDaily = ref([]);

const fetchData = async () => {
  loading.value = true;
  try {
    const [statsRes, finRes] = await Promise.all([getOrderStats(), getSummary()]);
    overall.value  = statsRes.data.overall;
    daily.value    = statsRes.data.daily.slice().reverse();
    byBranch.value = statsRes.data.byBranch;
    finDaily.value = (finRes.data.daily || []).slice().reverse();
  } catch {
    ElMessage.error('Failed to load analytics data');
  } finally {
    loading.value = false;
  }
};

const chartTextColor = '#9B7A5A';
const chartGridColor = '#F5EFE8';

const revenueChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#1C0A00',
    borderColor: 'rgba(245,158,11,0.3)',
    textStyle: { color: '#FEF3C7', fontSize: 12 },
    formatter: (p) => `${p[0].name}<br/><b>₱${Number(p[0].value).toFixed(2)}</b>`,
  },
  grid: { left: 60, right: 20, top: 20, bottom: 50 },
  xAxis: {
    type: 'category',
    data: finDaily.value.map(d => d.date),
    axisLabel: { rotate: 30, fontSize: 10, color: chartTextColor },
    axisLine: { lineStyle: { color: chartGridColor } },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: { formatter: '₱{value}', color: chartTextColor, fontSize: 10 },
    splitLine: { lineStyle: { color: chartGridColor } },
  },
  series: [{
    type: 'line', smooth: true,
    data: finDaily.value.map(d => Number(d.revenue || 0)),
    areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(217,119,6,0.25)' }, { offset: 1, color: 'rgba(217,119,6,0.02)' }] } },
    lineStyle: { color: '#D97706', width: 2.5 },
    itemStyle: { color: '#D97706' },
    symbol: 'circle', symbolSize: 5,
  }],
}));

const statusPieOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: '#1C0A00',
    borderColor: 'rgba(245,158,11,0.3)',
    textStyle: { color: '#FEF3C7', fontSize: 12 },
  },
  legend: { bottom: 0, left: 'center', textStyle: { color: chartTextColor, fontSize: 11 } },
  series: [{
    type: 'pie', radius: ['42%', '72%'], center: ['50%', '43%'],
    label: { show: false },
    data: [
      { value: Number(overall.value.completed  || 0), name: 'Completed',  itemStyle: { color: '#34D399' } },
      { value: Number(overall.value.cancelled  || 0), name: 'Cancelled',  itemStyle: { color: '#F87171' } },
      { value: Number(overall.value.pending    || 0), name: 'Pending',    itemStyle: { color: '#FBBF24' } },
    ],
  }],
}));

const ordersBarOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#1C0A00',
    borderColor: 'rgba(245,158,11,0.3)',
    textStyle: { color: '#FEF3C7', fontSize: 12 },
  },
  grid: { left: 45, right: 20, top: 20, bottom: 50 },
  xAxis: {
    type: 'category',
    data: daily.value.map(d => d.date),
    axisLabel: { rotate: 30, fontSize: 10, color: chartTextColor },
    axisLine: { lineStyle: { color: chartGridColor } },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: chartTextColor, fontSize: 10 },
    splitLine: { lineStyle: { color: chartGridColor } },
  },
  series: [{
    type: 'bar', barMaxWidth: 36,
    data: daily.value.map(d => Number(d.total_orders || 0)),
    itemStyle: { color: '#A78BFA', borderRadius: [5, 5, 0, 0] },
  }],
}));

const branchChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#1C0A00',
    borderColor: 'rgba(245,158,11,0.3)',
    textStyle: { color: '#FEF3C7', fontSize: 12 },
    formatter: (p) => `${p[0].name}<br/><b>₱${Number(p[0].value).toFixed(2)}</b>`,
  },
  grid: { left: 110, right: 50, top: 20, bottom: 20 },
  xAxis: {
    type: 'value',
    axisLabel: { formatter: '₱{value}', color: chartTextColor, fontSize: 10 },
    splitLine: { lineStyle: { color: chartGridColor } },
  },
  yAxis: {
    type: 'category',
    data: byBranch.value.map(b => b.branch || 'Unknown'),
    axisLabel: { color: chartTextColor, fontSize: 11 },
    axisLine: { lineStyle: { color: chartGridColor } },
  },
  series: [{
    type: 'bar', barMaxWidth: 30,
    data: byBranch.value.map(b => Number(b.revenue || 0)),
    itemStyle: { color: '#2DD4BF', borderRadius: [0, 5, 5, 0] },
    label: { show: true, position: 'right', formatter: (p) => `₱${Number(p.value).toFixed(0)}`, color: chartTextColor, fontSize: 11 },
  }],
}));

onMounted(fetchData);
</script>

<style scoped>
.page-wrap { display: flex; flex-direction: column; gap: 20px; font-family: 'Inter', sans-serif; }

/* KPI grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}
.kpi-card {
  border-radius: 14px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  transition: transform 0.2s;
}
.kpi-card:hover { transform: translateY(-2px); }
.kpi-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.kpi-value { font-size: 22px; font-weight: 800; line-height: 1; letter-spacing: -0.5px; }
.kpi-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

.kpi-blue { background: linear-gradient(135deg, #1E3A5F 0%, #1A3050 100%); }
.kpi-blue .kpi-icon { background: rgba(59,130,246,0.2); color: #93C5FD; }
.kpi-blue .kpi-value { color: #DBEAFE; }
.kpi-blue .kpi-label { color: #6B8DB5; }

.kpi-green { background: linear-gradient(135deg, #14532D 0%, #0F4222 100%); }
.kpi-green .kpi-icon { background: rgba(34,197,94,0.2); color: #86EFAC; }
.kpi-green .kpi-value { color: #DCFCE7; }
.kpi-green .kpi-label { color: #4A8063; }

.kpi-teal { background: linear-gradient(135deg, #042F2E 0%, #032524 100%); }
.kpi-teal .kpi-icon { background: rgba(20,184,166,0.2); color: #5EEAD4; }
.kpi-teal .kpi-value { color: #CCFBF1; }
.kpi-teal .kpi-label { color: #2A6B65; }

.kpi-amber { background: linear-gradient(135deg, #451A03 0%, #3A1502 100%); }
.kpi-amber .kpi-icon { background: rgba(245,158,11,0.2); color: #FCD34D; }
.kpi-amber .kpi-value { color: #FEF3C7; }
.kpi-amber .kpi-label { color: #7C5E30; }

.kpi-red { background: linear-gradient(135deg, #450A0A 0%, #3A0808 100%); }
.kpi-red .kpi-icon { background: rgba(239,68,68,0.2); color: #FCA5A5; }
.kpi-red .kpi-value { color: #FEE2E2; }
.kpi-red .kpi-label { color: #7C3A3A; }

/* Charts */
.charts-row { display: flex; gap: 16px; }
.chart-card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #EDE5D8;
  box-shadow: 0 1px 8px rgba(139,90,43,0.06);
  padding: 18px 20px;
}
.chart-wide  { flex: 3; }
.chart-narrow { flex: 2; }
.chart-half  { flex: 1; }

.chart-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.section-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-blue   { background: #3B82F6; box-shadow: 0 0 8px rgba(59,130,246,0.5); }
.dot-purple { background: #A78BFA; box-shadow: 0 0 8px rgba(167,139,250,0.5); }
.dot-amber  { background: #F59E0B; box-shadow: 0 0 8px rgba(245,158,11,0.5); }
.dot-teal   { background: #14B8A6; box-shadow: 0 0 8px rgba(20,184,166,0.5); }
.chart-title { font-size: 14px; font-weight: 700; color: #1C0A00; }

@media (max-width: 1100px) {
  .kpi-grid { grid-template-columns: repeat(3, 1fr); }
  .charts-row { flex-direction: column; }
}
</style>
