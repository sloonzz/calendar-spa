import { BackendResponse } from "@/models/backendResponse";
import { CalendarEventApiPayload } from "@/models/calendarEvent";

const calendarApiUrl = `${process.env.VUE_APP_API_URL}calendar-events`;

export function apiCreateEvents(
  payload: CalendarEventApiPayload
): Promise<BackendResponse> {
  return fetch(calendarApiUrl, {
    method: "post",
    headers: {
      "Content-Type": "application/json"
    },
    mode: "cors",
    body: JSON.stringify(payload)
  }).then(res => res.json());
}

export function apiFetchEvents(): Promise<BackendResponse> {
  return fetch(calendarApiUrl).then(res => res.json());
}
