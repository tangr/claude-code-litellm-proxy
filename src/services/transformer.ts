import {
  AnthropicMessagesRequest,
  AnthropicMessagesResponse,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage
} from '../types/api';

export class AnthropicTransformer {

  static anthropicToOpenAI(anthropicRequest: AnthropicMessagesRequest): ChatCompletionRequest {
    const messages: ChatMessage[] = [];

    // Add system message if present
    if (anthropicRequest.system) {
      const systemContent = typeof anthropicRequest.system === 'string'
        ? anthropicRequest.system
        : anthropicRequest.system.map(s => s.text).join('\n');

      messages.push({
        role: 'system',
        content: systemContent
      });
    }

    // Convert Anthropic messages to OpenAI format
    for (const msg of anthropicRequest.messages) {
      let content: string;

      if (typeof msg.content === 'string') {
        content = msg.content;
      } else if (Array.isArray(msg.content)) {
        // Handle content array (text blocks, etc.)
        content = msg.content
          .filter(block => block.type === 'text' && block.text)
          .map(block => block.text)
          .join('\n');
      } else {
        content = '';
      }

      messages.push({
        role: msg.role,
        content
      });
    }

    const openAIRequest: ChatCompletionRequest = {
      model: anthropicRequest.model,
      messages,
      max_tokens: anthropicRequest.max_tokens
    };

    // Add optional parameters
    if (anthropicRequest.temperature !== undefined) {
      openAIRequest.temperature = anthropicRequest.temperature;
    }
    if (anthropicRequest.top_p !== undefined) {
      openAIRequest.top_p = anthropicRequest.top_p;
    }
    if (anthropicRequest.stream !== undefined) {
      openAIRequest.stream = anthropicRequest.stream;
    }
    if (anthropicRequest.stop_sequences) {
      openAIRequest.stop = anthropicRequest.stop_sequences;
    }

    return openAIRequest;
  }

  static openAIToAnthropic(openAIResponse: ChatCompletionResponse): AnthropicMessagesResponse {
    if (!openAIResponse.choices || openAIResponse.choices.length === 0) {
      throw new Error('Invalid OpenAI response: no choices found');
    }

    const choice = openAIResponse.choices[0];

    if (!choice.message) {
      throw new Error('Invalid OpenAI response: no message in choice');
    }

    return {
      id: openAIResponse.id,
      type: 'message',
      role: 'assistant',
      content: [{
        type: 'text',
        text: choice.message.content || ''
      }],
      model: openAIResponse.model,
      stop_reason: choice.finish_reason === 'stop' ? 'end_turn' : choice.finish_reason,
      stop_sequence: null,
      usage: {
        input_tokens: openAIResponse.usage?.prompt_tokens || 0,
        output_tokens: openAIResponse.usage?.completion_tokens || 0
      }
    };
  }
}
