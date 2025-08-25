import { Request, Response, Router } from 'express';
import { LiteLLMService } from '../services/litellm';
import { ChatCompletionRequest } from '../types/api';

const router: Router = Router();
const liteLLMService = new LiteLLMService();

router.post('/chat/completions', async (req: Request, res: Response) => {
  try {
    const request: ChatCompletionRequest = req.body;

    if (!request.model) {
      return res.status(400).json({
        error: {
          message: 'Model is required',
          type: 'invalid_request_error',
          code: 'missing_model'
        }
      });
    }

    if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Messages array is required and cannot be empty',
          type: 'invalid_request_error',
          code: 'missing_messages'
        }
      });
    }

    const authHeader = req.headers.authorization;
    let authToken: string | undefined;

    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        authToken = authHeader.substring(7);
      } else {
        authToken = authHeader;
      }
    }

    const response = await liteLLMService.chatCompletion(request, authToken);
    res.json(response);

  } catch (error) {
    console.error('Chat completion error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    res.status(500).json({
      error: {
        message: errorMessage,
        type: 'internal_server_error'
      }
    });
  }
});

router.get('/models', async (req: Request, res: Response) => {
  try {
    const { ConfigLoader } = require('../utils/config');
    const configLoader = ConfigLoader.getInstance();
    const config = configLoader.getConfig();

    const models = config.Providers.reduce((acc: any[], provider: any) => {
      const providerModels = provider.models.map((model: string) => ({
        id: model,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: provider.name
      }));
      return acc.concat(providerModels);
    }, []);

    res.json({
      object: 'list',
      data: models
    });

  } catch (error) {
    console.error('Models list error:', error);

    res.status(500).json({
      error: {
        message: 'Failed to retrieve models',
        type: 'internal_server_error'
      }
    });
  }
});

export default router;
