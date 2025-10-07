interface BadgeMenuProps {
  text: string;
  variant?: "new" | "beta" | "pro";
}

export function BadgeMenu({ text, variant = "new" }: BadgeMenuProps) {
  const colors = {
    new: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    beta: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    pro: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400"
  };

  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${colors[variant]} uppercase tracking-wide`}>
      {text}
    </span>
  );
}
