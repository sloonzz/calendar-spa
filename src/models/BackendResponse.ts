export interface BackendResponse {
  data: ReadonlyArray<any>;
  status: "success" | "error";
  code: number;
}
