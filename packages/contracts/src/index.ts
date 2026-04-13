export * from "./instasights";
export * from "./schema-docs";
export * from "./transcriber";

export type Healthcheck = {
  ok: true;
  model?: string;
  service?: "transcriber";
};
