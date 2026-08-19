import { loginAction } from "@/app/admin/actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-(--color-snow) px-4">
      <form
        action={loginAction}
        className="w-full max-w-sm bg-white border border-(--color-line) rounded-2xl p-8 shadow-sm"
      >
        <h1 className="text-xl font-bold text-(--color-navy)">管理画面ログイン</h1>
        <p className="text-sm text-(--color-ink-soft) mt-1 mb-6">Sapporo Bites 管理者用</p>

        {error && (
          <p className="mb-4 text-sm text-(--color-coral-deep) bg-(--color-coral)/10 rounded-lg px-3 py-2">
            パスワードが違います
          </p>
        )}

        <label className="block text-sm font-medium text-(--color-ink)">
          パスワード
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="mt-1 w-full rounded-lg border border-(--color-line) px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-(--color-coral)"
          />
        </label>

        <button
          type="submit"
          className="mt-5 w-full rounded-lg bg-(--color-navy) text-white font-medium py-2.5 hover:bg-(--color-navy-deep) transition-colors"
        >
          ログイン
        </button>
      </form>
    </main>
  );
}
