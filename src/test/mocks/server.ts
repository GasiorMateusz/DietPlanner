import { setupServer, type SetupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW server instance for Node.js environment (unit/integration tests)
 */
export const server: SetupServer = setupServer(...handlers);

