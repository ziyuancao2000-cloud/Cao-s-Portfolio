import type { ExecutionContext } from '@cloudflare/workers-types';
import handler from 'vinext/server/app-router-entry';

export default {
  fetch(request: Request, env: unknown, context: ExecutionContext) {
    return handler.fetch(request, env, context);
  },
};

