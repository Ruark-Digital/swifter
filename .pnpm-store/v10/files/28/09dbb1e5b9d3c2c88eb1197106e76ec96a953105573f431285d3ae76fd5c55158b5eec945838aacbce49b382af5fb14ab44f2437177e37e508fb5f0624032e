import { CursorState } from '@slate-yjs/core';
import { RefObject } from 'react';
import { BaseRange, NodeMatch, Text } from 'slate';
import { CaretPosition, SelectionRect } from '../utils/getOverlayPosition';
export declare type UseRemoteCursorOverlayPositionsOptions<T extends HTMLElement> = {
    shouldGenerateOverlay?: NodeMatch<Text>;
} & ({
    containerRef?: undefined;
} | {
    containerRef: RefObject<T>;
    refreshOnResize?: boolean | 'debounced';
});
export declare type CursorOverlayData<TCursorData extends Record<string, unknown>> = CursorState<TCursorData> & {
    range: BaseRange | null;
    caretPosition: CaretPosition | null;
    selectionRects: SelectionRect[];
};
export declare function useRemoteCursorOverlayPositions<TCursorData extends Record<string, unknown>, TContainer extends HTMLElement = HTMLDivElement>({ containerRef, shouldGenerateOverlay, ...opts }?: UseRemoteCursorOverlayPositionsOptions<TContainer>): readonly [CursorOverlayData<TCursorData>[], () => void];
//# sourceMappingURL=useRemoteCursorOverlayPositions.d.ts.map