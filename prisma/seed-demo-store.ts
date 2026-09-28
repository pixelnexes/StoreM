/**
 * Seeds the dedicated Demo Store — a separate tenant with sample products,
 * customers, suppliers, purchases and sales. The real store (demo-tenant /
 * Ubaer General Store) is never touched.
 *
 *   npm run demo:seed        (uses DATABASE_URL from .env)
 *
 * Idempotent: the store is upserted and the sales block is skipped if the
 * demo tenant already has invoices.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { computeSaleTotals, settlePayments } from '../src/domain/sales';
import { formatInvoiceNumber } from '../src/domain/invoice';

const prisma = new PrismaClient();
const T = 'demo-store';

const day = (d: number) => new Date(Date.now() - d * 86400000);

async function main() {
  const existing = await prisma.tenant.findUnique({ where: { id: T } });
  if (existing) {
    const sales = await prisma.sale.count({ where: { tenantId: T } });
    if (sales > 0) {
      console.log(`Demo Store already seeded (${sales} invoices). Nothing to do.`);
      await prisma.$disconnect();
      return;
    }
  }

  console.log('🌱 Seeding Demo Store…');

  const customPlan = await prisma.plan.findUniqueOrThrow({ where: { key: 'enterprise' } });

  // ── Store ───────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { id: T },
    update: {},
    create: {
      id: T,
      name: 'Demo Store',
      businessName: 'Demo Store',
      businessType: 'General Store',
      phone: '03000000000',
      currency: 'PKR',
      address: 'Sample Road, Karachi',
      settings: { create: { invoicePrefix: 'INV', nextInvoiceNo: 1 } },
      subscription: {
        create: { planId: customPlan.id, status: 'ACTIVE', billingCycle: 'monthly', currentPeriodEnd: day(-30) },
      },
    },
  });

  const branch = await prisma.branch.upsert({
    where: { id: 'demostore-branch' },
    update: {},
    create: { id: 'demostore-branch', tenantId: tenant.id, name: 'Demo Branch', phone: '03000000000' },
  });

  const ownerPass = await bcrypt.hash('demostore123', 12);
  const owner = await prisma.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '03009990001' } },
    update: {},
    create: {
      tenantId: tenant.id, name: 'Demo Owner', phone: '03009990001',
      email: 'demo@markazos.app', passwordHash: ownerPass, role: 'OWNER',
    },
  });
  const cashierPass = await bcrypt.hash('democashier123', 12);
  const cashier = await prisma.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '03009990002' } },
    update: {},
    create: {
      tenantId: tenant.id, name: 'Demo Cashier', phone: '03009990002',
      passwordHash: cashierPass, role: 'CASHIER',
    },
  });

  // ── Catalogue ───────────────────────────────────────────────
  const categories = ['Grocery', 'Beverages', 'Personal Care', 'Dairy & Bakery'];
  const catIds = new Map<string, string>();
  for (const name of categories) {
    const c = await prisma.category.create({
      data: { tenantId: tenant.id, name },
    });
    catIds.set(name, c.id);
  }

  type P = { sku: string; name: string; cat: string; cost: number; price: number; open: number };
  const products: P[] = [
    { sku: 'DEM-001', name: 'Surf Excel 500g',      cat: 'Grocery',        cost: 480,  price: 540,  open: 40 },
    { sku: 'DEM-002', name: 'National Chilli Sauce',cat: 'Grocery',        cost: 240,  price: 295,  open: 36 },
    { sku: 'DEM-003', name: 'Dalda Cooking Oil 1L', cat: 'Grocery',        cost: 610,  price: 680,  open: 30 },
    { sku: 'DEM-004', name: 'Milkpak 1L',           cat: 'Dairy & Bakery', cost: 245,  price: 275,  open: 48 },
    { sku: 'DEM-005', name: 'Dawn Bread 400g',      cat: 'Dairy & Bakery', cost: 190,  price: 220,  open: 45 },
    { sku: 'DEM-006', name: 'Colgate 100g',         cat: 'Personal Care',  cost: 260,  price: 310,  open: 32 },
    { sku: 'DEM-007', name: 'Lifebuoy Soap',        cat: 'Personal Care',  cost: 130,  price: 165,  open: 60 },
    { sku: 'DEM-008', name: 'Lays 52g',             cat: 'Grocery',        cost: 60,   price: 80,   open: 90 },
    { sku: 'DEM-009', name: 'Coca-Cola 1.5L',       cat: 'Beverages',      cost: 190,  price: 225,  open: 50 },
    { sku: 'DEM-010', name: 'Tapal Danedar 950g',   cat: 'Grocery',        cost: 1450, price: 1590, open: 18 },
    { sku: 'DEM-011', name: 'Eggs (dozen)',         cat: 'Dairy & Bakery', cost: 260,  price: 310,  open: 40 },
    { sku: 'DEM-012', name: 'Basmati Rice 5kg',     cat: 'Grocery',        cost: 1750, price: 1950, open: 20 },
  ];

  const stock = new Map<number, number>();
  const productIds: string[] = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const row = await prisma.product.upsert({
      where: { id: `demostore-${p.sku}` },
      update: {},
      create: {
        id: `demostore-${p.sku}`, tenantId: tenant.id, name: p.name, sku: p.sku,
        categoryId: catIds.get(p.cat) ?? null, baseUnit: 'piece',
        purchasePrice: p.cost, sellingPrice: p.price, minimumStock: 5,
      },
    });
    productIds.push(row.id);
    await prisma.inventoryTransaction.create({
      data: {
        tenantId: tenant.id, branchId: branch.id, productId: row.id,
        type: 'PURCHASE', quantity: p.open, unitCost: p.cost, createdBy: owner.id,
        createdAt: day(16),
      },
    });
    stock.set(i, p.open);
  }

  // ── Customers & suppliers ───────────────────────────────────
  const customerSeed = [
    { name: 'Bilal Ahmed',  phone: '03218000001' },
    { name: 'Sana Khan',    phone: '03228000002' },
    { name: 'Rizwan Ali',   phone: '03238000003' },
    { name: 'Faisal Mehmood', phone: '03338000004' },
    { name: 'Hina Shah',    phone: '03348000005' },
    { name: 'Tariq Aziz',   phone: '03358000006' },
  ];
  const customerIds: string[] = [];
  for (const c of customerSeed) {
    const row = await prisma.customer.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: c.phone } },
      update: {},
      create: { tenantId: tenant.id, name: c.name, phone: c.phone, whatsappPhone: c.phone },
    });
    customerIds.push(row.id);
  }

  const supplier1 = await prisma.supplier.create({
    data: { tenantId: tenant.id, name: 'Ittehad Wholesale', phone: '02134567890' },
  });
  const supplier2 = await prisma.supplier.create({
    data: { tenantId: tenant.id, name: 'Metro Cash & Carry', phone: '02139876543' },
  });

  // ── One restock purchase ────────────────────────────────────
  const purchaseLines = [[0, 20], [8, 40], [11, 10]] as const;
  let purchaseTotal = 0;
  const purchaseItems = purchaseLines.map(([idx, qty]) => {
    const line = products[idx as number].cost * qty;
    purchaseTotal += line;
    return { productId: productIds[idx as number], quantity: qty, unitCost: products[idx as number].cost, total: line };
  });
  const purchase = await prisma.purchase.create({
    data: {
      tenantId: tenant.id, branchId: branch.id, supplierId: supplier1.id,
      reference: 'RESTOCK-001', subtotal: purchaseTotal, total: purchaseTotal,
      paidAmount: purchaseTotal, status: 'completed', createdAt: day(15),
      items: { create: purchaseItems },
    },
  });
  for (const it of purchaseItems) {
    await prisma.inventoryTransaction.create({
      data: {
        tenantId: tenant.id, branchId: branch.id, productId: it.productId,
        type: 'PURCHASE', quantity: it.quantity, unitCost: it.unitCost,
        referenceType: 'PURCHASE', referenceId: purchase.id, createdBy: owner.id,
        createdAt: day(15),
      },
    });
  }
  await prisma.paymentTerminal.upsert({
    where: { id: 'demostore-terminal' },
    update: {},
    create: { id: 'demostore-terminal', tenantId: tenant.id, branchId: branch.id, name: 'Demo Card Machine', provider: 'Demo Bank' },
  });

  // ── Sales history ───────────────────────────────────────────
  type SaleSpec = {
    ago: number; c: number; lines: [number, number][];
    paid: 'full' | 'half' | 'credit'; method: 'CASH' | 'CARD' | 'ONLINE';
  };
  const sales: SaleSpec[] = [
    { ago: 13, c: 0, lines: [[0, 1], [3, 2]],                     paid: 'full',    method: 'CASH' },
    { ago: 12, c: 1, lines: [[9, 1], [10, 1]],                    paid: 'full',    method: 'CASH' },
    { ago: 10, c: 2, lines: [[4, 2], [5, 1], [7, 4]],             paid: 'half',    method: 'CASH' },
    { ago: 9,  c: 3, lines: [[2, 1], [11, 1]],                    paid: 'full',    method: 'CARD' },
    { ago: 7,  c: 4, lines: [[6, 3], [8, 2]],                     paid: 'full',    method: 'ONLINE' },
    { ago: 6,  c: 0, lines: [[1, 2], [9, 1]],                     paid: 'credit',  method: 'CASH' },
    { ago: 5,  c: 5, lines: [[3, 3], [4, 1]],                     paid: 'full',    method: 'CASH' },
    { ago: 3,  c: 2, lines: [[5, 2], [7, 2], [11, 1]],            paid: 'full',    method: 'CASH' },
    { ago: 2,  c: 1, lines: [[0, 2], [10, 2]],                    paid: 'half',    method: 'CASH' },
    { ago: 1,  c: 4, lines: [[8, 6], [2, 1]],                     paid: 'full',    method: 'CASH' },
    { ago: 0,  c: 3, lines: [[9, 1], [1, 1], [6, 1]],             paid: 'full',    method: 'ONLINE' },
  ];

  let seq = 1;
  let balance = 0;
  for (const spec of sales) {
    const lines = spec.lines.map(([idx, qty]) => ({
      idx, qty, unitPrice: products[idx].price, cost: products[idx].cost,
    }));
    const totals = computeSaleTotals(lines.map((l) => ({ quantity: l.qty, unitPrice: l.unitPrice })));
    const paidAmount =
      spec.paid === 'full' ? totals.total
      : spec.paid === 'half' ? Math.round(totals.total / 2)
      : 0;
    const settlement = settlePayments(totals.total, [{ method: spec.method, amount: paidAmount } as const]);
    const invoiceNumber = formatInvoiceNumber({ prefix: 'INV', sequence: seq });
    const stamp = day(spec.ago - 0.4);

    const sale = await prisma.sale.create({
      data: {
        tenantId: tenant.id, branchId: branch.id, invoiceNumber,
        customerId: customerIds[spec.c],
        subtotal: totals.subtotal, discount: totals.discount, tax: totals.tax, total: totals.total,
        paidAmount: settlement.paid, outstandingAmount: settlement.outstanding,
        status: settlement.status === 'completed' ? 'completed' : settlement.status === 'credit' ? 'credit' : 'partial',
        cashierId: spec.ago % 2 === 0 ? cashier.id : owner.id,
        createdAt: stamp,
      },
    });

    for (const l of lines) {
      await prisma.saleItem.create({
        data: {
          saleId: sale.id, productId: productIds[l.idx], quantity: l.qty, unit: 'piece',
          unitPrice: l.unitPrice, total: l.qty * l.unitPrice, unitCost: l.cost,
        },
      });
      await prisma.inventoryTransaction.create({
        data: {
          tenantId: tenant.id, branchId: branch.id, productId: productIds[l.idx],
          type: 'SALE', quantity: -l.qty, referenceType: 'SALE', referenceId: sale.id,
          unitCost: l.cost, createdBy: sale.cashierId, createdAt: stamp,
        },
      });
      stock.set(l.idx, (stock.get(l.idx) ?? 0) - l.qty);
    }

    if (settlement.paid > 0) {
      await prisma.payment.create({
        data: { tenantId: tenant.id, saleId: sale.id, method: spec.method, amount: settlement.paid, createdAt: stamp },
      });
    }
    if (settlement.outstanding > 0) {
      balance += settlement.outstanding;
      await prisma.customerLedger.create({
        data: {
          tenantId: tenant.id, customerId: customerIds[spec.c], type: 'SALE',
          referenceId: sale.id, debit: totals.total, credit: settlement.paid,
          balance, notes: `Sale ${invoiceNumber}`, date: stamp,
        },
      });
    }
    seq++;
  }

  // Final stock cache now matches the transaction ledger.
  for (let i = 0; i < products.length; i++) {
    await prisma.inventory.upsert({
      where: { branchId_productId: { branchId: branch.id, productId: productIds[i] } },
      update: { quantity: stock.get(i) ?? 0 },
      create: { tenantId: tenant.id, branchId: branch.id, productId: productIds[i], quantity: stock.get(i) ?? 0 },
    });
  }
  await prisma.storeSetting.upsert({
    where: { tenantId: tenant.id },
    update: { nextInvoiceNo: seq },
    create: { tenantId: tenant.id, invoicePrefix: 'INV', nextInvoiceNo: seq },
  });

  console.log('✅ Demo Store ready.');
  console.log('   Owner:  03009990001 / demostore123');
  console.log('   Cashier: 03009990002 / democashier123');
  console.log(`   ${products.length} products, ${customerIds.length} customers, ${sales.length} invoices.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
