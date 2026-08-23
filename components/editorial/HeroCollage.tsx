"use client";

export type HeroCollageImage = {
  id: string;
  src: string;
  alt?: string;
};

type HeroCollageProps = {
  images: HeroCollageImage[];
};

/**
 * Sapporo Bites Hero collage
 *
 * - 画像3〜10枚を想定
 * - 配列の追加・削除・並び替えだけで表示変更
 * - DB / Storage / adminには依存しない
 * - 既存restaurant photos等のURL配列をpropsで渡すだけ
 */
export default function HeroCollage({ images }: HeroCollageProps) {
  const safeImages = images.filter((image) => Boolean(image?.src)).slice(0, 10);

  const slotsByCount: Record<number, number[]> = {
    1: [1],
    2: [1, 3],
    3: [1, 3, 5],
    4: [1, 2, 4, 6],
    5: [1, 2, 3, 4, 6],
    6: [1, 2, 3, 4, 5, 6],
    7: [1, 2, 3, 4, 5, 6, 8],
    8: [1, 2, 3, 4, 5, 6, 7, 9],
    9: [1, 2, 3, 4, 5, 6, 7, 8, 10],
    10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  };

  const slots = slotsByCount[safeImages.length] ?? slotsByCount[10];

  return (
    <div className="sbHeroCollage" aria-hidden="true">
      {safeImages.map((image, index) => (
        <div key={image.id} className={`sbHeroFrame sbHeroSlot${slots[index]}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt={image.alt ?? ""} />
        </div>
      ))}
    </div>
  );
}
