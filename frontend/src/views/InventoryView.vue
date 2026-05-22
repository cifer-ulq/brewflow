<template>
  <div class="page-wrap">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-heading">Inventory</h2>
        <div class="page-meta">
          <span class="meta-pill">{{ items.length }} items total</span>
          <span v-if="lowStockCount > 0" class="meta-pill meta-pill-red">
            ⚠ {{ lowStockCount }} low stock
          </span>
        </div>
      </div>
      <el-button v-if="canWrite" type="primary" @click="openDialog()" class="action-btn">
        <el-icon style="margin-right:6px"><Plus /></el-icon>
        Add Item
      </el-button>
    </div>

    <!-- Table card -->
    <div class="table-card">
      <div v-if="loading" class="table-loading-wrap">
        <el-skeleton :rows="6" animated />
      </div>
      <table v-else class="brew-table">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Category</th>
            <th>Stock Level</th>
            <th>Reorder At</th>
            <th>Unit Price</th>
            <th v-if="canWrite">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in items" :key="row.id" class="trow">
            <td class="td-name">{{ row.name }}</td>
            <td>
              <span class="cat-badge">{{ row.category || '—' }}</span>
            </td>
            <td>
              <span class="stock-badge" :class="Number(row.quantity) <= Number(row.reorder_level) ? 'stock-low' : 'stock-ok'">
                {{ row.quantity }} {{ row.unit }}
              </span>
            </td>
            <td class="td-muted">{{ row.reorder_level }}</td>
            <td class="td-price">₱{{ Number(row.cost_price).toFixed(2) }}</td>
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
          <tr v-if="!items.length">
            <td :colspan="canWrite ? 6 : 5" class="td-empty">No inventory items yet</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add / Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="editId ? 'Edit Item' : 'Add New Item'" width="500px" @closed="resetForm" class="brew-dialog">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="130px">
        <el-form-item label="Name" prop="name">
          <el-input v-model="form.name" placeholder="e.g. Arabica Beans" />
        </el-form-item>
        <el-form-item label="Category">
          <el-input v-model="form.category" placeholder="e.g. Coffee, Milk, Syrup" />
        </el-form-item>
        <el-form-item label="Quantity" prop="quantity">
          <el-input-number v-model="form.quantity" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="Unit">
          <el-select v-model="form.unit" style="width: 100%;">
            <el-option label="pcs" value="pcs" />
            <el-option label="kg" value="kg" />
            <el-option label="liters" value="liters" />
            <el-option label="grams" value="grams" />
            <el-option label="boxes" value="boxes" />
          </el-select>
        </el-form-item>
        <el-form-item label="Reorder Level">
          <el-input-number v-model="form.reorder_level" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="Unit Price (₱)" prop="cost_price">
          <el-input-number v-model="form.cost_price" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="saving">
            {{ editId ? 'Update Item' : 'Add Item' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '../store/auth';
import * as inventoryApi from '../api/inventory';

const auth = useAuthStore();
const canWrite = computed(() => ['admin', 'manager'].includes(auth.user?.role));

const items = ref([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editId = ref(null);
const formRef = ref(null);

const form = reactive({
  name: '', category: '', quantity: 0, unit: 'pcs', reorder_level: 10, cost_price: 0,
});

const rules = {
  name: [{ required: true, message: 'Item name is required', trigger: 'blur' }],
  quantity: [{ required: true, type: 'number', message: 'Quantity is required', trigger: 'change' }],
  cost_price: [{ required: true, type: 'number', message: 'Price is required', trigger: 'change' }],
};

const lowStockCount = computed(
  () => items.value.filter((i) => Number(i.quantity) <= Number(i.reorder_level)).length
);

const fetchItems = async () => {
  loading.value = true;
  try {
    const { data } = await inventoryApi.getItems();
    items.value = data;
  } catch {
    ElMessage.error('Failed to load inventory');
  } finally {
    loading.value = false;
  }
};

const openDialog = (row = null) => {
  editId.value = row?.id || null;
  Object.assign(form, {
    name: row?.name || '',
    category: row?.category || '',
    quantity: Number(row?.quantity) || 0,
    unit: row?.unit || 'pcs',
    reorder_level: Number(row?.reorder_level) || 10,
    cost_price: Number(row?.cost_price) || 0,
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
      await inventoryApi.updateItem(editId.value, form);
      ElMessage.success('Item updated successfully');
    } else {
      await inventoryApi.createItem(form);
      ElMessage.success('Item added successfully');
    }
    dialogVisible.value = false;
    fetchItems();
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Failed to save item');
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('Are you sure you want to delete this item?', 'Confirm Delete', {
      type: 'warning',
      confirmButtonText: 'Delete',
      confirmButtonClass: 'el-button--danger',
    });
    await inventoryApi.deleteItem(id);
    ElMessage.success('Item deleted');
    fetchItems();
  } catch {
    // user cancelled or request failed — do nothing
  }
};

onMounted(fetchItems);
</script>

<style scoped>
.page-wrap { display: flex; flex-direction: column; gap: 20px; font-family: 'Inter', sans-serif; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-header-left { display: flex; flex-direction: column; gap: 6px; }
.page-heading { font-size: 20px; font-weight: 800; color: #1C0A00; margin: 0; letter-spacing: -0.4px; }
.page-meta { display: flex; gap: 8px; align-items: center; }
.meta-pill {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  background: #F5EFE8;
  color: #7C5A38;
  border: 1px solid #EDE0CC;
}
.meta-pill-red { background: #FEE2E2; color: #991B1B; border-color: #FECACA; }

.action-btn { border-radius: 10px !important; font-weight: 600 !important; }

/* Table card */
.table-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 1px 8px rgba(139,90,43,0.07);
  border: 1px solid #EDE5D8;
  overflow: hidden;
}
.table-loading-wrap { padding: 24px; }

.brew-table { width: 100%; border-collapse: collapse; }
.brew-table thead tr { background: #FEF9F3; border-bottom: 2px solid #EDE5D8; }
.brew-table th {
  font-size: 11px;
  font-weight: 700;
  color: #9B7A5A;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 14px 16px;
  text-align: left;
}
.brew-table tbody .trow { border-bottom: 1px solid #FAF6F1; transition: background 0.12s; }
.brew-table tbody .trow:last-child { border-bottom: none; }
.brew-table tbody .trow:hover { background: #FEF9F3; }
.brew-table td { padding: 13px 16px; font-size: 13.5px; vertical-align: middle; }

.td-name { font-weight: 600; color: #1C0A00; }
.td-muted { color: #9B7A5A; }
.td-price { font-weight: 700; color: #1C0A00; }
.td-empty { text-align: center; color: #C4A882; padding: 40px; font-size: 14px; }

.cat-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: #F5EFE8;
  color: #7C5A38;
}
.stock-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.stock-ok  { background: #D1FAE5; color: #065F46; }
.stock-low { background: #FEE2E2; color: #991B1B; }

.row-actions { display: flex; gap: 6px; }
.icon-btn {
  width: 32px; height: 32px;
  border-radius: 8px;
  border: 1px solid;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 14px;
}
.icon-btn-edit  { background: #EFF6FF; border-color: #BFDBFE; color: #2563EB; }
.icon-btn-edit:hover  { background: #DBEAFE; }
.icon-btn-delete  { background: #FEF2F2; border-color: #FECACA; color: #DC2626; }
.icon-btn-delete:hover  { background: #FEE2E2; }

.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
</style>
