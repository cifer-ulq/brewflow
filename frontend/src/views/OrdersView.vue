<template>
  <div class="orders-wrap">
    <!-- Tab nav -->
    <div class="tab-nav">
      <button
        v-if="canCreateOrder"
        class="tab-btn"
        :class="{ active: activeTab === 'pos' }"
        @click="activeTab = 'pos'"
      >
        <el-icon><ShoppingCart /></el-icon>
        New Order (POS)
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'history' }"
        @click="activeTab = 'history'"
      >
        <el-icon><List /></el-icon>
        Order History
      </button>
    </div>

    <!-- ══ POS TAB ══ -->
    <div v-if="activeTab === 'pos'" class="pos-layout">

      <!-- Left: Menu grid -->
      <div class="menu-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <span class="panel-title">Menu Items</span>
            <span class="item-count">{{ filteredItems.length }} available</span>
          </div>
          <el-input
            v-model="search"
            placeholder="Search items…"
            prefix-icon="Search"
            clearable
            class="search-input"
          />
        </div>

        <div v-if="loadingItems" class="loading-area">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else class="menu-grid">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="menu-card"
            :class="{ 'menu-card-disabled': Number(item.quantity) <= 0 }"
            @click="Number(item.quantity) > 0 && addToCart(item)"
          >
            <div class="menu-card-category">{{ item.category || 'General' }}</div>
            <div class="menu-card-name">{{ item.name }}</div>
            <div class="menu-card-price">₱{{ Number(item.cost_price).toFixed(2) }}</div>
            <div class="menu-card-stock" :class="{ 'stock-low': Number(item.quantity) <= Number(item.reorder_level) }">
              {{ Number(item.quantity) <= 0 ? 'Out of stock' : `${item.quantity} ${item.unit} left` }}
            </div>
          </div>
          <div v-if="!filteredItems.length" class="menu-empty">
            No items match your search
          </div>
        </div>
      </div>

      <!-- Right: Cart -->
      <div class="cart-panel">
        <div class="cart-header">
          <span class="panel-title">Current Order</span>
          <button v-if="cart.length" class="clear-cart-btn" @click="cart = []">Clear all</button>
        </div>

        <div class="cart-branch">
          <label class="field-label">Branch</label>
          <el-select v-model="branch" placeholder="Select Branch" class="branch-select">
            <el-option label="Main Branch" value="Main Branch" />
            <el-option label="Branch 2" value="Branch 2" />
            <el-option label="Branch 3" value="Branch 3" />
          </el-select>
        </div>

        <div v-if="!cart.length" class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <div>Click items to add them here</div>
        </div>

        <div v-else class="cart-items">
          <div v-for="(ci, i) in cart" :key="ci.item_id" class="cart-row">
            <div class="cart-item-info">
              <div class="cart-item-name">{{ ci.item_name }}</div>
              <div class="cart-item-subtotal">₱{{ (ci.quantity * ci.unit_price).toFixed(2) }}</div>
            </div>
            <div class="cart-item-controls">
              <button class="qty-btn" @click="ci.quantity > 1 ? ci.quantity-- : cart.splice(i, 1)">−</button>
              <span class="qty-val">{{ ci.quantity }}</span>
              <button class="qty-btn" @click="ci.quantity < ci.maxQty && ci.quantity++">+</button>
              <button class="remove-btn" @click="cart.splice(i, 1)">×</button>
            </div>
          </div>
        </div>

        <div v-if="cart.length" class="cart-summary">
          <div class="cart-summary-row">
            <span>Subtotal</span>
            <span>₱{{ orderTotal.toFixed(2) }}</span>
          </div>
          <div class="cart-summary-row muted">
            <span>VAT (12%)</span>
            <span>₱{{ (orderTotal * 0.12).toFixed(2) }}</span>
          </div>
          <div class="cart-total-row">
            <span>Total</span>
            <span>₱{{ (orderTotal * 1.12).toFixed(2) }}</span>
          </div>
        </div>

        <button
          class="place-order-btn"
          :class="{ disabled: !cart.length || placing }"
          :disabled="!cart.length || placing"
          @click="placeOrder"
        >
          <span v-if="placing" class="btn-spinner"></span>
          <span v-else>Place Order</span>
        </button>
      </div>
    </div>

    <!-- ══ HISTORY TAB ══ -->
    <div v-if="activeTab === 'history'" class="history-panel">
      <div class="table-card">
        <div v-if="loadingOrders" class="loading-area" style="padding: 24px;">
          <el-skeleton :rows="6" animated />
        </div>
        <table v-else class="brew-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Branch</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in orders" :key="row.id" class="trow">
              <td class="td-id">#{{ row.id }}</td>
              <td class="td-muted">{{ row.branch }}</td>
              <td class="td-price">₱{{ Number(row.total_amount).toFixed(2) }}</td>
              <td>
                <span class="status-badge"
                  :class="{
                    'badge-green': row.status === 'completed',
                    'badge-red': row.status === 'cancelled',
                    'badge-amber': row.status === 'pending'
                  }">
                  {{ row.status }}
                </span>
              </td>
              <td class="td-muted">{{ new Date(row.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</td>
            </tr>
            <tr v-if="!orders.length">
              <td colspan="5" class="td-empty">No orders yet</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../store/auth';
import { getItems } from '../api/inventory';
import { getOrders, createOrder } from '../api/orders';

const auth = useAuthStore();
const canCreateOrder = computed(() => auth.user?.role === 'cashier');

const activeTab = ref(canCreateOrder.value ? 'pos' : 'history');
const search = ref('');
const branch = ref('Main Branch');
const cart = ref([]);
const placing = ref(false);

const allItems = ref([]);
const loadingItems = ref(false);

const orders = ref([]);
const loadingOrders = ref(false);

const filteredItems = computed(() =>
  allItems.value.filter((i) =>
    i.name.toLowerCase().includes(search.value.toLowerCase())
  )
);

const orderTotal = computed(() =>
  cart.value.reduce((s, i) => s + i.quantity * i.unit_price, 0)
);

const addToCart = (item) => {
  const existing = cart.value.find((c) => c.item_id === item.id);
  if (existing) {
    if (existing.quantity < existing.maxQty) existing.quantity++;
  } else {
    cart.value.push({
      item_id: item.id,
      item_name: item.name,
      quantity: 1,
      unit_price: Number(item.cost_price),
      maxQty: Number(item.quantity),
    });
  }
};

const placeOrder = async () => {
  placing.value = true;
  try {
    const res = await createOrder({ branch: branch.value, items: cart.value });
    const subtotal = res.data.total_amount;
    const tax = Math.round(subtotal * 0.12 * 100) / 100;
    ElMessage({
      type: 'success',
      duration: 5000,
      message: `Order #${res.data.id} placed!  Subtotal: ₱${Number(subtotal).toFixed(2)}  VAT (12%): ₱${tax.toFixed(2)}  Invoice Total: ₱${(subtotal + tax).toFixed(2)}`,
    });
    cart.value = [];
    activeTab.value = 'history';
    fetchItems();
    fetchOrders();
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Failed to place order');
  } finally {
    placing.value = false;
  }
};

const fetchItems = async () => {
  loadingItems.value = true;
  try {
    const { data } = await getItems();
    allItems.value = data;
  } finally {
    loadingItems.value = false;
  }
};

const fetchOrders = async () => {
  loadingOrders.value = true;
  try {
    const { data } = await getOrders();
    orders.value = data;
  } finally {
    loadingOrders.value = false;
  }
};

watch(activeTab, (tab) => {
  if (tab === 'history') fetchOrders();
});

onMounted(fetchItems);
</script>

<style scoped>
.orders-wrap { display: flex; flex-direction: column; gap: 20px; font-family: 'Inter', sans-serif; }

/* Tab nav */
.tab-nav {
  display: flex;
  gap: 6px;
  background: #FFFFFF;
  padding: 6px;
  border-radius: 12px;
  width: fit-content;
  border: 1px solid #EDE5D8;
  box-shadow: 0 1px 4px rgba(139,90,43,0.05);
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  background: none;
  font-size: 13.5px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #9B7A5A;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn:hover { background: #FEF9F3; color: #7C5A38; }
.tab-btn.active { background: linear-gradient(135deg, #D97706, #B45309); color: #fff; box-shadow: 0 2px 8px rgba(217,119,6,0.3); }

/* POS layout */
.pos-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  align-items: start;
}

/* Panels */
.menu-panel, .cart-panel {
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #EDE5D8;
  box-shadow: 0 1px 8px rgba(139,90,43,0.07);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #F5EFE8;
  gap: 12px;
}
.panel-title-group { display: flex; align-items: center; gap: 10px; }
.panel-title { font-size: 15px; font-weight: 700; color: #1C0A00; }
.item-count { font-size: 12px; color: #9B7A5A; background: #F5EFE8; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
:deep(.search-input) { width: 180px; }

.loading-area { padding: 20px; }

/* Menu grid */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  padding: 16px;
  max-height: 560px;
  overflow-y: auto;
}
.menu-card {
  border: 1.5px solid #EDE5D8;
  border-radius: 12px;
  padding: 14px 12px;
  cursor: pointer;
  transition: all 0.18s;
  background: #FEFCF9;
}
.menu-card:hover { border-color: #F59E0B; background: #FFFBF0; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(245,158,11,0.15); }
.menu-card-disabled { opacity: 0.4; cursor: not-allowed; }
.menu-card-disabled:hover { transform: none; box-shadow: none; border-color: #EDE5D8; background: #FEFCF9; }
.menu-card-category { font-size: 10px; font-weight: 600; color: #C4A882; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 6px; }
.menu-card-name { font-size: 14px; font-weight: 700; color: #1C0A00; margin-bottom: 8px; line-height: 1.3; }
.menu-card-price { font-size: 16px; font-weight: 800; color: #D97706; margin-bottom: 4px; }
.menu-card-stock { font-size: 11px; color: #9B7A5A; }
.menu-card-stock.stock-low { color: #DC2626; font-weight: 600; }
.menu-empty { grid-column: 1/-1; text-align: center; color: #C4A882; padding: 40px; font-size: 14px; }

/* Cart panel */
.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #F5EFE8;
}
.clear-cart-btn {
  font-size: 12px; font-weight: 600;
  color: #DC2626; background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 6px; padding: 4px 10px;
  cursor: pointer; font-family: 'Inter', sans-serif;
  transition: background 0.15s;
}
.clear-cart-btn:hover { background: #FEE2E2; }

.cart-branch { padding: 12px 20px; border-bottom: 1px solid #F5EFE8; }
.field-label { font-size: 11px; font-weight: 600; color: #9B7A5A; text-transform: uppercase; letter-spacing: 0.6px; display: block; margin-bottom: 6px; }
:deep(.branch-select) { width: 100%; }

.cart-empty { text-align: center; padding: 40px 20px; color: #C4A882; font-size: 13px; }
.cart-empty-icon { font-size: 32px; margin-bottom: 8px; }

.cart-items { max-height: 300px; overflow-y: auto; padding: 8px 12px; }
.cart-row { display: flex; flex-direction: column; gap: 6px; padding: 10px 8px; border-bottom: 1px solid #FAF6F1; }
.cart-row:last-child { border-bottom: none; }
.cart-item-info { display: flex; align-items: center; justify-content: space-between; }
.cart-item-name { font-size: 13px; font-weight: 600; color: #1C0A00; }
.cart-item-subtotal { font-size: 13px; font-weight: 700; color: #D97706; }
.cart-item-controls { display: flex; align-items: center; gap: 6px; }
.qty-btn {
  width: 26px; height: 26px;
  border-radius: 6px;
  border: 1px solid #EDE5D8;
  background: #F5EFE8;
  color: #7C5A38;
  font-size: 16px; font-weight: 700;
  cursor: pointer; font-family: 'Inter', sans-serif;
  transition: background 0.12s;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
}
.qty-btn:hover { background: #EDE5D8; }
.qty-val { font-size: 14px; font-weight: 700; min-width: 24px; text-align: center; color: #1C0A00; }
.remove-btn {
  margin-left: 4px;
  width: 22px; height: 22px;
  border-radius: 50%;
  border: none;
  background: #FEE2E2;
  color: #DC2626;
  font-size: 16px; font-weight: 700;
  cursor: pointer; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
  transition: background 0.12s;
}
.remove-btn:hover { background: #FECACA; }

.cart-summary { padding: 14px 20px; border-top: 1px solid #F5EFE8; display: flex; flex-direction: column; gap: 6px; }
.cart-summary-row { display: flex; justify-content: space-between; font-size: 13px; color: #7C5A38; }
.cart-summary-row.muted { color: #9B7A5A; }
.cart-total-row { display: flex; justify-content: space-between; font-size: 17px; font-weight: 800; color: #1C0A00; padding-top: 8px; border-top: 2px solid #EDE5D8; margin-top: 4px; }

.place-order-btn {
  margin: 12px 20px 20px;
  width: calc(100% - 40px);
  height: 48px;
  background: linear-gradient(135deg, #D97706, #B45309);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 4px 16px rgba(217,119,6,0.35);
}
.place-order-btn:hover:not(.disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(217,119,6,0.45); }
.place-order-btn.disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.btn-spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* History */
.history-panel {}
.table-card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #EDE5D8;
  box-shadow: 0 1px 8px rgba(139,90,43,0.07);
  overflow: hidden;
}
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
.brew-table td { padding: 13px 16px; font-size: 13.5px; vertical-align: middle; }
.td-id { font-weight: 700; color: #1C0A00; }
.td-muted { color: #9B7A5A; }
.td-price { font-weight: 700; color: #1C0A00; }
.td-empty { text-align: center; color: #C4A882; padding: 40px; font-size: 14px; }

.status-badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.badge-green { background: #D1FAE5; color: #065F46; }
.badge-amber { background: #FEF3C7; color: #92400E; }
.badge-red   { background: #FEE2E2; color: #991B1B; }
</style>
