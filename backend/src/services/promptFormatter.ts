import { ModelConfig } from '../models/types.js';

export interface FormattedPrompt {
  prompt: string;
  stopTokens: string[];
}

export class PromptFormatter {
  /**
   * Format prompt according to model-specific requirements
   */
  static formatPrompt(
    modelConfig: ModelConfig, 
    systemPrompt: string, 
    userPrompt: string,
    skipNoThink: boolean = false
  ): FormattedPrompt {
    const modelName = modelConfig.name.toLowerCase();
    
    if (modelName.includes('gemma')) {
      return this.formatGemmaPrompt(systemPrompt, userPrompt);
    } else if (modelName.includes('qwen')) {
      return this.formatQwenPrompt(systemPrompt, userPrompt, skipNoThink);
    }
    
    // Default format for unknown models
    return {
      prompt: `System: ${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`,
      stopTokens: [],
    };
  }

  /**
   * Format prompt for Gemma models
   * Uses: <bos><start_of_turn>user\n{system_prompt}\n\n{prompt}<end_of_turn>\n<start_of_turn>model\n
   */
  private static formatGemmaPrompt(systemPrompt: string, userPrompt: string): FormattedPrompt {
    const formattedPrompt = `<bos><start_of_turn>user
${systemPrompt}

${userPrompt}<end_of_turn>
<start_of_turn>model
`;

    return {
      prompt: formattedPrompt,
      stopTokens: ['<end_of_turn>', '<start_of_turn>user'],
    };
  }

  /**
   * Format prompt for Qwen models (ChatML format)
   * Uses: <|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n
   */
  private static formatQwenPrompt(systemPrompt: string, userPrompt: string, skipNoThink: boolean = false): FormattedPrompt {
    // Append /no_think to the user prompt for Qwen models (unless skipped for verification)
    const modifiedUserPrompt = skipNoThink ? userPrompt : userPrompt + ' /no_think';
    
    const formattedPrompt = `<|im_start|>system
${systemPrompt}<|im_end|>
<|im_start|>user
${modifiedUserPrompt}<|im_end|>
<|im_start|>assistant
`;

    return {
      prompt: formattedPrompt,
      stopTokens: ['<|im_end|>', '<|im_start|>user', '<|im_start|>system'],
    };
  }

  /**
   * Extract response from model output (removes formatting tokens)
   */
  static extractResponse(_modelConfig: ModelConfig, rawOutput: string): string {
    // With proper stop tokens set, the model should stop generating before these tokens
    // This method now just trims whitespace
    return rawOutput.trim();
  }

  /**
   * Check if a token is a stop token for the given model
   */
  static isStopToken(modelConfig: ModelConfig, token: string): boolean {
    const modelName = modelConfig.name.toLowerCase();
    
    if (modelName.includes('gemma')) {
      return ['<end_of_turn>', '<start_of_turn>'].some(stop => token.includes(stop));
    } else if (modelName.includes('qwen')) {
      return ['<|im_end|>', '<|im_start|>'].some(stop => token.includes(stop));
    }
    
    return false;
  }
}