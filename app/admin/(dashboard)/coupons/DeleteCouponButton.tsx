"use client";

export function DeleteCouponButton({
  couponName,
  action,
}: {
  couponName: string;
  action: () => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`クーポン「${couponName}」を削除しますか？この操作は取り消せません。`)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-sm text-(--color-coral-deep) hover:underline">
        削除
      </button>
    </form>
  );
}
