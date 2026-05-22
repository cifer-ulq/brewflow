<template>
  <div class="app-shell">
    <!-- ═══ SIDEBAR ═══ -->
    <aside class="sidebar">
      <!-- Brand -->
      <div class="brand">
        <div class="brand-logo">
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
            <circle cx="18" cy="18" r="18" fill="#F59E0B" fill-opacity="0.15"/>
            <path d="M10 14h16v2a8 8 0 01-16 0v-2z" fill="#F59E0B"/>
            <rect x="14" y="8" width="8" height="6" rx="2" fill="#F59E0B" fill-opacity="0.6"/>
            <path d="M26 15h2a2 2 0 010 4h-2" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M15 26h6" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
            <path d="M13 28h10" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">BrewFlow</span>
          <span class="brand-sub">ERP System</span>
        </div>
      </div>

      <!-- Nav section label -->
      <div class="nav-section-label">NAVIGATION</div>

      <!-- Nav items -->
      <nav class="nav-menu">
        <router-link
          v-if="role !== 'cashier'"
          to="/dashboard"
          class="nav-item"
          :class="{ active: $route.path === '/dashboard' }"
        >
          <div class="nav-icon-wrap"><el-icon><DataBoard /></el-icon></div>
          <span>Dashboard</span>
        </router-link>

        <router-link
          v-if="canSee('inventory')"
          to="/inventory"
          class="nav-item"
          :class="{ active: $route.path === '/inventory' }"
        >
          <div class="nav-icon-wrap"><el-icon><Box /></el-icon></div>
          <span>Inventory</span>
        </router-link>

        <router-link
          v-if="canSee('hr')"
          to="/hr"
          class="nav-item"
          :class="{ active: $route.path === '/hr' }"
        >
          <div class="nav-icon-wrap"><el-icon><User /></el-icon></div>
          <span>Human Resources</span>
        </router-link>

        <router-link
          v-if="canSee('finance')"
          to="/finance"
          class="nav-item"
          :class="{ active: $route.path === '/finance' }"
        >
          <div class="nav-icon-wrap"><el-icon><Money /></el-icon></div>
          <span>Finance</span>
        </router-link>

        <router-link
          v-if="canSee('users')"
          to="/users"
          class="nav-item"
          :class="{ active: $route.path === '/users' }"
        >
          <div class="nav-icon-wrap"><el-icon><Setting /></el-icon></div>
          <span>User Management</span>
        </router-link>

        <router-link
          v-if="canSee('analytics')"
          to="/analytics"
          class="nav-item"
          :class="{ active: $route.path === '/analytics' }"
        >
          <div class="nav-icon-wrap"><el-icon><TrendCharts /></el-icon></div>
          <span>Analytics</span>
        </router-link>
      </nav>

      <!-- Sidebar footer -->
      <div class="sidebar-footer">
        <div class="sidebar-footer-info">
          <span class="footer-dot"></span>
          All systems operational
        </div>
      </div>
    </aside>

    <!-- ═══ MAIN AREA ═══ -->
    <div class="main-area">
      <!-- Topbar -->
      <header class="topbar">
        <div class="topbar-left">
          <div class="page-breadcrumb">
            <span class="breadcrumb-app">BrewFlow</span>
            <span class="breadcrumb-sep">/</span>
            <span class="page-title">{{ pageTitle }}</span>
          </div>
        </div>
        <div class="topbar-right">
          <div class="user-chip">
            <div class="user-avatar">{{ userInitials }}</div>
            <div class="user-info">
              <span class="user-name">{{ auth.user?.name || auth.user?.email || 'User' }}</span>
              <span class="user-role">{{ roleLabel }}</span>
            </div>
          </div>
          <button class="logout-btn" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            Logout
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="page-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const roleAccess = {
  admin:           ['inventory', 'hr', 'finance', 'users', 'analytics'],
  cashier:         ['inventory'],
  finance_officer: ['finance'],
};

const role = computed(() => auth.user?.role);

const canSee = (page) => {
  const r = auth.user?.role;
  return roleAccess[r]?.includes(page) ?? false;
};

