import { Request, Response, Router } from 'express';
import { CostTracker } from '../services/cost-tracker';
import { LiteLLMService } from '../services/litellm';
import { AnthropicTransformer } from '../services/transformer';
import { AnthropicMessagesRequest, ChatCompletionRequest } from '../types/api';

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

    const { response, headers: litellmHeaders } = await liteLLMService.chatCompletion(request, authToken);

    // Forward all LiteLLM headers to client
    Object.entries(litellmHeaders).forEach(([key, value]) => {
      if (key.startsWith('x-litellm-') || key.startsWith('x-anthropic-')) {
        res.setHeader(key, value as string);
      }
    });

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

// Anthropic Messages API endpoint
router.post('/messages', async (req: Request, res: Response) => {
  try {
    const anthropicRequest: AnthropicMessagesRequest = req.body;

    if (!anthropicRequest.model) {
      return res.status(400).json({
        error: {
          message: 'Model is required',
          type: 'invalid_request_error',
          code: 'missing_model'
        }
      });
    }

    if (!anthropicRequest.messages || !Array.isArray(anthropicRequest.messages) || anthropicRequest.messages.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Messages array is required and cannot be empty',
          type: 'invalid_request_error',
          code: 'missing_messages'
        }
      });
    }

    if (!anthropicRequest.max_tokens) {
      return res.status(400).json({
        error: {
          message: 'max_tokens is required',
          type: 'invalid_request_error',
          code: 'missing_max_tokens'
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

    // Transform Anthropic request to OpenAI format
    const openAIRequest = AnthropicTransformer.anthropicToOpenAI(anthropicRequest);

    if (anthropicRequest.stream) {
      // Handle streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // For now, convert to non-streaming and return as single event
      // TODO: Implement proper streaming support
      try {
        const nonStreamingRequest = { ...openAIRequest, stream: false };
        const { response: openAIResponse, cost, headers: litellmHeaders } = await liteLLMService.chatCompletion(nonStreamingRequest, authToken);

        const anthropicResponse = AnthropicTransformer.openAIToAnthropic(openAIResponse, cost);

        // Forward all LiteLLM headers to Claude Code client
        const forwardedHeaders: Record<string, any> = {};
        Object.entries(litellmHeaders).forEach(([key, value]) => {
          if (key.startsWith('x-litellm-') || key.startsWith('x-anthropic-')) {
            res.setHeader(key, value as string);
            forwardedHeaders[key] = value;
          }
        });

        // Debug: Log the forwarded headers and response
        console.log('Forwarded headers:', forwardedHeaders);
        console.log('Streaming response to Claude Code:', JSON.stringify(anthropicResponse, null, 2));

        // Send as server-sent event
        res.write(`event: message\n`);
        res.write(`data: ${JSON.stringify(anthropicResponse)}\n\n`);
        res.write(`event: done\n`);
        res.write(`data: {}\n\n`);
        res.end();
      } catch (error) {
        res.write(`event: error\n`);
        res.write(`data: {"error": {"message": "${error instanceof Error ? error.message : 'Unknown error'}", "type": "internal_server_error"}}\n\n`);
        res.end();
      }
    } else {
      // Handle non-streaming response
      const { response: openAIResponse, cost, headers: litellmHeaders } = await liteLLMService.chatCompletion(openAIRequest, authToken);

      const anthropicResponse = AnthropicTransformer.openAIToAnthropic(openAIResponse, cost);

      // Forward all LiteLLM headers to Claude Code client
      const forwardedHeaders: Record<string, any> = {};
      Object.entries(litellmHeaders).forEach(([key, value]) => {
        if (key.startsWith('x-litellm-') || key.startsWith('x-anthropic-')) {
          res.setHeader(key, value as string);
          forwardedHeaders[key] = value;
        }
      });

      // Debug: Log the forwarded headers and response
      console.log('Forwarded headers:', forwardedHeaders);
      console.log('Non-streaming response to Claude Code:', JSON.stringify(anthropicResponse, null, 2));

      res.json(anthropicResponse);
    }

  } catch (error) {
    console.error('Messages API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    res.status(500).json({
      error: {
        message: errorMessage,
        type: 'internal_server_error'
      }
    });
  }
});

// Cost tracking endpoint for Claude Code compatibility
router.get('/cost', async (req: Request, res: Response) => {
  try {
    const costTracker = CostTracker.getInstance();
    const costData = costTracker.getClaudeCodeFormat();

    res.json(costData);
  } catch (error) {
    console.error('Cost endpoint error:', error);

    res.status(500).json({
      error: {
        message: 'Failed to retrieve cost information',
        type: 'internal_server_error'
      }
    });
  }
});

export default router;
