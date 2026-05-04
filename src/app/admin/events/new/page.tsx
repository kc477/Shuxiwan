import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { CreateEventForm } from "./create-event-form";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const me = await getCurrentUser();

  return (
    <main className="px-5 pb-16 pt-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">创建一场活动</h1>
        <p className="mt-1 text-xs text-ink-500">
          先把骨架建起来，下一步去现场地图上画区域。
        </p>
      </header>

      {!me ? (
        <SignInFirst />
      ) : (
        <CreateEventForm />
      )}
    </main>
  );
}

function SignInFirst() {
  return (
    <form
      className="space-y-3"
      action={async (fd: FormData) => {
        "use server";
        const { quickSignIn } = await import("@/app/actions/auth");
        await quickSignIn(fd);
      }}
    >
      <p className="text-sm text-ink-600">先告诉系统你是谁（主办方账号）：</p>
      <input
        name="name"
        placeholder="你的名字"
        className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-ink-400"
        required
      />
      <button className="w-full rounded-full bg-ink-900 px-4 py-2.5 text-sm font-medium text-white">
        登录后继续
      </button>
    </form>
  );
}

export {};
