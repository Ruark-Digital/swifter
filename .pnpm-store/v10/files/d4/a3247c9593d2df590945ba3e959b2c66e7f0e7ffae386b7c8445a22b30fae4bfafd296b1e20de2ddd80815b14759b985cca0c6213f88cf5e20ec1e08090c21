import { BaseRange, Path, Text } from 'slate';
import { ReactEditor } from 'slate-react';
export declare type SelectionRect = {
    width: number;
    height: number;
    top: number;
    left: number;
};
export declare type CaretPosition = {
    height: number;
    top: number;
    left: number;
};
export declare type OverlayPosition = {
    caretPosition: CaretPosition | null;
    selectionRects: SelectionRect[];
};
export declare type GetSelectionRectsOptions = {
    xOffset: number;
    yOffset: number;
    shouldGenerateOverlay?: (node: Text, path: Path) => boolean;
};
export declare function getOverlayPosition(editor: ReactEditor, range: BaseRange, { yOffset, xOffset, shouldGenerateOverlay }: GetSelectionRectsOptions): OverlayPosition;
//# sourceMappingURL=getOverlayPosition.d.ts.map