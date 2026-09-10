import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useHasSession } from '@/hooks/useSession';
import {
  supportApi,
  type ContactSupportInput,
  type ReportAudioProblemInput,
  type RequestSoundscapeInput,
} from '@/lib/api/support';

export const SUPPORT_QUERY_KEYS = {
  myRequests: ['support', 'my-requests'] as const,
};

/** Signed in only — `/api/support/my-requests` is the one authed support route. */
export function useMySupportRequests() {
  const hasSession = useHasSession();

  return useQuery({
    queryKey: SUPPORT_QUERY_KEYS.myRequests,
    queryFn: supportApi.myRequests,
    enabled: hasSession,
  });
}

/**
 * The three submit routes accept a guest with a `contact_email`, so none of
 * these are gated on a session. Each invalidates the request list so a
 * submission shows up if the user opens it afterwards.
 */
function useSupportSubmission<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUPPORT_QUERY_KEYS.myRequests });
    },
  });
}

export function useContactSupport() {
  return useSupportSubmission<ContactSupportInput>((input) => supportApi.contact(input));
}

export function useReportAudioProblem() {
  return useSupportSubmission<ReportAudioProblemInput>((input) =>
    supportApi.reportAudioProblem(input)
  );
}

export function useRequestSoundscape() {
  return useSupportSubmission<RequestSoundscapeInput>((input) =>
    supportApi.requestSoundscape(input)
  );
}
