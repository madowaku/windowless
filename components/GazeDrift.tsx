import { PhaseInstruction } from './PhaseInstruction';

type GazeDriftProps = {
  elapsedMs: number;
};

export function GazeDrift({ elapsedMs }: GazeDriftProps) {
  const showBlinkPrompt = elapsedMs >= 6500 && elapsedMs < 8500;
  const showIntro = elapsedMs < 2300;
  const showCenterCue = elapsedMs >= 18_900;

  return (
    <>
      <div className="gaze-target" aria-hidden="true" />
      <PhaseInstruction
        title="小さな点を目で追ってみよう"
        hint="頭はそのまま、目だけでゆっくり"
        visible={showIntro}
        fading={elapsedMs >= 1800}
        position="upper"
      />
      {showBlinkPrompt && <div className="blink-note">ぱちぱち、まばたき</div>}
      <PhaseInstruction
        title="最後に、中央を見てみよう"
        visible={showCenterCue}
        fading={elapsedMs >= 19_600}
        position="upper"
      />
    </>
  );
}
