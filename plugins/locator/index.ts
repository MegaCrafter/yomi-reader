import { HelloService } from '@/services/HelloService';
import { PdfService } from '@/services/PdfService';
import { TauriNativeService } from '@/services/native/TauriNativeService.use';

import Store from './store';

const store = new Store();

export default defineNuxtPlugin(() => {
  return {
    provide: {
      HelloService: store.service('HelloService', () => new HelloService()),
      PdfService: store.service('PdfService', () => new PdfService()),
      NativeService: store.service('NativeService', () => new TauriNativeService()),
    },
  };
});