import { EditableText } from './EditableText';
import { EditableTitle } from './EditableTitle';
import type { TaskProps } from '../types';
import styles from './TaskDialogText.module.scss';

/**
 * Левая колонка окна задачи: название и описание (issue #40, направление
 * «Панель свойств»). Текст стоит первым и получает всю свободную ширину —
 * в окно приходят ради него, свойства рядом только чтобы не прокручивать.
 *
 * Поля те же, что в строке списка: правка уезжает в стор по потере фокуса,
 * и другого редактора у названия с описанием в проекте нет. Окно задаёт им
 * габарит своим классом, а не собирает собственные поля заново — иначе
 * появилась бы вторая реализация правки, расходящаяся с первой.
 */
export const TaskDialogText = ({ task }: TaskProps) => {
  return (
    <div className={styles.text}>
      <EditableTitle task={task} className={styles.titleField} />
      <EditableText task={task} className={styles.textField} />
    </div>
  );
};
