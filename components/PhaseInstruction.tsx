type PhaseInstructionProps = {
  title: string;
  hint?: string;
  visible: boolean;
  fading?: boolean;
  hintDelayMs?: number;
  position?: 'center' | 'upper';
};

export function PhaseInstruction({
  title,
  hint,
  visible,
  fading = false,
  hintDelayMs = 0,
  position = 'center',
}: PhaseInstructionProps) {
  if (!visible) return null;

  return (
    <div
      className={`phase-instruction is-${position}${fading ? ' is-fading' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="phase-instruction-title">{title}</span>
      {hint && (
        <span className="phase-instruction-hint" style={{ animationDelay: `${hintDelayMs}ms` }}>
          {hint}
        </span>
      )}
    </div>
  );
}
