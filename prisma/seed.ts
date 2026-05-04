import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Wipe demo data so re-seeds are idempotent.
  await prisma.match.deleteMany({});
  await prisma.matchIntent.deleteMany({});
  await prisma.zoneMember.deleteMany({});
  await prisma.zone.deleteMany({});
  await prisma.zoneSlot.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.eventParticipant.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});

  const organizer = await prisma.user.create({
    data: { name: "活动主办", wechatId: "demo_host" },
  });

  const now = new Date();
  const event = await prisma.event.create({
    data: {
      organizerId: organizer.id,
      name: "Shuxiwan Demo · 创业者深聊夜",
      startTime: new Date(now.getTime() - 30 * 60_000),
      endTime: new Date(now.getTime() + 3 * 60 * 60_000),
      locationName: "上海 · 静安寺 · WeWork",
      presetTopics: JSON.stringify(["出海", "AI Infra", "消费品牌", "早期投融资", "B 端获客"]),
      capacity: 80,
      status: "live",
    },
  });

  const slots = await Promise.all([
    prisma.zoneSlot.create({
      data: {
        eventId: event.id,
        name: "A 区 · 主会场",
        shape: JSON.stringify({ type: "rect", x: 0.08, y: 0.1, w: 0.4, h: 0.45 }),
        capacityHint: 30,
      },
    }),
    prisma.zoneSlot.create({
      data: {
        eventId: event.id,
        name: "B 区 · 茶歇台",
        shape: JSON.stringify({ type: "rect", x: 0.55, y: 0.12, w: 0.35, h: 0.3 }),
        capacityHint: 12,
      },
    }),
    prisma.zoneSlot.create({
      data: {
        eventId: event.id,
        name: "C 区 · 沙发",
        shape: JSON.stringify({ type: "rect", x: 0.18, y: 0.62, w: 0.3, h: 0.25 }),
        capacityHint: 8,
      },
    }),
    prisma.zoneSlot.create({
      data: {
        eventId: event.id,
        name: "D 区 · 户外露台",
        shape: JSON.stringify({ type: "rect", x: 0.55, y: 0.55, w: 0.35, h: 0.3 }),
        capacityHint: 15,
      },
    }),
  ]);

  const people = [
    {
      name: "苏离",
      wechatId: "su_li_2025",
      company: "回声 AI",
      role: "founder",
      stage: "preSeed",
      domains: ["AI", "企服"],
      currentFocus: "在做面向客服团队的语音 agent，下个月要交付头部金融客户的 PoC。",
      currentChallenge: "PoC 数据合规审批卡了 3 周，找不到对的人推。",
      lookingFor: "做过金融客户合规 onboarding 的产品/合规同学。",
      canOffer: "AI agent 工程化的细节、企业客户 PoC 节奏踩过的坑。",
      eventTopics: ["AI Infra", "B 端获客"],
    },
    {
      name: "周牧",
      wechatId: "muzhou_88",
      company: "—",
      role: "investor",
      stage: "other",
      domains: ["AI", "企服"],
      currentFocus: "今年主看 AI agent 落地企业的早期项目。",
      currentChallenge: "想看到真实付费 PoC，而不是 demo。",
      lookingFor: "已经有付费意向的 B 端 AI 项目。",
      canOffer: "Pre-A 投资 + 几家头部金融机构的 BD 引荐。",
      eventTopics: ["AI Infra", "早期投融资"],
    },
    {
      name: "Echo",
      wechatId: "echo_design",
      company: "Mori",
      role: "founder",
      stage: "seed",
      domains: ["消费", "出海"],
      currentFocus: "做 D2C 香薰品牌，准备2026 上半年进日本市场。",
      currentChallenge: "日本市场的合规和本地化没人教过。",
      lookingFor: "做过日本市场落地的人，特别是合规和履约。",
      canOffer: "国内消费品 0→1 的渠道经验、小红书冷启动手感。",
      eventTopics: ["出海", "消费品牌"],
    },
    {
      name: "李彻",
      wechatId: "li_che_jp",
      company: "Aozora 出海咨询",
      role: "partner",
      stage: "profitable",
      domains: ["出海", "消费"],
      currentFocus: "陪国内品牌进日本市场，今年帮 6 家做完合规落地。",
      currentChallenge: "找对接渠道更标准的方式。",
      lookingFor: "想出海日本但没找到靠谱合作方的早期品牌。",
      canOffer: "日本合规 / 履约 / 渠道引荐，第一手清单。",
      eventTopics: ["出海", "消费品牌"],
    },
    {
      name: "Tom",
      wechatId: "tom_zhou",
      company: "Pico Robotics",
      role: "founder",
      stage: "seed",
      domains: ["硬件", "AI"],
      currentFocus: "做工业末端执行机器人，刚拿了第一家车企试点。",
      currentChallenge: "找 ToB 销售一号位，太难了。",
      lookingFor: "做过工业自动化大客户销售的同学。",
      canOffer: "硬件供应链 + 工业客户洞察。",
      eventTopics: ["AI Infra", "B 端获客"],
    },
    {
      name: "韩青",
      wechatId: "han_qing_99",
      company: "树叶教育",
      role: "founder",
      stage: "seed",
      domains: ["教育", "AI"],
      currentFocus: "AI 一对一英语对话产品，海外用户增长爬坡期。",
      currentChallenge: "投放 ROAS 上不去，海外渠道完全摸不到门。",
      lookingFor: "做过海外 ToC 投放的增长同学。",
      canOffer: "AI 教育产品的留存玩法、口语场景细节。",
      eventTopics: ["出海", "AI Infra"],
    },
    {
      name: "梁向",
      wechatId: "liang_growth",
      company: "Drift Studio",
      role: "founder",
      stage: "preSeed",
      domains: ["内容", "AI"],
      currentFocus: "在做创作者的 AI 内容工作流工具。",
      currentChallenge: "如何让创作者从习惯里迁移过来。",
      lookingFor: "懂创作者真实工作流的人。",
      canOffer: "增长 + 海外社媒投放经验。",
      eventTopics: ["内容", "AI Infra"],
    },
  ];

  const users = await Promise.all(
    people.map(async (p) => {
      const u = await prisma.user.create({
        data: { name: p.name, wechatId: p.wechatId },
      });
      await prisma.eventParticipant.create({
        data: { userId: u.id, eventId: event.id, checkedIn: true },
      });
      await prisma.profile.create({
        data: {
          userId: u.id,
          eventId: event.id,
          company: p.company,
          role: p.role,
          stage: p.stage,
          domains: JSON.stringify(p.domains),
          currentFocus: p.currentFocus,
          currentChallenge: p.currentChallenge,
          lookingFor: p.lookingFor,
          canOffer: p.canOffer,
          eventTopics: JSON.stringify(p.eventTopics),
          completed: true,
        },
      });
      return u;
    })
  );

  // Two seed zones to make the grid feel populated.
  const z1 = await prisma.zone.create({
    data: {
      eventId: event.id,
      zoneSlotId: slots[1].id,
      creatorId: users[2].id,
      title: "出海日本：合规 & 履约怎么选合作方",
      question:
        "我们要 2026 上半年进日本市场，正在踩合规 / 物流坑。想找做过的人聊一下，避免重复造轮子。",
      tags: JSON.stringify(["出海", "消费品牌"]),
      status: "active",
      type: "user_generated",
      expiresAt: event.endTime,
      members: {
        create: [
          { userId: users[2].id, arrived: true },
          { userId: users[3].id, arrived: true },
          { userId: users[5].id },
        ],
      },
    },
  });

  await prisma.zone.create({
    data: {
      eventId: event.id,
      zoneSlotId: slots[0].id,
      creatorId: users[0].id,
      title: "AI agent 落地金融客户：节奏 & 合规",
      question: "PoC 阶段如何加速合规审批？想找有过相同经历的同学交换。",
      tags: JSON.stringify(["AI Infra", "B 端获客"]),
      status: "gathering",
      type: "user_generated",
      expiresAt: event.endTime,
      members: { create: [{ userId: users[0].id }] },
    },
  });

  void z1;

  console.log(
    `Seeded: event=${event.id}, ${users.length} users, ${slots.length} slots, 2 zones`
  );
  console.log("Open http://localhost:3000 then sign in as any of:");
  for (const u of users) console.log(`  - ${u.name}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
