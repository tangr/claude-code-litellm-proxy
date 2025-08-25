import cors from 'cors';
import express from 'express';
import chatRouter from './routes/chat';
import { ConfigLoader } from './utils/config';

const app: express.Application = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/v1', chatRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Claude Code LiteLLM Proxy',
    version: '1.0.0',
    endpoints: {
      chat: '/v1/chat/completions',
      models: '/v1/models',
      health: '/health'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not Found',
      type: 'not_found_error'
    }
  });
});

app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      type: 'internal_server_error'
    }
  });
});

const startServer = async () => {
  try {
    const configLoader = ConfigLoader.getInstance();
    const config = configLoader.loadConfig();

    console.log('Configuration loaded successfully');
    console.log(`Available providers: ${config.Providers.map(p => p.name).join(', ')}`);
    console.log(`Default router: ${config.Router.default}`);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Chat completions: http://localhost:${PORT}/v1/chat/completions`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export default app;
