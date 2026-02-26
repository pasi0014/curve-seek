/** Shared Tailwind className constants */

export const inputClasses =
  "w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-md text-slate-100 font-sans text-sm outline-none transition-colors duration-150 placeholder:text-slate-500 focus:border-blue-500";

export const labelClasses =
  "block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1";

export const btnBase =
  "inline-flex items-center justify-center gap-2 px-5 py-3 border-none rounded-md font-sans text-sm font-semibold cursor-pointer transition-[background,opacity] duration-150 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";

export const btnPrimary = `${btnBase} bg-blue-500 text-white hover:bg-blue-600`;

export const btnSecondary = `${btnBase} bg-slate-700 text-slate-100 hover:bg-slate-600`;

export const btnDanger = `${btnBase} bg-red-500/20 text-red-500 hover:bg-red-500/30`;

/** Quality badge color maps */
export const qualityBadgeColors: Record<string, string> = {
  good: "bg-green-500/20 text-green-500",
  fair: "bg-amber-500/20 text-amber-500",
  poor: "bg-orange-500/20 text-orange-500",
  bad: "bg-red-500/20 text-red-500",
};

/** Enthusiast badge color maps */
export const enthusiastBadgeColors: Record<string, string> = {
  thrilling: "bg-violet-500/20 text-violet-500",
  fun: "bg-blue-500/20 text-blue-500",
  moderate: "bg-gray-500/20 text-gray-500",
  boring: "bg-gray-300/15 text-gray-300",
};
