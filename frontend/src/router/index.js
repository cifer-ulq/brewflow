import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

const routes = [
  {
    path: '/login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: () => import('../components/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: () => { const auth = useAuthStore(); return auth.user?.role === 'cashier' ? '/inventory' : auth.user?.role === 'finance_officer' ? '/finance' : '/dashboard'; } },
      { path: 'dashboard', component: () => import('../views/DashboardView.vue'), meta: { allowedRoles: ['admin', 'finance_officer'] } },
      { path: 'inventory', component: () => import('../views/InventoryView.vue'), meta: { allowedRoles: ['admin', 'cashier'] } },
      { path: 'hr',        component: () => import('../views/HRView.vue'),        meta: { allowedRoles: ['admin'] } },
      { path: 'finance',   component: () => import('../views/FinanceView.vue'),   meta: { allowedRoles: ['admin', 'finance_officer'] } },
      { path: 'users',      component: () => import('../views/UsersView.vue'),      meta: { allowedRoles: ['admin'] } },
      { path: 'analytics',  component: () => import('../views/AnalyticsView.vue'),  meta: { allowedRoles: ['admin'] } },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.token) {
    next('/login');
  } else if (to.meta.guest && auth.token) {
    next('/dashboard');
  } else if (to.meta.allowedRoles && auth.user && !to.meta.allowedRoles.includes(auth.user.role)) {
    next(auth.user.role === 'cashier' ? '/inventory' : auth.user.role === 'finance_officer' ? '/finance' : '/dashboard');
  } else {
    next();
  }
});

export default router;
