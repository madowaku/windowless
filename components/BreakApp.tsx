import { useEffect, useReducer, useRef, useState } from 'react';
import { adjustContrastLevel, contrastForLevel } from '../lib/difficulty';
import { createActiveClock } from '../lib/activeClock';
import {
  calculateSessionResult,
  createSession,
  GABOR_EXPOSURE_MS,
  GABOR_FIRST_QUESTION_INSTRUCTION_MS,
  GAZE_DRIFT_MS,
  PSEUDO_WINDOW_MS,
  RESULT_MS,
  sessionReducer,
} from '../lib/session';
import { loadWindowlessStorage, saveSessionResult } from '../lib/storage';
import type { WindowlessStorage } from '../types';
import { GaborChallenge } from './GaborChallenge';
import { GazeDrift } from './GazeDrift';
import { ProgressBar } from './ProgressBar';
import { PseudoWindow } from './PseudoWindow';
import { ResultScreen } from './ResultScreen';

type BreakExperienceProps = {
  initialStorage: WindowlessStorage;
};

function BreakExperience({ initialStorage }: BreakExperienceProps) {
  const [session, dispatch] = useReducer(sessionReducer, performance.now(), createSession);
  const [contrastLevel, setContrastLevel] = useState(initialStorage.contrastLevel);
  const savedResultRef = useRef(false);
  const clockRef = useRef(createActiveClock());

  useEffect(() => {
    const updateActivity = () => {
      const active = document.visibilityState === 'visible' && document.hasFocus();
      const now = clockRef.current.setActive(active, performance.now());
      document.documentElement.classList.toggle('windowless-inactive', !active);
      if (active) dispatch({ type: 'tick', now });
    };
    updateActivity();
    const timer = window.setInterval(() => {
      if (clockRef.current.isActive()) {
        dispatch({ type: 'tick', now: clockRef.current.now(performance.now()) });
      }
    }, 100);
    window.addEventListener('blur', updateActivity);
    window.addEventListener('focus', updateActivity);
    document.addEventListener('visibilitychange', updateActivity);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('blur', updateActivity);
      window.removeEventListener('focus', updateActivity);
      document.removeEventListener('visibilitychange', updateActivity);
      document.documentElement.classList.remove('windowless-inactive');
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        window.close();
        return;
      }

      if (!/^[1-4]$/.test(event.key) || event.repeat || !clockRef.current.isActive()) return;
      event.preventDefault();
      dispatch({ type: 'answer', choiceIndex: Number(event.key) - 1, now: clockRef.current.now(performance.now()) });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (session.phase !== 'result' || savedResultRef.current) return;
    savedResultRef.current = true;
    void saveSessionResult(session.correctCount).then((updated) => {
      setContrastLevel(updated.contrastLevel);
    }).catch(() => {
      setContrastLevel(adjustContrastLevel(initialStorage.contrastLevel, session.correctCount));
    });
  }, [initialStorage.contrastLevel, session.phase, session.correctCount]);

  useEffect(() => {
    if (session.phase === 'result' && session.now - session.phaseStartedAt >= RESULT_MS) {
      window.close();
    }
  }, [session.phase, session.phaseStartedAt, session.now]);

  const elapsedMs = Math.max(0, session.now - session.phaseStartedAt);
  const phaseProgress = session.phase === 'pseudo-window'
    ? elapsedMs / PSEUDO_WINDOW_MS
    : session.phase === 'gaze-drift'
      ? elapsedMs / GAZE_DRIFT_MS
      : session.phase === 'result'
      ? elapsedMs / RESULT_MS
      : Math.min(1, Math.max(0, session.now - session.questionStartedAt) / 5000);
  const questionElapsedMs = Math.max(0, session.now - session.questionStartedAt);
  const canAnswer = session.phase === 'gabor'
    && session.feedbackUntil === null
    && questionElapsedMs >= GABOR_EXPOSURE_MS
      + (session.questionIndex === 0 ? GABOR_FIRST_QUESTION_INSTRUCTION_MS : 0);

  const closeWindow = () => window.close();

  return (
    <main className="break-shell">
      {(session.phase === 'pseudo-window' || session.phase === 'gaze-drift') && (
        <PseudoWindow
          messageVisible={session.phase === 'pseudo-window' && elapsedMs < 5000}
          messageFading={session.phase === 'pseudo-window' && elapsedMs >= 4000}
        />
      )}
      {session.phase === 'gaze-drift' && <GazeDrift elapsedMs={elapsedMs} />}
      {session.phase === 'gabor' && (
        <GaborChallenge
          questionIndex={session.questionIndex}
          questionElapsedMs={questionElapsedMs}
          choice={session.angles[session.questionIndex]}
          contrast={contrastForLevel(contrastLevel)}
          canAnswer={canAnswer}
          feedback={session.feedback}
          selectedChoice={session.selectedChoice}
          onAnswer={(choiceIndex) => {
            if (clockRef.current.isActive()) {
              dispatch({ type: 'answer', choiceIndex, now: clockRef.current.now(performance.now()) });
            }
          }}
        />
      )}
      {session.phase === 'result' && (
        <ResultScreen
          correctCount={calculateSessionResult(session.correctCount).correctCount}
          contrastLevel={contrastLevel}
          onClose={closeWindow}
        />
      )}

      <header className="scene-header">
        <span className="wordmark">WINDOWLESS</span>
        <span className="phase-label">
          {session.phase === 'pseudo-window' && 'PSEUDO WINDOW'}
          {session.phase === 'gaze-drift' && 'GAZE DRIFT'}
          {session.phase === 'gabor' && 'GABOR CHALLENGE'}
          {session.phase === 'result' && 'COMPLETE'}
        </span>
      </header>
      <footer className="scene-footer">
        <span className="quiet-meta">A SHORT VISUAL BREAK</span>
        {session.phase === 'gabor' && <span className="quiet-meta">CONTRAST LV. {contrastLevel}</span>}
      </footer>
      <ProgressBar phase={session.phase} phaseProgress={phaseProgress} questionIndex={session.questionIndex} />
    </main>
  );
}

export function BreakApp() {
  const [initialStorage, setInitialStorage] = useState<WindowlessStorage | null>(null);

  useEffect(() => {
    void loadWindowlessStorage().then(setInitialStorage);
  }, []);

  if (!initialStorage) {
    return <main className="break-shell"><div className="landscape" /><div className="loading-mark" /></main>;
  }

  return <BreakExperience initialStorage={initialStorage} />;
}
