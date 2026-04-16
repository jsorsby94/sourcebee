import Image from "next/image";

interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className={`relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-brand-500/15 ${
          compact ? "h-7 w-7" : "h-8 w-8"
        }`}
      >
        <Image
          src="/home-icon-light-192.png"
          alt=""
          aria-hidden
          width={192}
          height={192}
          className="h-full w-full object-cover dark:hidden"
        />
        <Image
          src="/home-icon-dark-192.png"
          alt=""
          aria-hidden
          width={192}
          height={192}
          className="hidden h-full w-full object-cover dark:block"
        />
      </span>
      <span className={`font-display font-semibold tracking-tight ${compact ? "text-base" : "text-lg"}`}>Sourcebee</span>
    </span>
  );
}
