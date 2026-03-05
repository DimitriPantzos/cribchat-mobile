import { httpRouter } from "convex/server";
import { validate } from "./validateReceipt";

const http = httpRouter();

// Apple receipt validation endpoint
http.route({
  path: "/validateReceipt",
  method: "POST",
  handler: validate,
});

export default http;
