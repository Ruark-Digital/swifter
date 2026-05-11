import { create } from "zustand";
import { persist, combine, PersistOptions } from "zustand/middleware";
import {
  createSelectorHooks,
  ZustandHookSelectors,
  createSelectorFunctions,
  ZustandFuncSelectors,
} from "auto-zustand-selectors-hook";
import { FileWithUploadState } from "@/pages/SolicitationManagementPage/components/Step4Form";

type InitialState = {
  filesWithState: FileWithUploadState[];
  sessionId: string | null;
};

type Actions = {
  setFiles: (files: FileWithUploadState[]) => void;
  addFiles: (files: FileWithUploadState[]) => void;
  removeFile: (index: number) => void;
  updateFileState: (index: number, updates: Partial<FileWithUploadState>) => void;
  clearFiles: () => void;
  setSessionId: (sessionId: string) => void;
  clearSession: () => void;
};

const initialState: InitialState = {
  filesWithState: [],
  sessionId: null,
};

const reducer = combine(initialState, (set, get) => ({
  setFiles: (files: FileWithUploadState[]) => set({ filesWithState: files }),
  
  addFiles: (files: FileWithUploadState[]) => {
    const currentFiles = get().filesWithState;
    set({ filesWithState: [...currentFiles, ...files] });
  },
  
  removeFile: (index: number) => {
    const currentFiles = get().filesWithState;
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    set({ filesWithState: updatedFiles });
  },
  
  updateFileState: (index: number, updates: Partial<FileWithUploadState>) => {
    const currentFiles = get().filesWithState;
    const updatedFiles = currentFiles.map((file, i) => 
      i === index ? { ...file, ...updates } : file
    );
    set({ filesWithState: updatedFiles });
  },
  
  clearFiles: () => set({ filesWithState: [] }),
  
  setSessionId: (sessionId: string) => set({ sessionId }),
  
  clearSession: () => set(initialState),
}));

const logger = (config: any) => (set: any, get: any, api: any) => {
  return config(
    (args: any) => {
      if (import.meta.env.DEV) {
        console.log("solicitation-files applying", args);
      }
      set(args);
    },
    get,
    api
  );
};

type Selectors = InitialState & Actions;

const persistConfig: PersistOptions<Selectors> = {
  name: "solicitation-files",
  // Only persist files and sessionId, clear on browser close
  partialize: (state) => ({
    filesWithState: state.filesWithState,
    sessionId: state.sessionId,
  }) as Selectors,
};

const baseReducer = create(logger(persist(reducer, persistConfig)));

export const {
  useFilesWithState,
  useSessionId,
  useSetFiles,
  useAddFiles,
  useRemoveFile,
  useUpdateFileState,
  useClearFiles,
  useSetSessionId,
  useClearSession,
} = createSelectorHooks(baseReducer) as typeof baseReducer &
  ZustandHookSelectors<Selectors>;

export const solicitationFileSlice = createSelectorFunctions(
  baseReducer
) as typeof baseReducer & ZustandFuncSelectors<Selectors>;

export const solicitationFileStoreFunctions = createSelectorFunctions(
  baseReducer
) as typeof baseReducer & ZustandFuncSelectors<Selectors>;