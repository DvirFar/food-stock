import { useState, useCallback } from 'react';

export function useConfirmDelete<T>(onConfirm: (item: T) => void | Promise<void>) {
  const [target, setTarget] = useState<T | null>(null);

  const requestConfirm = useCallback((item: T) => {
    setTarget(item);
  }, []);

  const confirm = useCallback(() => {
    if (target !== null) {
      onConfirm(target);
      setTarget(null);
    }
  }, [target, onConfirm]);

  const cancel = useCallback(() => {
    setTarget(null);
  }, []);

  return {
    target,
    requestConfirm,
    confirm,
    cancel,
    isOpen: target !== null,
  };
}
