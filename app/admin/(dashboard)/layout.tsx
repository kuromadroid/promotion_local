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
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="font-bold">
            Sapporo Bites 管理画面
          </Link>
          <nav className="flex items-center gap-5">
            <Link href="/admin/analytics" className="text-sm text-white/80 hover:text-white">
              アクセス状況
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="text-sm text-white/70 hover:text-white">
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
