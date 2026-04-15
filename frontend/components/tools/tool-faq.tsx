import type { ToolFaqItem } from "@/lib/tool-registry";

interface ToolFaqProps {
  items: ToolFaqItem[];
}

export function ToolFaq({ items }: ToolFaqProps) {
  return (
    <section aria-labelledby="faq-heading" className="space-y-4">
      <h2 id="faq-heading" className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
        Frequently Asked Questions
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <details key={item.question} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-slate-100">{item.question}</summary>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
