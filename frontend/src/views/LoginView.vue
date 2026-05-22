<template>
  <div class="login-page">
    <!-- Background elements -->
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="bg-orb bg-orb-3"></div>

    <div class="login-wrapper">
      <!-- Left panel — branding -->
      <div class="left-panel">
        <div class="left-content">
          <div class="hero-icon">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
              <circle cx="40" cy="40" r="40" fill="#F59E0B" fill-opacity="0.12"/>
              <path d="M20 30h40v5a20 20 0 01-40 0v-5z" fill="#F59E0B"/>
              <rect x="30" y="16" width="20" height="14" rx="5" fill="#F59E0B" fill-opacity="0.5"/>
              <path d="M60 32h6a5 5 0 010 10h-6" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
              <path d="M34 58h12" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
              <path d="M30 64h20" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>
          <h1 class="hero-title">BrewFlow</h1>
          <p class="hero-subtitle">Enterprise Resource Planning<br>for Regional Coffee Chains</p>
          <div class="hero-features">
            <div class="feature-item">
              <span class="feature-dot"></span>
              <span>Real-time inventory & orders</span>
            </div>
            <div class="feature-item">
              <span class="feature-dot"></span>
              <span>Multi-branch management</span>
            </div>
            <div class="feature-item">
              <span class="feature-dot"></span>
              <span>Finance & HR analytics</span>
            </div>
          </div>
        </div>
        <div class="left-footer">BrewFlow ERP v1.0 &bull; Regional Coffee Chain Management</div>
      </div>

      <!-- Right panel — login form -->
      <div class="right-panel">
        <div class="login-card">
          <div class="card-header">
            <h2 class="card-title">Welcome back</h2>
            <p class="card-desc">Sign in to your BrewFlow account</p>
          </div>

          <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin" class="login-form">
            <div class="field-label">Email address</div>
            <el-form-item prop="email">
              <el-input
                v-model="form.email"
                placeholder="you@brewflow.com"
                prefix-icon="Message"
                size="large"
                class="brew-input"
              />
            </el-form-item>

            <div class="field-label">Password</div>
            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="Enter your password"
                prefix-icon="Lock"
                size="large"
                show-password
                class="brew-input"
              />
            </el-form-item>

            <button
              type="submit"
              class="sign-in-btn"
              :class="{ loading }"
              @click.prevent="handleLogin"
              :disabled="loading"
            >
              <span v-if="!loading">Sign In →</span>
              <span v-else class="btn-loading">
                <span class="spinner"></span>
                Signing in…
              </span>
            </button>
          </el-form>

          <div class="card-footer">
            <span class="lock-icon">🔒</span>
            Secured access — authorized personnel only
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { login } from '../api/auth';
import { ElMessage } from 'element-plus';

const router = useRouter();
const auth = useAuthStore();
const formRef = ref(null);
const loading = ref(false);

const form = reactive({ email: '', password: '' });

const rules = {
  email: [{ required: true, type: 'email', message: 'Enter a valid email', trigger: 'blur' }],
  password: [{ required: true, message: 'Password is required', trigger: 'blur' }],
};

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const { data } = await login(form);
    auth.setToken(data.token);
    auth.user = data.user;
    router.push('/dashboard');
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Login failed. Check credentials.');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #0F0500;
  display: flex;
  align-items: stretch;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

/* Ambient background orbs */
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.bg-orb-1 {
  width: 500px; height: 500px;
  background: rgba(180, 83, 9, 0.25);
  top: -100px; left: -100px;
}
.bg-orb-2 {
  width: 400px; height: 400px;
  background: rgba(245, 158, 11, 0.12);
  bottom: -80px; right: 300px;
}
.bg-orb-3 {
  width: 300px; height: 300px;
  background: rgba(92, 45, 15, 0.4);
  top: 40%; right: -60px;
}

/* Layout */
.login-wrapper {
  display: flex;
  width: 100%;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

/* ── Left panel ── */
.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 60px 56px;
  background: transparent;
}
.left-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 420px;
}
.hero-icon {
  width: 80px;
  height: 80px;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-title {
  font-size: 52px;
  font-weight: 800;
  color: #FEFCE8;
  margin: 0;
  line-height: 1;
  letter-spacing: -2px;
}
.hero-subtitle {
  font-size: 16px;
  color: #92784D;
  line-height: 1.6;
  margin: 0;
}
.hero-features {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}
.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #A8906A;
}
.feature-dot {
  width: 6px; height: 6px;
  background: #F59E0B;
  border-radius: 50%;
  flex-shrink: 0;
}
.left-footer {
  font-size: 12px;
  color: #4A3520;
}

/* ── Right panel ── */
.right-panel {
  width: 480px;
  min-width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 48px;
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(245,158,11,0.1);
}
.login-card {
  width: 100%;
  max-width: 380px;
}
.card-header {
  margin-bottom: 36px;
}
.card-title {
  font-size: 28px;
  font-weight: 800;
  color: #FEFCE8;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}
.card-desc {
  font-size: 14px;
  color: #92784D;
  margin: 0;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field-label {
  font-size: 12px;
  font-weight: 600;
  color: #A8906A;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  margin-bottom: 6px;
  margin-top: 8px;
}

/* Override el-input for dark bg */
:deep(.brew-input .el-input__wrapper) {
  background: rgba(255,255,255,0.06) !important;
  border: 1px solid rgba(245,158,11,0.2) !important;
  box-shadow: none !important;
  border-radius: 10px !important;
  transition: border-color 0.2s;
}
:deep(.brew-input .el-input__wrapper:hover) {
  border-color: rgba(245,158,11,0.4) !important;
}
:deep(.brew-input .el-input__wrapper.is-focus) {
  border-color: #F59E0B !important;
  box-shadow: 0 0 0 3px rgba(245,158,11,0.12) !important;
  background: rgba(255,255,255,0.08) !important;
}
:deep(.brew-input .el-input__inner) {
  color: #FEFCE8 !important;
  font-size: 14px !important;
  background: transparent !important;
}
:deep(.brew-input .el-input__inner::placeholder) {
  color: #5C4A30 !important;
}
:deep(.brew-input .el-input__prefix-icon) {
  color: #7C6040 !important;
}
:deep(.brew-input .el-input__suffix .el-icon) {
  color: #7C6040 !important;
}
:deep(.el-form-item__error) {
  color: #FCA5A5 !important;
}

/* Sign-in button */
.sign-in-btn {
  width: 100%;
  height: 48px;
  margin-top: 24px;
  background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: -0.2px;
  box-shadow: 0 4px 20px rgba(217,119,6,0.4);
}
.sign-in-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(217,119,6,0.5);
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
}
.sign-in-btn:active:not(:disabled) {
  transform: translateY(0);
}
.sign-in-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Spinner */
.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Card footer */
.card-footer {
  margin-top: 28px;
  text-align: center;
  font-size: 12px;
  color: #4A3520;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.lock-icon { font-size: 14px; }

/* Responsive */
@media (max-width: 820px) {
  .left-panel { display: none; }
  .right-panel { width: 100%; min-width: 100%; border-left: none; }
}
</style>
