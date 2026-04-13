import { YooEditor, YooptaPathIndex } from '@yoopta/editor';
import { Path, Span } from 'slate';
import { InsertTableOptions, TableElement } from '../types';
type Options = {
    path?: Location | Span;
    select?: boolean;
    insertMode?: 'before' | 'after';
};
type DeleteOptions = Omit<Options, 'insertMode' | 'select'>;
type MoveTableOptions = {
    from: Path;
    to: Path;
};
type InsertOptions = Partial<InsertTableOptions & {
    at: YooptaPathIndex;
}>;
export type TableCommands = {
    buildTableElements: (editor: YooEditor, options?: InsertOptions) => TableElement;
    insertTable: (editor: YooEditor, options?: InsertOptions) => void;
    deleteTable: (editor: YooEditor, blockId: string) => void;
    insertTableRow: (editor: YooEditor, blockId: string, options?: Options) => void;
    deleteTableRow: (editor: YooEditor, blockId: string, options?: DeleteOptions) => void;
    moveTableRow: (editor: YooEditor, blockId: string, options: MoveTableOptions) => void;
    moveTableColumn: (editor: YooEditor, blockId: string, options: MoveTableOptions) => void;
    insertTableColumn: (editor: YooEditor, blockId: string, options?: Options) => void;
    deleteTableColumn: (editor: YooEditor, blockId: string, options?: DeleteOptions) => void;
    updateColumnWidth: (editor: YooEditor, blockId: string, columnIndex: number, width: number) => void;
    toggleHeaderRow: (editor: YooEditor, blockId: string) => void;
    toggleHeaderColumn: (editor: YooEditor, blockId: string) => void;
};
export declare const TableCommands: TableCommands;
export {};
//# sourceMappingURL=index.d.ts.map