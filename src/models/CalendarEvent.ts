import { Moment } from 'moment';

export interface CalendarEvent {
  id: number;
  name: string;
  date: string;
}

export interface CalendarEventApiPayload {
  payload: ReadonlyArray<{
    date: string;
    name: string;
  }>;
}
