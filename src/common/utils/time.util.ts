/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { TZDate } from '@date-fns/tz';
import { Between } from 'typeorm';

const vnTimeZone = 'Asia/Ho_Chi_Minh';

const startDayVnTime = () => {
  const currentTime = new TZDate(new Date(), vnTimeZone);
  return new TZDate(currentTime.setHours(0, 0, 0, 0), vnTimeZone);
};

const endDayVnTime = () => {
  const currentTime = new TZDate(new Date(), vnTimeZone);
  return new TZDate(currentTime.setHours(23, 59, 59, 999), vnTimeZone);
};

export const vnLocalDateTime = (date: Date) =>
  `${new TZDate(date, 'Asia/Ho_Chi_Minh').toLocaleDateString()} ${new TZDate(date, 'Asia/Ho_Chi_Minh').toLocaleTimeString()}`;

export function withinVnDayTypeOrmQuery() {
  return Between(startDayVnTime(), endDayVnTime());
}
