"use client";

export function DeleteHotelButton({
  hotelName,
  action,
}: {
  hotelName: string;
  action: () => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `「${hotelName}」を削除しますか？発行済みのQR/URLは無効になります。この操作は取り消せません。`
          )
        ) {
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
