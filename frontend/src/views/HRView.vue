<template>
  <div class="page-wrap">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-heading">Human Resources</h2>
        <span class="meta-pill">{{ employees.length }} employee(s)</span>
      </div>
      <el-button v-if="canWrite" type="primary" @click="openDialog()" class="action-btn">
        <el-icon style="margin-right:6px"><Plus /></el-icon>
        Add Employee
      </el-button>
    </div>

    <!-- Table card -->
    <div class="table-card">
      <div v-if="loading" class="loading-wrap"><el-skeleton :rows="6" animated /></div>
      <table v-else class="brew-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Position</th>
            <th>Department</th>
            <th>Branch</th>
            <th>Salary</th>
            <th>Status</th>
            <th v-if="canWrite">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in employees" :key="row.id" class="trow">
            <td class="td-name">
              <div class="employee-cell">
                <div class="emp-avatar">{{ row.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) }}</div>
                {{ row.name }}
              </div>
            </td>
            <td class="td-muted">{{ row.email }}</td>
            <td class="td-secondary">{{ row.position || '—' }}</td>
            <td>
              <span class="dept-badge">{{ row.department || '—' }}</span>
            </td>
            <td class="td-muted">{{ row.branch || '—' }}</td>
            <td class="td-price">₱{{ Number(row.salary).toLocaleString() }}</td>
            <td>
              <span class="status-badge" :class="row.status === 'active' ? 'badge-green' : 'badge-gray'">
                {{ row.status }}
              </span>
            </td>
            <td v-if="canWrite">
              <div class="row-actions">
                <button class="icon-btn icon-btn-edit" @click="openDialog(row)" title="Edit">
                  <el-icon><Edit /></el-icon>
                </button>
                <button class="icon-btn icon-btn-delete" @click="handleDelete(row.id)" title="Delete">
                  <el-icon><Delete /></el-icon>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!employees.length">
            <td :colspan="canWrite ? 8 : 7" class="td-empty">No employees found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add / Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="editId ? 'Edit Employee' : 'Add Employee'" width="520px" @closed="resetForm">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="Full Name" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" type="email" />
        </el-form-item>
        <el-form-item label="Position">
          <el-input v-model="form.position" placeholder="e.g. Barista, Cashier" />
        </el-form-item>
        <el-form-item label="Department">
          <el-select v-model="form.department" style="width: 100%;" clearable>
            <el-option label="Operations" value="Operations" />
            <el-option label="Finance" value="Finance" />
            <el-option label="Human Resources" value="Human Resources" />
            <el-option label="Marketing" value="Marketing" />
          </el-select>
        </el-form-item>
        <el-form-item label="Branch">
          <el-select v-model="form.branch" style="width: 100%;" clearable>
            <el-option label="Main Branch" value="Main Branch" />
            <el-option label="Branch 2" value="Branch 2" />
            <el-option label="Branch 3" value="Branch 3" />
          </el-select>
        </el-form-item>
        <el-form-item label="Salary (₱)" prop="salary">
          <el-input-number v-model="form.salary" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="Date Hired">
          <el-date-picker v-model="form.hired_at" type="date" style="width: 100%;" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="saving">
            {{ editId ? 'Update Employee' : 'Add Employee' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '../store/auth';
import * as hrApi from '../api/hr';

const auth = useAuthStore();
const canWrite = computed(() => auth.user?.role === 'admin');

const employees = ref([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editId = ref(null);
const formRef = ref(null);

const form = reactive({
  name: '', email: '', position: '', department: '', branch: '', salary: 0, hired_at: '',
});

const rules = {
  name: [{ required: true, message: 'Full name is required', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: 'Valid email is required', trigger: 'blur' }],
  salary: [{ required: true, type: 'number', message: 'Salary is required', trigger: 'change' }],
};

const fetchEmployees = async () => {
  loading.value = true;
  try {
    const { data } = await hrApi.getEmployees();
    employees.value = data;
  } catch {
    ElMessage.error('Failed to load employees');
  } finally {
    loading.value = false;
  }
};

const openDialog = (row = null) => {
  editId.value = row?.id || null;
  Object.assign(form, {
    name: row?.name || '',
    email: row?.email || '',
    position: row?.position || '',
    department: row?.department || '',
    branch: row?.branch || '',
    salary: Number(row?.salary) || 0,
    hired_at: row?.hired_at?.split('T')[0] || '',
  });
  dialogVisible.value = true;
};

const resetForm = () => {
  formRef.value?.resetFields();
  editId.value = null;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    if (editId.value) {
      await hrApi.updateEmployee(editId.value, form);
      ElMessage.success('Employee updated');
    } else {
      await hrApi.createEmployee(form);
      ElMessage.success('Employee added');
    }
    dialogVisible.value = false;
    fetchEmployees();
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Failed to save employee');
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('Remove this employee from the system?', 'Confirm', {
      type: 'warning',
      confirmButtonText: 'Remove',
      confirmButtonClass: 'el-button--danger',
    });
    await hrApi.deleteEmployee(id);
    ElMessage.success('Employee removed');
    fetchEmployees();
  } catch {
    // cancelled
  }
};

onMounted(fetchEmployees);
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
.td-name { font-weight: 600; color: #1C0A00; }
.td-secondary { color: #4A3520; font-weight: 500; }
.td-muted { color: #9B7A5A; }
.td-price { font-weight: 700; color: #1C0A00; }
.td-empty { text-align: center; color: #C4A882; padding: 40px; font-size: 14px; }

.employee-cell { display: flex; align-items: center; gap: 10px; }
.emp-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, #D97706, #92400E);
  color: #fff; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; letter-spacing: 0.5px;
}

.dept-badge {
  display: inline-block; padding: 3px 10px;
  border-radius: 6px; font-size: 12px; font-weight: 600;
  background: #EFF6FF; color: #1D4ED8;
}

.status-badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.badge-green { background: #D1FAE5; color: #065F46; }
.badge-gray  { background: #F3F4F6; color: #6B7280; }

.row-actions { display: flex; gap: 6px; }
.icon-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s; font-size: 14px;
}
.icon-btn-edit  { background: #EFF6FF; border-color: #BFDBFE; color: #2563EB; }
.icon-btn-edit:hover  { background: #DBEAFE; }
.icon-btn-delete  { background: #FEF2F2; border-color: #FECACA; color: #DC2626; }
.icon-btn-delete:hover  { background: #FEE2E2; }

.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
</style>
