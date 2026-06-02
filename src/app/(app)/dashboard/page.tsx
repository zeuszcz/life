import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateStats } from "@/server/services/progression";
import { progress } from "@/lib/game/progression";
import { DOMAINS, DOMAIN_META, type Domain } from "@/lib/game/constants";
import { CATALOG_BY_KEY } from "@/lib/game/catalog";
import { AppearanceSchema } from "@/lib/zod-schemas";
import AvatarPreview from "@/components/AvatarPreview";

const ACTIVITY_LABEL: Record<string, string> = {
  task_complete: "Задание выполнено",
  goal_complete: "Цель достигнута",
  daily_bonus: "Бонус за вход",
  level_up: "Новый уровень",
  achievement: "Достижение",
  purchase: "Покупка в игре",
  real_achievement: "Достижение в жизни",
  real_purchase: "Покупка в жизни",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const character = await prisma.character.findUnique({
    where: { userId },
    include: { inventory: { orderBy: { acquiredAt: "desc" } } },
  });
  if (!character) redirect("/onboarding");

  const [stats, defs, unlocked, activity, tasksCompleted, goalsActive, goalsDone] = await Promise.all([
    getOrCreateStats(character.id),
    prisma.achievementDef.findMany({ orderBy: { threshold: "asc" } }),
    prisma.userAchievement.findMany({ where: { userId } }),
    prisma.activityLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.activityLog.count({ where: { userId, type: "task_complete" } }),
    prisma.goal.count({ where: { userId, status: "active" } }),
    prisma.goal.count({ where: { userId, status: "done" } }),
  ]);

  const p = progress(character.xp);
  const appearance = AppearanceSchema.parse(character.appearance);
  const unlockedMap = new Map(unlocked.map((u) => [u.key, u.unlockedAt]));
  const pct = p.needed > 0 ? Math.round((p.current / p.needed) * 100) : 0;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="pixel text-2xl text-white">Профиль</h1>
        <Link href="/play" className="btn btn-primary">← В игру</Link>
      </div>

      {/* Hero */}
      <section className="card flex flex-col items-center gap-4 p-5 sm:flex-row">
        <div className="card flex items-center justify-center p-3" style={{ background: "#0e1626" }}>
          <AvatarPreview appearance={appearance} size={96} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="pixel text-xl text-white">{character.name}</span>
            <span className="chip">Lv {p.level}</span>
            <span className="chip" style={{ borderColor: "var(--gold)", color: "var(--gold)" }}>🪙 {character.gold}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="xp-track w-full max-w-sm"><div className="xp-fill" style={{ width: `${pct}%` }} /></div>
            <span className="text-xs text-[var(--muted)]">{p.current}/{p.needed} XP</span>
          </div>
          <div className="mt-2 text-sm text-[var(--muted)]">
            Выполнено заданий: <b className="text-white">{tasksCompleted}</b> · цели:{" "}
            <b className="text-white">{goalsActive}</b> активных, <b className="text-white">{goalsDone}</b> завершено
          </div>
        </div>
      </section>

      {/* Stats */}
      <h2 className="pixel mt-6 mb-3 text-lg text-white">Характеристики</h2>
      <section className="grid gap-3 sm:grid-cols-2">
        {DOMAINS.map((d: Domain) => {
          const s = stats.find((x) => x.domain === d);
          const sp = progress(s?.value ?? 0);
          const spct = sp.needed > 0 ? Math.round((sp.current / sp.needed) * 100) : 0;
          const dm = DOMAIN_META[d];
          return (
            <div key={d} className="card p-4" style={{ borderLeft: `4px solid ${dm.color}` }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{dm.icon} {dm.statName}</span>
                <span className="chip text-xs">Ур. {sp.level}</span>
              </div>
              <div className="mt-2 xp-track"><div className="xp-fill" style={{ width: `${spct}%`, background: dm.color }} /></div>
              <div className="mt-1 text-xs text-[var(--muted)]">{dm.label} · {sp.current}/{sp.needed} XP</div>
            </div>
          );
        })}
      </section>

      {/* Achievements */}
      <h2 className="pixel mt-6 mb-3 text-lg text-white">
        Достижения <span className="text-sm text-[var(--muted)]">{unlocked.length}/{defs.length}</span>
      </h2>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {defs.map((a) => {
          const got = unlockedMap.has(a.key);
          return (
            <div key={a.key} className="card flex items-center gap-3 p-3" style={{ opacity: got ? 1 : 0.5 }}>
              <div className="text-3xl" style={{ filter: got ? "none" : "grayscale(1)" }}>{a.icon}</div>
              <div>
                <div className="text-sm font-semibold text-white">{a.title}</div>
                <div className="text-[11px] text-[var(--muted)]">{a.description}</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Inventory */}
      <h2 className="pixel mt-6 mb-3 text-lg text-white">Инвентарь</h2>
      <section className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {character.inventory.length === 0 && (
          <p className="col-span-full text-sm text-[var(--muted)]">Пусто. Загляни в магазин 🛒</p>
        )}
        {character.inventory.map((item) => {
          const cat = CATALOG_BY_KEY[item.itemKey];
          const icon = cat?.icon ?? (item.kind === "trophy" ? "🏆" : "📦");
          return (
            <div key={item.id} className="card flex flex-col items-center gap-1 p-3 text-center">
              <div className="text-2xl">{icon}</div>
              <div className="text-[11px] text-white">{item.name}</div>
            </div>
          );
        })}
      </section>

      {/* Activity */}
      <h2 className="pixel mt-6 mb-3 text-lg text-white">Активность</h2>
      <section className="card divide-y divide-[var(--border)]">
        {activity.length === 0 && <p className="p-4 text-sm text-[var(--muted)]">Пока ничего не произошло.</p>}
        {activity.map((a) => {
          const payload = (a.payload ?? {}) as Record<string, unknown>;
          const title = typeof payload.title === "string" ? payload.title : "";
          return (
            <div key={a.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <span className="text-[var(--muted)]">{ACTIVITY_LABEL[a.type] ?? a.type}</span>
              <span className="flex-1 truncate text-white">{title}</span>
              <span className="text-[11px] text-[var(--muted)]">
                {new Date(a.createdAt).toLocaleDateString("ru-RU")}
              </span>
            </div>
          );
        })}
      </section>

      <div className="h-8" />
    </main>
  );
}
