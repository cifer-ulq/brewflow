<template>
  <div class="page-wrap">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-heading">User Management</h2>
        <span class="meta-pill">{{ users.length }} system user(s)</span>
      </div>
      <el-button type="primary" @click="dialogVisible = true" class="action-btn">
        <el-icon style="margin-right:6px"><Plus /></el-icon>
        Add User
      </el-button>
    </div>

    <!-- Table card -->
    <div class="table-card">
      <div v-if="loading" class="loading-wrap"><el-skeleton :rows="5" animated /></div>
      <table v-else class="brew-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in users" :key="row.id" class="trow">
            <td>
              <div class="user-cell">
                <div class="user-avatar" :class="roleAvatarClass(row.role)">
                  {{ row.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || '?' }}
                </div>
                <div class="user-info">
                  <div class="user-name">{{ row.name }}</div>
                  <div class="user-id">ID #{{ row.id }}</div>
                </div>
              </div>
            </td>
            <td class="td-muted">{{ row.email }}</td>
            <td>
              <span class="role-badge" :class="roleBadgeClass(row.role)">{{ row.role }}</span>
            </td>
            <td class="td-muted">{{ new Date(row.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) }}</td>
            <td>
              <button
                class="icon-btn icon-btn-delete"
                :class="{ disabled: row.id === auth.user?.id }"
                :disabled="row.id === auth.user?.id"
                @click="handleDelete(row)"
                title="Delete user"
              >
                <el-icon><Delete /></el-icon>
              </button>
            </td>
          </tr>
          <tr v-if="!users.length">
            <td colspan="5" class="td-empty">No users found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add User Dialog -->
    <el-dialog v-model="dialogVisible" title="Add System User" width="440px" @closed="resetForm">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px">
        <el-form-item label="Full Name" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" type="email" />
        </el-form-item>
        <el-form-item label="Password" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="Role" prop="role">
          <el-select v-model="form.role" style="width: 100%;">
            <el-option label="Admin" value="admin" />
            <el-option label="Cashier" value="cashier" />
            <el-option label="Finance Officer" value="finance_officer" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="handleCreate" :loading="saving">Create User</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '../store/auth';
import * as usersApi from '../api/users';

const auth = useAuthStore();
const users = ref([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const formRef = ref(null);

const form = reactive({ name: '', email: '', password: '', role: 'cashier' });

const rules = {
  name:     [{ required: true, message: 'Name is required', trigger: 'blur' }],
  email:    [{ required: true, type: 'email', message: 'Valid email required', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: 'Min 6 characters', trigger: 'blur' }],
  role:     [{ required: true, message: 'Role is required', trigger: 'change' }],
};

const roleBadgeClass = (role) => ({
  admin: 'badge-red',
  manager: 'badge-amber',
  cashier: 'badge-green',
  finance_officer: 'badge-blue',
}[role] || 'badge-gray');

const roleAvatarClass = (role) => ({
  admin: 'avatar-red',
  manager: 'avatar-amber',
  cashier: 'avatar-green',
  finance_officer: 'avatar-blue',
}[role] || 'avatar-gray');

const fetchUsers = async () => {
  loading.value = true;
  try {
    const { data } = await usersApi.getUsers();
    users.value = data;
  } catch {
    ElMessage.error('Failed to load users');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  formRef.value?.resetFields();
  Object.assign(form, { name: '', email: '', password: '', role: 'cashier' });
};

const handleCreate = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    await usersApi.createUser(form);
    ElMessage.success('User created successfully');
    dialogVisible.value = false;
    fetchUsers();
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Failed to create user');
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Delete user "${row.name}" (${row.role})? This cannot be undone.`,
      'Confirm Delete',
      { type: 'warning', confirmButtonText: 'Delete', confirmButtonClass: 'el-button--danger' }
    );
    await usersApi.deleteUser(row.id);
    ElMessage.success('User deleted');
    fetchUsers();
  } catch {
    // cancelled
  }
};

onMounted(fetchUsers);
</script>

<style scoped>
.page-wrap { display: flex; flex-direction: column; gap: 20px; font-family: 'Inter', sans-serif; }

.page-header { display: flex; align-items: center; justify-content: space-between; }
.page-header-left { display: flex; align-items: center; gap: 12px; }
.page-heading { font-size: 20px; font-weight: 800; color: #1C0A00; margin: 0; letter-spacing: -0.4px; }
.meta-pill {
  font-size: 12px; font-weight: 600; padding: 3px 10px;
  border-radius: 20px; background: #F5EFE8; color: #7C5A38;
  border: 1px solid #EDE0CC;
}
.action-btn { border-radius: 10px !important; font-weight: 600 !important; }

.table-card {
  background: #FFFFFF; border-radius: 16px; overflow: hidden;
  border: 1px solid #EDE5D8; box-shadow: 0 1px 8px rgba(139,90,43,0.07);
}
.loading-wrap { padding: 24px; }

.brew-table { width: 100%; border-collapse: collapse; }
.brew-table thead tr { background: #FEF9F3; border-bottom: 2px solid #EDE5D8; }
.brew-table th {
  font-size: 11px; font-weight: 700; color: #9B7A5A;
  text-transform: uppercase; letter-spacing: 0.6px;
  padding: 14px 16px; text-align: left;
}
.brew-table tbody .trow { border-bottom: 1px solid #FAF6F1; transition: background 0.12s; }
.brew-table tbody .trow:last-child { border-bottom: none; }
.brew-table tbody .trow:hover { background: #FEF9F3; }
.brew-table td { padding: 12px 16px; font-size: 13.5px; vertical-align: middle; }
.td-muted { color: #9B7A5A; }
.td-empty { text-align: center; color: #C4A882; padding: 40px; font-size: 14px; }

.user-cell { display: flex; align-items: center; gap: 10px; }
.user-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; letter-spacing: 0.5px;
}
.avatar-red    { background: linear-gradient(135deg, #DC2626, #991B1B); color: #fff; }
.avatar-amber  { background: linear-gradient(135deg, #D97706, #92400E); color: #fff; }
.avatar-green  { background: linear-gradient(135deg, #16A34A, #14532D); color: #fff; }
.avatar-blue   { background: linear-gradient(135deg, #2563EB, #1E3A5F); color: #fff; }
.avatar-gray   { background: linear-gradient(135deg, #6B7280, #374151); color: #fff; }

.user-info { display: flex; flex-direction: column; gap: 1px; }
.user-name { font-size: 13.5px; font-weight: 600; color: #1C0A00; }
.user-id   { font-size: 11px; color: #C4A882; }

.role-badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.badge-red   { background: #FEE2E2; color: #991B1B; }
.badge-amber { background: #FEF3C7; color: #92400E; }
.badge-green { background: #D1FAE5; color: #065F46; }
.badge-blue  { background: #DBEAFE; color: #1E40AF; }
.badge-gray  { background: #F3F4F6; color: #6B7280; }

.icon-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s; font-size: 14px;
}
.icon-btn-delete  { background: #FEF2F2; border-color: #FECACA; color: #DC2626; }
.icon-btn-delete:hover:not(.disabled)  { background: #FEE2E2; }
.icon-btn-delete.disabled  { opacity: 0.35; cursor: not-allowed; }

.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
</style>