const titles = computed(() => ({
  '/dashboard':  'Dashboard',
  '/inventory':  'Inventory Management',
  '/hr':         'Human Resources',
  '/finance':    'Finance & Invoices',
  '/users':      'User Management',
  '/analytics':  'Analytics & Reports',
}));

const pageTitle = computed(() => titles.value[route.path] || 'BrewFlow ERP');

const roleLabels = {
  admin: 'Administrator',
  cashier: 'Cashier',
  finance_officer: 'Finance Officer',
  manager: 'Manager',
};
const roleLabel = computed(() => roleLabels[auth.user?.role] || auth.user?.role || 'Staff');

const userInitials = computed(() => {
  const name = auth.user?.name || auth.user?.email || 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
});

const handleLogout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<style scoped>
/* ── Shell layout ── */
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  background: #F5EFE8;
}

/* ── Sidebar ── */
.sidebar {
  width: 248px;
  min-width: 248px;
  background: linear-gradient(180deg, #1C0A00 0%, #2A1005 50%, #1C0A00 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-shadow: 4px 0 24px rgba(0,0,0,0.35);
}

/* subtle texture overlay */
.sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='1' fill='white' fill-opacity='0.02'/%3E%3C/svg%3E") repeat;
  pointer-events: none;
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px 20px;
  border-bottom: 1px solid rgba(245,158,11,0.12);
}
.brand-logo {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.25);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.brand-name {
  font-size: 17px;
  font-weight: 800;
  color: #FEFCE8;
  letter-spacing: -0.3px;
}
.brand-sub {
  font-size: 10px;
  font-weight: 500;
  color: #92784D;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Section label */
.nav-section-label {
  font-size: 10px;
  font-weight: 600;
  color: #5C4033;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  padding: 18px 20px 8px;
}

/* Nav items */
.nav-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px;
  overflow-y: auto;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: #A08060;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  transition: all 0.18s ease;
  position: relative;
}
.nav-item:hover {
  background: rgba(245,158,11,0.08);
  color: #F5C060;
}
.nav-item.active {
  background: linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.12) 100%);
  color: #FCD34D;
  box-shadow: inset 0 0 0 1px rgba(245,158,11,0.25);
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  background: #F59E0B;
  border-radius: 0 3px 3px 0;
}
.nav-icon-wrap {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: rgba(255,255,255,0.04);
  font-size: 15px;
  flex-shrink: 0;
}
.nav-item.active .nav-icon-wrap {
  background: rgba(245,158,11,0.18);
}

/* Sidebar footer */
.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(245,158,11,0.08);
}
.sidebar-footer-info {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  color: #5C4033;
  font-weight: 500;
}
.footer-dot {
  width: 6px;
  height: 6px;
  background: #34D399;
  border-radius: 50%;
  box-shadow: 0 0 6px #34D399;
  flex-shrink: 0;
}

/* ── Main area ── */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Topbar */
.topbar {
  height: 60px;
  min-height: 60px;
  background: #FFFFFF;
  border-bottom: 1px solid #EDE5D8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  box-shadow: 0 1px 3px rgba(139,90,43,0.06);
  z-index: 10;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.page-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}
.breadcrumb-app {
  font-size: 13px;
  color: #B0907A;
  font-weight: 500;
}
.breadcrumb-sep {
  color: #D4B896;
  font-size: 14px;
}
.page-title {
  font-size: 15px;
  font-weight: 700;
  color: #1C0A00;
  letter-spacing: -0.2px;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 6px 6px;
  background: #FEF9F3;
  border: 1px solid #EDE0CC;
  border-radius: 40px;
}
.user-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #D97706, #92400E);
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.5px;
}
.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #1C0A00;
}
.user-role {
  font-size: 10.5px;
  color: #9B7A5A;
  font-weight: 500;
}
.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  color: #DC2626;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Inter', sans-serif;
}
.logout-btn:hover {
  background: #FEE2E2;
  border-color: #FCA5A5;
}

/* Page content */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
  background: #F7F1EA;
}
</style>
