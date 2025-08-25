import axios, { AxiosResponse } from 'axios';
import { ChatCompletionRequest, ChatCompletionResponse, ErrorResponse } from '../types/api';
import { Provider } from '../types/config';
import { ConfigLoader } from '../utils/config';
import { CostTracker } from './cost-tracker';

export class LiteLLMService {
  private configLoader: ConfigLoader;
  private costTracker: CostTracker;

  constructor() {
    this.configLoader = ConfigLoader.getInstance();
    this.costTracker = CostTracker.getInstance();
  }

  public async chatCompletion(request: ChatCompletionRequest, authToken?: string): Promise<{ response: ChatCompletionResponse; cost: number }> {
    try {
      const provider = this.getProviderForModel(request.model);
      if (!provider) {
        throw new Error(`No provider found for model: ${request.model}`);
      }

      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      }

      const response: AxiosResponse<ChatCompletionResponse> = await axios.post(
        provider.api_base_url,
        {
          ...request,
          model: this.mapModelName(request.model, provider)
        },
        {
          headers,
          timeout: 120000, // 2 minutes timeout
        }
      );

      // Extract cost information from LiteLLM headers
      const cost = parseFloat(response.headers['x-litellm-response-cost'] || '0');
      const duration = parseFloat(response.headers['x-litellm-response-duration-ms'] || '0');
      const usage = response.data.usage;

      if (usage && cost > 0) {
        this.costTracker.recordUsage(
          response.data.model,
          usage.prompt_tokens || 0,
          usage.completion_tokens || 0,
          cost,
          duration
        );
      }

      return { response: response.data, cost };
    } catch (error) {
      console.error('Error calling LiteLLM:', error);
      throw this.handleError(error);
    }
  }

  private getProviderForModel(modelName: string): Provider | undefined {
    const config = this.configLoader.getConfig();

    for (const provider of config.Providers) {
      if (provider.models.includes(modelName)) {
        return provider;
      }
    }

    return this.configLoader.getDefaultProvider();
  }

  private mapModelName(requestModel: string, provider: Provider): string {
    if (provider.name === 'litellm') {
      return requestModel;
    }
    return requestModel;
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const response = error.response;
      if (response) {
        const errorData = response.data as ErrorResponse;
        if (errorData.error) {
          return new Error(`LiteLLM Error: ${errorData.error.message}`);
        }
        return new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return new Error(`Network Error: ${error.message}`);
    }
    return error instanceof Error ? error : new Error('Unknown error occurred');
  }
}
