import type { GaborChoice } from '../types';
import { GABOR_CHOICES } from '../lib/gabor';
import { GABOR_FIRST_QUESTION_INSTRUCTION_MS } from '../lib/session';
import { GaborCanvas } from './GaborCanvas';
import { PhaseInstruction } from './PhaseInstruction';

type Feedback = 'correct' | 'incorrect' | null;

type GaborChallengeProps = {
  questionIndex: number;
  questionElapsedMs: number;
  choice: GaborChoice;
  contrast: number;
  canAnswer: boolean;
  feedback: Feedback;
  selectedChoice: number | null;
  onAnswer: (choiceIndex: number) => void;
};

export function GaborChallenge({
  questionIndex,
  questionElapsedMs,
  choice,
  contrast,
  canAnswer,
  feedback,
  selectedChoice,
  onAnswer,
}: GaborChallengeProps) {
  const showIntro = questionIndex === 0 && questionElapsedMs < GABOR_FIRST_QUESTION_INSTRUCTION_MS;
  const correctChoiceIndex = GABOR_CHOICES.findIndex(({ angleDeg }) => angleDeg === choice.angleDeg);

  if (showIntro) {
    return (
      <PhaseInstruction
        title="縞の向きを見て"
        hint="同じ向きの線を選ぼう"
        hintDelayMs={800}
        visible
        fading={questionElapsedMs >= GABOR_FIRST_QUESTION_INSTRUCTION_MS - 300}
        position="upper"
      />
    );
  }

  return (
    <section className="challenge-content" aria-label="Gabor challenge">
      <div className="question-heading">
        <div className="question-count">{String(questionIndex + 1).padStart(2, '0')} / 03</div>
        <div className="question-hint">同じ向きを選ぶ</div>
      </div>
      <div className="gabor-frame">
        <GaborCanvas angleDeg={choice.angleDeg} contrast={contrast} />
      </div>
      <div className={`answer-row${canAnswer ? '' : ' is-locked'}${feedback ? ' has-feedback' : ''}`}>
        {GABOR_CHOICES.map((answer, index) => {
          const isSelected = selectedChoice === index;
          const isCorrectAnswer = feedback === 'incorrect' && correctChoiceIndex === index;
          let feedbackClass = '';

          if (isSelected && feedback === 'correct') feedbackClass = ' is-answer-correct';
          if (isSelected && feedback === 'incorrect') feedbackClass = ' is-answer-incorrect';
          if (!isSelected && isCorrectAnswer) feedbackClass = ' is-answer-key';

          return (
            <button
              className={`answer-button${isSelected ? ' is-selected' : ''}${feedbackClass}`}
              type="button"
              key={answer.angleDeg}
              aria-label={`${index + 1}番、${answer.label}`}
              disabled={!canAnswer}
              onClick={() => onAnswer(index)}
            >
              <span className="answer-symbol" aria-hidden="true">{answer.symbol}</span>
              <span className="answer-shortcut" aria-hidden="true">{index + 1}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
