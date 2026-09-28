/**
 * One-off, idempotent plan migration: renames Starter/Professional/Business/
 * Enterprise to Basic/Standard/Premium/Custom, applies the 5k/10k/15k/Custom
 * pricing, and rewrites features to the `modules` array the app reads.
 *
 *   node scripts/migrate-plans.cjs          (uses DATABASE_URL from .env)
 *
 * Safe to run repeatedly. Only touches the Plan table — subscriptions keep
 * their existing planId, so every store simply sees the new name/price.
 */
const { PrismaClient } = require('@prisma/client');

const PLANS = [
  { key: 'starter', name: 'Basic', priceMonthly: 5000, priceYearly: 60000,
    modules: ['pos', 'inventory', 'customers'] },
  { key: 'professional', name: 'Standard', priceMonthly: 10000, priceYearly: 120000,
    modules: ['pos', 'inventory', 'customers', 'khata'] },
  { key: 'business', name: 'Premium', priceMonthly: 15000, priceYearly: 180000,
    modules: ['pos', 'inventory', 'customers', 'khata', 'reports'] },
  { key: 'enterprise', name: 'Custom', priceMonthly: 0, priceYearly: 0,
    modules: ['pos', 'inventory', 'customers', 'khata', 'reports', 'marketing'] },
];

async function main() {
  const prisma = new PrismaClient();
  for (const p of PLANS) {
    const existing = await prisma.plan.findUnique({ where: { key: p.key } });
    if (!existing) {
      console.log(`- ${p.key}: missing, creating ${p.name}`);
      await prisma.plan.create({
        data: {
          key: p.key, name: p.name, priceMonthly: p.priceMonthly, priceYearly: p.priceYearly,
          features: JSON.stringify({ modules: p.modules }), active: true,
        },
      });
      continue;
    }

    // Preserve any non-module metadata already on the row.
    let extras = {};
    try {
      const parsed = JSON.parse(existing.features) || {};
      for (const [k, v] of Object.entries(parsed)) {
        if (k !== 'modules' && typeof v !== 'boolean') extras[k] = v;
        else if (k !== 'modules' && typeof v === 'boolean' && v) extras[k] = v;
      }
    } catch (_) { /* malformed — start clean */ }

    await prisma.plan.update({
      where: { key: p.key },
      data: {
        name: p.name,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        features: JSON.stringify({ ...extras, modules: p.modules }),
        active: true,
      },
    });
    console.log(`- ${p.key}: ${existing.name} → ${p.name}, Rs ${p.priceMonthly}/mo, ${p.modules.length} modules`);
  }

  const rest = await prisma.plan.findMany({ select: { key: true, name: true } });
  console.log('\nPlans now in DB:');
  for (const r of rest) console.log(`  ${r.key} → ${r.name}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
