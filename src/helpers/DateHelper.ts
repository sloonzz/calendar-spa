import moment, { Moment } from "moment";

export const DaysOfTheWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

/**
 * This is so we standardize how we handle dates by first instantiating them using `moment()`
 */
export type Datelike = string | Moment | Date;

/**
 * Different date formats supported by moment
 * HEADER  -- For header display
 * API     -- To date format returned and supported by the API
 * DISPLAY -- For individual date display
 */
export enum DateFormat {
  HEADER = "MMMM YYYY",
  API = "YYYY-MM-DD",
  DISPLAY = "D ddd"
}

export function validateFutureDate(date: Datelike, basis = moment()) {
  return moment(date).isSameOrAfter(basis, "day");
}

export function getDaysBetweenDates(
  startDate: Datelike,
  endDate: Datelike
): ReadonlyArray<Moment> {
  const now = moment(startDate).clone();
  const dates: Moment[] = [];
  while (now.isSameOrBefore(moment(endDate))) {
    dates.push(now.clone());
    now.add(1, "days");
  }
  return dates;
}
