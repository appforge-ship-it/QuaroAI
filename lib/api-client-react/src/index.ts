// lib/api-zod/src/index.ts

// Export ONLY API (main types)
export {
  AiChatBody,
  AiChatResponse,
  CreateFileBody,
  CreateProjectBody,
  RunCodeBody,
  UpdateFileBody,
  UpdateProjectBody
} from "./generated/api";

// Export schemas under namespace (no collision possible)
import * as schemas from "./generated/api.schemas";
export { schemas };

// Custom fetch
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";