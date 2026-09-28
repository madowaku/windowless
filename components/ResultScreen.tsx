type ResultScreenProps = {
  correctCount: number;
  contrastLevel: number;
  onClose: () => void;
};

export function ResultScreen({ correctCount, contrastLevel, onClose }: ResultScreenProps) {
  return (
    <section className="result-content" aria-label="Session result">
      <div className="result-score">{correctCount} / 3</div>
      <div className="result-level">Contrast Lv. {contrastLevel}</div>
      <div className="result-note">Back to work.</div>
      <button className="return-button" type="button" onClick={onClose}>
        戻る
      </button>
    </section>
  );
}
