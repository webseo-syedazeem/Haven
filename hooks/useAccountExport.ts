import { useMutation } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

import { accountApi, type AccountExport } from '@/lib/api/account';

export type AccountExportResult = {
  data: AccountExport;
  /** Where the file landed, when one could be written. */
  uri?: string;
  /** How the export left the app, so the screen can word the confirmation. */
  delivered: 'shared' | 'saved' | 'copied';
};

function exportFileName(exportedAt: string): string {
  const stamp = exportedAt.slice(0, 10) || new Date().toISOString().slice(0, 10);
  return `passage-data-export-${stamp}.json`;
}

/**
 * R-08's "Export my data": pull `GET /api/account/export`, write the response
 * to a JSON file in the cache directory, and hand it to the system share sheet
 * so the user can save or send it wherever they like.
 *
 * Web has no file system to write to and no share sheet to open, so it falls
 * back to `Share` with the JSON inline. The screen reports whichever happened.
 */
export function useAccountExport() {
  return useMutation<AccountExportResult, Error, void>({
    mutationFn: async () => {
      const data = await accountApi.export();
      const json = JSON.stringify(data, null, 2);
      const name = exportFileName(data?.exported_at ?? '');

      if (Platform.OS === 'web') {
        await Share.share({ message: json, title: name });
        return { data, delivered: 'copied' };
      }

      const file = new File(Paths.cache, name);
      file.create({ overwrite: true, intermediates: true });
      file.write(json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          UTI: 'public.json',
          dialogTitle: 'Export your Passage data',
        });
        return { data, uri: file.uri, delivered: 'shared' };
      }

      return { data, uri: file.uri, delivered: 'saved' };
    },
  });
}
