import { selectLocaleAction } from "@/app/h/[hotelId]/actions";
import { Locale } from "@/lib/types";

const OPTIONS: { code: Locale; label: string; hint: string }[] = [
  { code: "ja", label: "日本語", hint: "Japanese" },
  { code: "en", label: "English", hint: "英語" },
  { code: "zh-CN", label: "简体中文", hint: "中国語(簡体字)" },
  { code: "zh-TW", label: "繁體中文", hint: "中国語(繁体字)" },
  { code: "ko", label: "한국어", hint: "韓国語" },
];

export function LanguageGate({
  hotelId,
  hotelName,
}: {
  hotelId: string;
  hotelName: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-(--color-navy) px-6 py-10 text-white">
      <div className="text-center text-xs font-bold tracking-[0.25em] text-white/40">
        SAPPORO BITES
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-white/60">
            {hotelName}
          </p>
          <h1 className="mt-3 text-xl font-bold leading-relaxed sm:text-2xl">
            言語を選択してください
            <br />
            <span className="text-base font-normal text-white/70 sm:text-lg">
              Please select your language
            </span>
          </h1>

          <div className="mt-10 grid grid-cols-2 gap-3">
            {OPTIONS.map((opt, i) => (
              <form
                key={opt.code}
                action={selectLocaleAction.bind(null, opt.code, hotelId)}
                className={i === OPTIONS.length - 1 && OPTIONS.length % 2 === 1 ? "col-span-2" : ""}
              >
                <button
                  type="submit"
                  className="flex w-full flex-col items-center gap-1 rounded-2xl border border-white/20 bg-white/5 px-4 py-6 transition-colors hover:border-(--color-coral) hover:bg-white/10"
                >
                  <span className="text-lg font-bold">{opt.label}</span>
                  <span className="text-xs text-white/50">{opt.hint}</span>
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
