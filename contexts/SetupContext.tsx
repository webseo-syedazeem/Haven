import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { type SetupDraft, type SetupPayload } from '@/lib/setup-api';

export type SetupActivity = {
  icon?: string;
  type?: string;
  title: string;
  duration?: string;
  description?: string;
};

export type SetupPlan = {
  plan_title?: string;
  plan_subtitle?: string;
  activities?: SetupActivity[];
  message?: string;
};

type SetupContextValue = {
  answers: SetupDraft;
  plan: SetupPlan | null;
  resetSetup: () => void;
  setPlan: (plan: SetupPlan | null) => void;
  updateAnswers: (partial: SetupDraft) => void;
};

const SetupContext = createContext<SetupContextValue | null>(null);

export function SetupProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<SetupDraft>({});
  const [plan, setPlan] = useState<SetupPlan | null>(null);

  const value = useMemo<SetupContextValue>(
    () => ({
      answers,
      plan,
      resetSetup: () => {
        setAnswers({});
        setPlan(null);
      },
      setPlan,
      updateAnswers: (partial) => setAnswers((current) => ({ ...current, ...partial })),
    }),
    [answers, plan]
  );

  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>;
}

export function useSetup() {
  const context = useContext(SetupContext);

  if (!context) {
    throw new Error('useSetup must be used within SetupProvider');
  }

  return context;
}

export function getPlanFromSetupResponse(response: any): SetupPlan | null {
  return response?.data?.plan ?? response?.data?.setup?.plan ?? null;
}

export function isCompleteSetupPayload(draft: SetupDraft): draft is SetupPayload {
  return Boolean(
    draft.mood &&
      draft.sleep_quality &&
      draft.day_feel &&
      draft.goal &&
      draft.time_preference &&
      draft.support_types?.length
  );
}
