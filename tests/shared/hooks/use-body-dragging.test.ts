import { act, renderHook } from '@testing-library/react';
import type { RenderHookResult } from '@testing-library/react';

import { useBodyDragging } from '@/shared/hooks/use-body-dragging';
import type { BodyDragging } from '@/shared/hooks/use-body-dragging';

/**
 * DRAG_CURSOR_GLOBAL (docs/specs/35-design-system.md §5, §Инварианты):
 * `data-dragging` на `body` снимается при завершении, отмене и размонтировании.
 */
describe('useBodyDragging', () => {
  afterEach(() => {
    document.body.removeAttribute('data-dragging');
  });

  it('атрибута нет, пока перетаскивание не началось', () => {
    renderHook(() => useBodyDragging());

    expect(document.body).not.toHaveAttribute('data-dragging');
  });

  it('startDragging ставит атрибут', () => {
    const rendered: RenderHookResult<BodyDragging, void> = renderHook(() => useBodyDragging());

    act(() => {
      rendered.result.current.startDragging();
    });

    expect(document.body).toHaveAttribute('data-dragging', 'true');
  });

  it('stopDragging снимает атрибут — тот же путь для завершения и отмены (Escape)', () => {
    const rendered: RenderHookResult<BodyDragging, void> = renderHook(() => useBodyDragging());

    act(() => {
      rendered.result.current.startDragging();
    });
    act(() => {
      rendered.result.current.stopDragging();
    });

    expect(document.body).not.toHaveAttribute('data-dragging');
  });

  it('размонтирование посреди жеста снимает атрибут', () => {
    const rendered: RenderHookResult<BodyDragging, void> = renderHook(() => useBodyDragging());

    act(() => {
      rendered.result.current.startDragging();
    });
    expect(document.body).toHaveAttribute('data-dragging', 'true');

    rendered.unmount();

    expect(document.body).not.toHaveAttribute('data-dragging');
  });
});
