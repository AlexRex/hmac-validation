import { startServer } from './server';
import { router } from './routes';

const PORT = 8000;

startServer(router, PORT);
