import { YooEditor, YooptaPathIndex } from '@yoopta/editor';
import { ParagraphElement } from '../types';
type ParagraphElementOptions = {
    text?: string;
};
type ParagraphInsertOptions = ParagraphElementOptions & {
    at?: YooptaPathIndex;
    focus?: boolean;
};
export type ParagraphCommands = {
    buildParagraphElements: (editor: YooEditor, options?: Partial<ParagraphElementOptions>) => ParagraphElement;
    insertParagraph: (editor: YooEditor, options?: Partial<ParagraphInsertOptions>) => void;
    deleteParagraph: (editor: YooEditor, blockId: string) => void;
};
export declare const ParagraphCommands: ParagraphCommands;
export {};
//# sourceMappingURL=ParagraphCommands.d.ts.map