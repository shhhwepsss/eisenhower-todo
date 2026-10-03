export type TaskDialogState = {
  /** Идентификатор задачи, чьё окно открыто, либо `null`. */
  openTaskId: string | null;
  open(id: string): void;
  close(): void;
};
