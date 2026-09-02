/**
 * Motif « ligne d'eau » du lac, signature discrète de la charte.
 * Purement décoratif : masqué aux lecteurs d'écran.
 */
export function WaterLine({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 400 26"
      preserveAspectRatio="none"
      className={`block h-[26px] w-full ${className}`}
    >
      <path
        d="M0 14c26 0 26-7 52-7s26 7 52 7 26-7 52-7 26 7 52 7 26-7 52-7 26 7 52 7 26-7 52-7 26 7 52 7v12H0Z"
        fill="var(--color-eau)"
        opacity="0.55"
      />
      <path
        d="M0 20c26 0 26-6 52-6s26 6 52 6 26-6 52-6 26 6 52 6 26-6 52-6 26 6 52 6 26-6 52-6 26 6 52 6v6H0Z"
        fill="var(--color-sauge)"
        opacity="0.35"
      />
    </svg>
  );
}
