import { Button } from './ui/Button';

export function EmptyState({
  title,
  message,
  actionText,
  onAction,
}: {
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-6 text-center">
      <div className="text-base font-semibold mb-1">{title}</div>
      {message && <div className="text-sm text-gray-600 mb-3">{message}</div>}
      {actionText && onAction ? <Button onClick={onAction}>{actionText}</Button> : null}
    </div>
  );
}
