import { YooEditor, YooptaPathIndex } from '@yoopta/editor';
import { CodeElement, CodeElementProps } from '../types';
type CodeElementOptions = {
    text?: string;
    props?: CodeElementProps;
};
type InsertCodeOptions = CodeElementOptions & {
    at?: YooptaPathIndex;
    focus?: boolean;
};
export type CodeCommands = {
    buildCodeElements: (editor: YooEditor, options?: Partial<CodeElementOptions>) => CodeElement;
    insertCode: (editor: YooEditor, options?: Partial<InsertCodeOptions>) => void;
    deleteCode: (editor: YooEditor, blockId: string) => void;
    updateCodeTheme: (editor: YooEditor, blockId: string, theme: CodeElementProps['theme']) => void;
    updateCodeLanguage: (editor: YooEditor, blockId: string, language: CodeElementProps['language']) => void;
};
export declare const CodeCommands: CodeCommands;
export {};
//# sourceMappingURL=index.d.ts.map