"use client";

export function DeleteAdButton({
  adTitle,
  action,
}: {
  adTitle: string;
  action: () => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`広告「${adTitle}」を削除しますか？この操作は取り消せません。`)) {
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
