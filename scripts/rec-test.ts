import { recommendFor } from "../src/lib/match";
import { prisma } from "../src/lib/db";

async function main() {
  const ev = await prisma.event.findFirst();
  if (!ev) throw new Error("no event");
  const me = await prisma.user.findFirst({ where: { name: "Echo" } });
  if (!me) throw new Error("no user");
  console.log("Recommendations for Echo (D2C 香薰品牌, 出海日本):");
  const recs = await recommendFor(ev.id, me.id, 5);
  for (const r of recs) {
    const u = await prisma.user.findUnique({ where: { id: r.userId } });
    console.log(`  ${u?.name.padEnd(8)} score=${r.score.toFixed(3)}  ${r.reason}`);
  }
  await prisma.$disconnect();
}
main().catch(e=>{console.error(e); process.exit(1)});
