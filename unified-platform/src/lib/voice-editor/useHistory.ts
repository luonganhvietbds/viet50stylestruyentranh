// useHistory Hook for Undo/Redo functionality

import { useState, useCallback, useRef } from 'react';

interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export function useHistory<T>(initialState: T, maxHistory = 50) {
    const [state, setState] = useState<HistoryState<T>>({
        past: [],
        present: initialState,
        future: []
    });

    // Track if we should save to history
    const isUndoRedo = useRef(false);

    const set = useCallback((newState: T | ((prev: T) => T)) => {
        setState(current => {
            const resolvedState = typeof newState === 'function'
                ? (newState as (prev: T) => T)(current.present)
                : newState;

            // Skip empty or same state
            if (JSON.stringify(resolvedState) === JSON.stringify(current.present)) {
                return current;
            }

            // If this is from undo/redo, don't add to history
            if (isUndoRedo.current) {
                isUndoRedo.current = false;
                return {
                    ...current,
                    present: resolvedState
                };
            }

            return {
                past: [...current.past, current.present].slice(-maxHistory),
                present: resolvedState,
                future: []
            };
        });
    }, [maxHistory]);

    const undo = useCallback(() => {
        setState(current => {
            if (current.past.length === 0) return current;

            const newPast = [...current.past];
            const previous = newPast.pop()!;

            isUndoRedo.current = true;

            return {
                past: newPast,
                present: previous,
                future: [current.present, ...current.future]
            };
        });
    }, []);

    const redo = useCallback(() => {
        setState(current => {
            if (current.future.length === 0) return current;

            const newFuture = [...current.future];
            const next = newFuture.shift()!;

            isUndoRedo.current = true;

            return {
                past: [...current.past, current.present],
                present: next,
                future: newFuture
            };
        });
    }, []);

    const reset = useCallback((newState: T) => {
        setState({
            past: [],
            present: newState,
            future: []
        });
    }, []);

    return {
        state: state.present,
        set,
        undo,
        redo,
        reset,
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
        historyLength: state.past.length
    };
}
