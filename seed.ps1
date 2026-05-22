# BrewFlow Seed Script
# Seeds: 15 inventory items, 6 HR employees, 50+ orders + invoices
Set-StrictMode -Off
$ErrorActionPreference = 'Stop'
$base = "http://localhost:3000/api/v1"

Write-Host "`n=== Phase 1: Login ===" -ForegroundColor Cyan
$token = (Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@brewflow.com","password":"admin123"}').token
$h = @{ Authorization = "Bearer $token" }
Write-Host "Logged in OK" -ForegroundColor Green

# ─── Phase 2: Inventory Items ───────────────────────────────────────────────
Write-Host "`n=== Phase 2: Seeding 15 Inventory Items ===" -ForegroundColor Cyan
$items = @(
  @{ name="Arabica Coffee Beans";  category="Coffee";    quantity=500; unit="kg";     reorder_level=50;  cost_price=850  },
  @{ name="Robusta Coffee Beans";  category="Coffee";    quantity=300; unit="kg";     reorder_level=40;  cost_price=450  },
  @{ name="Full Cream Milk";       category="Dairy";     quantity=200; unit="liters"; reorder_level=30;  cost_price=75   },
  @{ name="Oat Milk";              category="Dairy";     quantity=100; unit="liters"; reorder_level=20;  cost_price=120  },
  @{ name="Vanilla Syrup";         category="Syrup";     quantity=50;  unit="liters"; reorder_level=10;  cost_price=350  },
  @{ name="Caramel Syrup";         category="Syrup";     quantity=50;  unit="liters"; reorder_level=10;  cost_price=350  },
  @{ name="Hazelnut Syrup";        category="Syrup";     quantity=30;  unit="liters"; reorder_level=8;   cost_price=380  },
  @{ name="Chocolate Powder";      category="Powder";    quantity=30;  unit="kg";     reorder_level=5;   cost_price=550  },
  @{ name="Green Tea Powder";      category="Powder";    quantity=20;  unit="kg";     reorder_level=5;   cost_price=680  },
  @{ name="Disposable Cups 12oz";  category="Supplies";  quantity=2000;unit="pcs";    reorder_level=200; cost_price=3    },
  @{ name="Disposable Cups 16oz";  category="Supplies";  quantity=2000;unit="pcs";    reorder_level=200; cost_price=4    },
  @{ name="Coffee Lids";           category="Supplies";  quantity=3000;unit="pcs";    reorder_level=300; cost_price=1.5  },
  @{ name="Whipped Cream";         category="Dairy";     quantity=20;  unit="liters"; reorder_level=5;   cost_price=180  },
  @{ name="Paper Bags";            category="Supplies";  quantity=500; unit="pcs";    reorder_level=50;  cost_price=8    },
  @{ name="Straws";                category="Supplies";  quantity=2000;unit="pcs";    reorder_level=200; cost_price=0.5  }
)

$createdItems = @()
foreach ($item in $items) {
  $res = Invoke-RestMethod -Uri "$base/inventory" -Method POST -ContentType "application/json" `
    -Headers $h -Body ($item | ConvertTo-Json)
  $createdItems += $res
  Write-Host "  + $($res.name) (ID: $($res.id))" -ForegroundColor Green
}

# ─── Phase 3: HR Employees ──────────────────────────────────────────────────
Write-Host "`n=== Phase 3: Seeding 6 HR Employees ===" -ForegroundColor Cyan
$employees = @(
  @{ name="Maria Santos";    email="maria.santos@brewflow.com";   position="Store Manager";    department="Operations";       branch="Main Branch"; salary=45000; hired_at="2023-01-15" },
  @{ name="Juan dela Cruz";  email="juan.delacruz@brewflow.com";  position="Head Barista";     department="Operations";       branch="Main Branch"; salary=32000; hired_at="2023-03-01" },
  @{ name="Ana Reyes";       email="ana.reyes@brewflow.com";      position="Barista";          department="Operations";       branch="Branch 2";    salary=25000; hired_at="2023-06-10" },
  @{ name="Carlos Mendoza";  email="carlos.mendoza@brewflow.com"; position="Cashier";          department="Operations";       branch="Main Branch"; salary=22000; hired_at="2024-01-20" },
  @{ name="Rosa Garcia";     email="rosa.garcia@brewflow.com";    position="HR Officer";       department="Human Resources";  branch="Main Branch"; salary=38000; hired_at="2022-11-05" },
  @{ name="Miguel Torres";   email="miguel.torres@brewflow.com";  position="Finance Officer";  department="Finance";          branch="Main Branch"; salary=40000; hired_at="2022-09-12" }
)

foreach ($emp in $employees) {
  $res = Invoke-RestMethod -Uri "$base/hr" -Method POST -ContentType "application/json" `
    -Headers $h -Body ($emp | ConvertTo-Json)
  Write-Host "  + $($res.name) — $($res.position)" -ForegroundColor Green
}

# ─── Phase 4: Orders + Invoices via SQL ─────────────────────────────────────
Write-Host "`n=== Phase 4: Seeding 54 Orders + Invoices via SQL ===" -ForegroundColor Cyan

# Get the cashier's user id from auth_db
$cashierId = docker compose exec -T auth-db psql -U postgres -d auth_db -t -c "SELECT id FROM users WHERE role='cashier' LIMIT 1;"
$cashierId = $cashierId.Trim()
Write-Host "  Cashier ID: $cashierId"

# Build item lookup: index 0-14 => IDs from API
$iid = $createdItems | ForEach-Object { $_.id }

# Branches
$branches = @("Main Branch","Branch 2","Branch 3")

# Generate 54 orders spread over 30 days
# Each order: 1-3 items, varying amounts, mixed statuses (mostly completed)
$ordersSql = "BEGIN;`n"
$invoicesSql = "BEGIN;`n"

$orderDefs = @(
  # day, branch, status, items: (item_index, qty, price)
  @{ d=30; br=0; st="completed"; items=@(@(0,1,280),@(2,2,75)) },
  @{ d=30; br=0; st="completed"; items=@(@(3,1,120),@(4,1,350)) },
  @{ d=29; br=1; st="completed"; items=@(@(0,2,280)) },
  @{ d=29; br=0; st="completed"; items=@(@(7,1,550),@(12,1,180)) },
  @{ d=29; br=2; st="cancelled"; items=@(@(5,1,350)) },
  @{ d=28; br=0; st="completed"; items=@(@(1,1,450),@(2,3,75)) },
  @{ d=28; br=1; st="completed"; items=@(@(3,2,120),@(6,1,380)) },
  @{ d=27; br=0; st="completed"; items=@(@(0,1,280),@(4,1,350),@(12,1,180)) },
  @{ d=27; br=2; st="completed"; items=@(@(8,1,680)) },
  @{ d=27; br=0; st="completed"; items=@(@(9,10,3),@(11,10,1.5)) },
  @{ d=26; br=1; st="completed"; items=@(@(0,2,280),@(2,1,75)) },
  @{ d=26; br=0; st="completed"; items=@(@(5,2,350),@(7,1,550)) },
  @{ d=25; br=0; st="completed"; items=@(@(1,1,450)) },
  @{ d=25; br=2; st="completed"; items=@(@(3,1,120),@(4,2,350)) },
  @{ d=25; br=1; st="cancelled"; items=@(@(6,1,380)) },
  @{ d=24; br=0; st="completed"; items=@(@(0,3,280),@(12,2,180)) },
  @{ d=24; br=0; st="completed"; items=@(@(8,1,680),@(2,2,75)) },
  @{ d=23; br=1; st="completed"; items=@(@(5,1,350),@(3,1,120)) },
  @{ d=23; br=2; st="completed"; items=@(@(7,2,380),@(0,1,280)) },
  @{ d=23; br=0; st="completed"; items=@(@(9,20,3)) },
  @{ d=22; br=0; st="completed"; items=@(@(1,2,450),@(4,1,350)) },
  @{ d=22; br=1; st="completed"; items=@(@(2,3,75),@(12,1,180)) },
  @{ d=21; br=0; st="completed"; items=@(@(0,1,280),@(5,1,350),@(11,5,1.5)) },
  @{ d=21; br=2; st="cancelled"; items=@(@(3,1,120)) },
  @{ d=20; br=0; st="completed"; items=@(@(8,1,680)) },
  @{ d=20; br=1; st="completed"; items=@(@(0,2,280),@(2,1,75)) },
  @{ d=19; br=0; st="completed"; items=@(@(6,1,380),@(7,1,380)) },
  @{ d=19; br=2; st="completed"; items=@(@(4,2,350),@(12,1,180)) },
  @{ d=18; br=0; st="completed"; items=@(@(1,1,450),@(2,2,75)) },
  @{ d=18; br=1; st="completed"; items=@(@(0,3,280)) },
  @{ d=17; br=0; st="completed"; items=@(@(5,2,350),@(8,1,680)) },
  @{ d=17; br=2; st="completed"; items=@(@(3,2,120),@(9,5,3)) },
  @{ d=16; br=0; st="completed"; items=@(@(0,1,280),@(4,1,350),@(2,1,75)) },
  @{ d=16; br=1; st="completed"; items=@(@(7,1,380),@(12,2,180)) },
  @{ d=15; br=0; st="completed"; items=@(@(1,2,450)) },
  @{ d=15; br=2; st="completed"; items=@(@(6,1,380),@(3,1,120)) },
  @{ d=14; br=0; st="completed"; items=@(@(0,2,280),@(5,1,350)) },
  @{ d=14; br=1; st="cancelled"; items=@(@(8,1,680)) },
  @{ d=13; br=0; st="completed"; items=@(@(2,4,75),@(12,2,180),@(11,10,1.5)) },
  @{ d=13; br=2; st="completed"; items=@(@(4,1,350),@(7,1,380)) },
  @{ d=12; br=0; st="completed"; items=@(@(1,1,450),@(3,2,120)) },
  @{ d=12; br=1; st="completed"; items=@(@(0,3,280),@(2,2,75)) },
  @{ d=11; br=0; st="completed"; items=@(@(5,2,350),@(9,10,3)) },
  @{ d=10; br=2; st="completed"; items=@(@(0,1,280),@(8,1,680)) },
  @{ d=10; br=0; st="completed"; items=@(@(6,2,380),@(4,1,350)) },
  @{ d=9;  br=1; st="completed"; items=@(@(2,3,75),@(12,3,180)) },
  @{ d=9;  br=0; st="completed"; items=@(@(1,1,450),@(5,1,350)) },
  @{ d=8;  br=0; st="completed"; items=@(@(3,2,120),@(7,1,380),@(11,5,1.5)) },
  @{ d=7;  br=2; st="completed"; items=@(@(0,2,280),@(2,1,75)) },
  @{ d=6;  br=0; st="completed"; items=@(@(8,1,680),@(4,2,350)) },
  @{ d=5;  br=1; st="completed"; items=@(@(1,2,450),@(3,1,120)) },
  @{ d=4;  br=0; st="completed"; items=@(@(5,1,350),@(0,1,280),@(12,1,180)) },
  @{ d=3;  br=2; st="completed"; items=@(@(6,2,380)) },
  @{ d=2;  br=0; st="pending";   items=@(@(0,1,280),@(2,2,75)) }
)

$orderId = 1
foreach ($ord in $orderDefs) {
  $branchName = $branches[$ord.br]
  $total = 0
  foreach ($it in $ord.items) { $total += $it[1] * $it[2] }
  $total = [math]::Round($total, 2)
  $daysAgo = $ord.d
  $ordersSql += "INSERT INTO orders (cashier_id, branch, total_amount, status, created_at) VALUES ($cashierId, '$branchName', $total, '$($ord.st)', NOW() - INTERVAL '$daysAgo days') RETURNING id;`n"
}
$ordersSql += "COMMIT;"

# Run orders insert and capture IDs
$ordersResult = $ordersSql | docker compose exec -T orders-db psql -U postgres -d orders_db
Write-Host "  Orders inserted"

# Get the inserted order IDs
$insertedIds = docker compose exec -T orders-db psql -U postgres -d orders_db -t -c "SELECT id FROM orders ORDER BY id DESC LIMIT $($orderDefs.Count);"
$insertedIds = ($insertedIds -split "`n" | Where-Object { $_ -match '^\s*\d' } | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
$insertedIds = [array]($insertedIds | Select-Object -Last $orderDefs.Count)

Write-Host "  Got $($insertedIds.Count) order IDs"

# Build order_items + invoices SQL
$itemsSql = "BEGIN;`n"
$invoicesSql = "BEGIN;`n"

for ($i = 0; $i -lt $orderDefs.Count; $i++) {
  $ord = $orderDefs[$i]
  $oid = $insertedIds[$i]
  $total = 0
  foreach ($it in $ord.items) {
    $itemIdx = $it[0]; $qty = $it[1]; $price = $it[2]
    $itemId = $iid[$itemIdx]
    $itemName = $createdItems[$itemIdx].name
    $subtotal = $qty * $price
    $total += $subtotal
    $itemsSql += "INSERT INTO order_items (order_id, item_id, item_name, quantity, unit_price) VALUES ($oid, $itemId, '$itemName', $qty, $price);`n"
  }
  $total = [math]::Round($total, 2)
  $daysAgo = $ord.d
  if ($ord.st -eq "completed") {
    $invoicesSql += "INSERT INTO invoices (order_id, amount, tax, total, status, issued_at) VALUES ($oid, $total, 0, $total, 'paid', NOW() - INTERVAL '$daysAgo days');`n"
  }
}
$itemsSql += "COMMIT;"
$invoicesSql += "COMMIT;"

$itemsSql | docker compose exec -T orders-db psql -U postgres -d orders_db | Out-Null
Write-Host "  Order items inserted"

$invoicesSql | docker compose exec -T finance-db psql -U postgres -d finance_db | Out-Null
Write-Host "  Invoices inserted"

Write-Host "`n=== Seed Complete! ===" -ForegroundColor Green
Write-Host "  15 inventory items" -ForegroundColor White
Write-Host "  6 HR employees" -ForegroundColor White
Write-Host "  $($orderDefs.Count) orders (with items)" -ForegroundColor White
Write-Host "  $(($orderDefs | Where-Object { $_.st -eq 'completed' }).Count) invoices (paid)" -ForegroundColor White
