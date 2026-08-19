"use client";

export function DeleteRestaurantButton({
  restaurantName,
  action,
}: {
  restaurantName: string;
  action: () => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`「${restaurantName}」を削除しますか？この操作は取り消せません。`)) {
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
