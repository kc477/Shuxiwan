import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ChatFlow } from "./chat-flow";
import { PROFILE_QUESTIONS } from "@/lib/ai";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) notFound();
  const me = await getCurrentUser();
  if (!me) redirect(`/events/${params.id}`);

  return (
    <main className="flex min-h-[100dvh] flex-col px-5 pb-6 pt-8">
      <header className="mb-4">
        <div className="text-xs text-ink-500">{event.name}</div>
        <h1 className="mt-1 text-xl font-semibold text-ink-900">
          90 秒，把你正在做的事讲给系统听
        </h1>
        <p className="mt-1 text-xs text-ink-500">
          一次回答 1-2 句话，越具体越好。结束后你可以编辑总结。
        </p>
      </header>

      <ChatFlow eventId={event.id} firstQuestion={PROFILE_QUESTIONS[0].q} />
    </main>
  );
}
