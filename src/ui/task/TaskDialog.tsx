import {
  Close as DialogClose,
  Content as DialogContent,
  Overlay as DialogOverlay,
  Portal as DialogPortal,
  Root as DialogRoot,
  Title as DialogTitle,
} from '@radix-ui/react-dialog';
import type { Task } from '@/domain';
import { TaskDialogProperties } from './children/TaskDialogProperties';
import { TaskDialogText } from './children/TaskDialogText';
import styles from './TaskDialog.module.scss';

/**
 * Задача приезжает целиком, а не идентификатором: кто её нашёл — дело
 * вызывающей вкладки, а окну нужна текущая версия задачи на каждый рендер,
 * иначе правка признаков не обновила бы квадрант на глазах.
 *
 * `null` означает «закрыто». Отдельного флага `open` нет намеренно: два
 * источника истины разошлись бы — «открыто, но задачи нет» непредставимо,
 * и незачем давать этому состоянию возможность существовать.
 */
type TaskDialogProps = {
  task: Task | null;
  onClose: () => void;
};

/**
 * Правка, набранная в поле и ещё не уехавшая в стор, — NO_LOST_EDIT.
 *
 * Поля отдают введённое по потере фокуса, а закрытие окна убирает их из дерева,
 * и события `blur` у снятого узла React уже не зовёт: без этого шага Escape и
 * клик по заднику теряли последнюю правку молча. Фокус снимается, пока окно ещё
 * на месте, поэтому `onBlur` успевает сработать и дописать.
 *
 * Снимается фокус с чего угодно, а не только с полей задачи: пока окно открыто,
 * фокус из него не уходит (ловушка фокуса Radix), так что активным элементом
 * может быть только что-то внутри окна.
 */
const commitPendingEdit = (): void => {
  const focused: Element | null = document.activeElement;
  if (focused instanceof HTMLElement) focused.blur();
};

/**
 * Единственное место ручной правки задачи (issue #40, ONE_EDIT_SURFACE).
 * Одно окно на оба экрана: и «Матрица», и «Список» показывают этот компонент,
 * а не свою копию (MODAL_IS_SHARED).
 *
 * Раскладка — «Панель свойств» (выбрана человеком по прототипу): слева название
 * и описание, справа свойства на утопленной поверхности. На узком экране
 * колонки складываются, текст первым.
 *
 * Под капотом `@radix-ui/react-dialog`, а не нативный `<dialog>`: jsdom его
 * не реализует (`HTMLDialogElement-impl.js` — пустой класс), и инварианты
 * `FOCUS_RETURNS` и «фокус не уходит из окна» нечем было бы проверить, кроме
 * стаба, то есть нечем (спека §Зависимость). Radix приносит ловушку фокуса,
 * возврат фокуса на открывавший элемент, Escape, клик по заднику и блокировку
 * скролла страницы — свой оверлей и свой обработчик Escape мы не пишем.
 *
 * Кнопки «Сохранить» нет: поля уезжают в стор по потере фокуса, и закрытие —
 * не момент записи, а просто уход с экрана (NO_LOST_EDIT). Поэтому и отмены
 * правок нет — Escape закрывает окно, но не откатывает введённое.
 *
 * Имя окну даёт заголовок задачи, спрятанный для глаз: на экране то же слово
 * уже стоит в поле правки, и показывать его дважды значило бы показать
 * заголовок, который выглядит как подпись, но не правится. `aria-describedby`
 * снимается явно — описание задачи бывает пустым, и обещать его в контракте
 * доступности нельзя.
 */
export const TaskDialog = ({ task, onClose }: TaskDialogProps) => {
  const onOpenChange = (open: boolean): void => {
    if (open) return;

    commitPendingEdit();
    onClose();
  };

  return (
    <DialogRoot open={task !== null} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className={styles.scrim} />
        <DialogContent className={styles.dialog} aria-describedby={undefined}>
          {task === null ? null : (
            <>
              <DialogTitle className={styles.name}>{task.title}</DialogTitle>
              <TaskDialogText task={task} />
              <TaskDialogProperties task={task} />
              <DialogClose className={styles.close} type="button" aria-label="Закрыть">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </DialogClose>
            </>
          )}
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  );
};
