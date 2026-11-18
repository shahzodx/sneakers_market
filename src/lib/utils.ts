import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function money(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' UZS';
}
export const statuses: Record<string, string> = {
  NEW: 'Новый',
  CONFIRMED: 'Подтверждён',
  SHIPPED: 'В пути',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
};
