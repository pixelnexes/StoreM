import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding MarkazOS…');

  // ── Platform admin + settings ──────────────────────────────
  const adminPass = await bcrypt.hash('admin1234', 12);
  await prisma.platformAdmin.upsert({
    where: { email: 'superadmin@markazos.app' },
    update: {},
    create: { name: 'Platform Super Admin', email: 'superadmin@markazos.app', passwordHash: adminPass },
  });
  await prisma.platformSetting.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', themeKey: 'slate', brandName: 'MarkazOS' },
  });

  // ── Plans ──────────────────────────────────────────────────
  const plans = [
    { key: 'starter', name: 'Starter', priceMonthly: 1999, priceYearly: 19188,
      features: { inventory: true, pos: true, credit: true, reports: true, staff: 2, branches: 1, products: 500 } },
    { key: 'professional', name: 'Professional', priceMonthly: 4999, priceYearly: 47988,
      features: { inventory: true, pos: true, credit: true, reports: true, marketing: true, whatsapp: true, staff: 8, branches: 2, products: 5000 } },
    { key: 'business', name: 'Business', priceMonthly: 9999, priceYearly: 95988,
      features: { inventory: true, pos: true, credit: true, reports: true, marketing: true, whatsapp: true, reconciliation: true, staff: 25, branches: null, products: null } },
    { key: 'enterprise', name: 'Enterprise', priceMonthly: 0, priceYearly: 0,
      features: { inventory: true, pos: true, credit: true, reports: true, marketing: true, whatsapp: true, reconciliation: true, api: true, staff: null, branches: null, products: null } },
  ];
  for (const p of plans) {
    const data = { ...p, features: JSON.stringify(p.features) };
    await prisma.plan.upsert({ where: { key: p.key }, update: data, create: data });
  }
  const proPlan = await prisma.plan.findUniqueOrThrow({ where: { key: 'professional' } });

  // ── Demo tenant: Ubaer General Store ───────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: {},
    create: {
      id: 'demo-tenant',
      name: 'Ubaer General Store',
      businessName: 'Ubaer General Store',
      businessType: 'General Store',
      phone: '03001234567',
      currency: 'PKR',
      settings: { create: { invoicePrefix: 'INV', nextInvoiceNo: 1 } },
      subscription: {
        create: {
          planId: proPlan.id, status: 'ACTIVE', billingCycle: 'monthly',
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        },
      },
    },
  });

  const branch = await prisma.branch.upsert({
    where: { id: 'demo-branch' },
    update: {},
    create: { id: 'demo-branch', tenantId: tenant.id, name: 'Main Branch', phone: '03001234567' },
  });

  // ── Owner + cashier ────────────────────────────────────────
  const ownerPass = await bcrypt.hash('owner1234', 12);
  const owner = await prisma.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '03001234567' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Ubaer', phone: '03001234567', email: 'owner@ubaer.pk', passwordHash: ownerPass, role: 'OWNER' },
  });
  const cashierPass = await bcrypt.hash('cashier1234', 12);
  await prisma.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '03007654321' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Cashier', phone: '03007654321', passwordHash: cashierPass, role: 'CASHIER' },
  });

  // ── Products with opening stock (inventory transactions) ───
  const products = [
    { name: 'Lollipop',   sku: 'LOL-01', purchasePrice: 5,  sellingPrice: 10, open: 200 },
    { name: 'Biscuits',   sku: 'BIS-01', purchasePrice: 40, sellingPrice: 60, open: 120 },
    { name: 'Chips',      sku: 'CHP-01', purchasePrice: 30, sellingPrice: 50, open: 90 },
    { name: 'Cold Drink', sku: 'CDR-01', purchasePrice: 55, sellingPrice: 80, open: 60 },
    { name: 'Chocolate',  sku: 'CHO-01', purchasePrice: 70, sellingPrice: 100, open: 40 },
  ];
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { id: `demo-${p.sku}` },
      update: {},
      create: {
        id: `demo-${p.sku}`, tenantId: tenant.id, name: p.name, sku: p.sku,
        baseUnit: 'piece', purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice, minimumStock: 20,
      },
    });
    await prisma.inventoryTransaction.create({
      data: { tenantId: tenant.id, branchId: branch.id, productId: product.id, type: 'PURCHASE', quantity: p.open, unitCost: p.purchasePrice, createdBy: owner.id },
    });
    await prisma.inventory.upsert({
      where: { branchId_productId: { branchId: branch.id, productId: product.id } },
      update: { quantity: p.open },
      create: { tenantId: tenant.id, branchId: branch.id, productId: product.id, quantity: p.open },
    });
  }

  // ── Customers ──────────────────────────────────────────────
  const customers = [
    { name: 'Junaid Bhai', phone: '03110000001' },
    { name: 'Ahmed', phone: '03110000002' },
    { name: 'Ali', phone: '03110000003' },
    { name: 'Usman', phone: '03110000004' },
  ];
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: c.phone } },
      update: {},
      create: { tenantId: tenant.id, name: c.name, phone: c.phone, whatsappPhone: c.phone },
    });
  }

  // ── Payment terminal ───────────────────────────────────────
  await prisma.paymentTerminal.upsert({
    where: { id: 'demo-terminal' },
    update: {},
    create: { id: 'demo-terminal', tenantId: tenant.id, branchId: branch.id, name: 'Card Machine 1', provider: 'XYZ Bank' },
  });

  console.log('✅ Seed complete.');
  console.log('   Super admin: superadmin@markazos.app / admin1234');
  console.log('   Store owner: 03001234567 / owner1234');
  console.log('   Cashier:     03007654321 / cashier1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
