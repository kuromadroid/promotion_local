import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { logoutAction } from "@/app/admin/actions";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-(--color-snow)">
      <header className="bg-(--color-navy) text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/admin" className="shrink-0 font-bold">
            Sapporo Bites 管理画面
          </Link>
          <nav className="flex w-full items-center gap-4 overflow-x-auto sm:w-auto sm:gap-5">
            <Link href="/admin/hotels" className="shrink-0 whitespace-nowrap text-xs text-white/80 hover:text-white sm:text-sm">
              ホテル管理
            </Link>
            <Link href="/admin/hero-photos" className="shrink-0 whitespace-nowrap text-xs text-white/80 hover:text-white sm:text-sm">
              コラージュ写真
            </Link>
            <Link href="/admin/analytics" className="shrink-0 whitespace-nowrap text-xs text-white/80 hover:text-white sm:text-sm">
              アクセス状況
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="shrink-0 whitespace-nowrap text-xs text-white/70 hover:text-white sm:text-sm">
                ログアウト
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
