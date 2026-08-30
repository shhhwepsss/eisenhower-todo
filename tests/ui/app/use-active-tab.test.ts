import { act, renderHook } from '@testing-library/react';
import { useActiveTab } from '@/ui/app/hooks/use-active-tab';

describe('useActiveTab', () => {
  it('открывает «Список» по умолчанию', () => {
    const { result } = renderHook(() => useActiveTab());

    expect(result.current.activeTab).toBe('list');
  });

  it('переключает активную вкладку', () => {
    const { result } = renderHook(() => useActiveTab());

    act(() => {
      result.current.selectTab('matrix');
    });

    expect(result.current.activeTab).toBe('matrix');
  });

  it('отдаёт стабильную ссылку на selectTab между рендерами', () => {
    const { result, rerender } = renderHook(() => useActiveTab());
    const firstSelectTab = result.current.selectTab;

    rerender();

    expect(result.current.selectTab).toBe(firstSelectTab);
  });
});
