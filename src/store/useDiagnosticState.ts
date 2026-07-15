import { useMemo, useState } from 'react';
import { defaultAnswers } from '../data/industryProfiles';
import type { QuestionnaireAnswer } from '../types/diagnostic';

export type DiagnosticView = 'landing' | 'questionnaire' | 'insight' | 'report';

export interface DiagnosticState {
  view: DiagnosticView;
  answers: QuestionnaireAnswer;
  isDataUploaded: boolean;
  setView: (view: DiagnosticView) => void;
  updateAnswers: (patch: Partial<QuestionnaireAnswer>) => void;
  setDataUploaded: (uploaded: boolean) => void;
  resetAnswers: () => void;
}

export function useDiagnosticState(): DiagnosticState {
  const [view, setView] = useState<DiagnosticView>('landing');
  const [answers, setAnswers] = useState<QuestionnaireAnswer>(defaultAnswers);
  const [isDataUploaded, setDataUploaded] = useState(false);

  const updateAnswers = (patch: Partial<QuestionnaireAnswer>) => {
    setAnswers((current) => ({
      ...current,
      ...patch,
    }));
  };

  const resetAnswers = () => {
    setAnswers(defaultAnswers);
    setDataUploaded(false);
  };

  return useMemo(
    () => ({
      view,
      answers,
      isDataUploaded,
      setView,
      updateAnswers,
      setDataUploaded,
      resetAnswers,
    }),
    [view, answers, isDataUploaded],
  );
}
