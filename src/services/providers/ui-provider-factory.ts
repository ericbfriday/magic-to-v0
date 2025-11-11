/**
 * UI Provider Factory
 *
 * Factory for creating and managing UI provider instances
 */

import { logger } from '../../utils/logger.js';
import { config } from '../../utils/config.js';
import { UiProvider } from './ui-provider.interface.js';
import { MagicUiProvider } from './magic-ui-provider.js';
import { V0UiProvider } from './v0-ui-provider.js';

/**
 * Create a UI provider instance based on configuration
 */
export function createUiProvider(): UiProvider {
  const providerType = config.uiProvider.type;

  logger.info('Creating UI provider', { type: providerType });

  switch (providerType) {
    case 'magic':
      if (!config.uiProvider.magic) {
        throw new Error('Magic UI provider selected but not configured (missing API key)');
      }

      return new MagicUiProvider({
        apiKey: config.uiProvider.magic.apiKey,
        baseUrl: config.uiProvider.magic.baseUrl,
        callbackServerPort: config.callbackServer.startPort,
        callbackTimeout: config.callbackServer.timeout,
      });

    case 'v0':
      if (!config.uiProvider.v0) {
        throw new Error('v0 provider selected but not configured (missing V0_API_KEY)');
      }

      return new V0UiProvider({
        apiKey: config.uiProvider.v0.apiKey,
      });

    default:
      throw new Error(`Unknown UI provider type: ${providerType}`);
  }
}

/**
 * Singleton UI provider instance
 */
let providerInstance: UiProvider | null = null;

/**
 * Get the singleton UI provider instance
 */
export function getUiProvider(): UiProvider {
  if (!providerInstance) {
    providerInstance = createUiProvider();
  }
  return providerInstance;
}

/**
 * Reset the provider instance (useful for testing or dynamic reconfiguration)
 */
export function resetUiProvider(): void {
  providerInstance = null;
  logger.info('UI provider instance reset');
}

/**
 * Get provider status information
 */
export async function getProviderStatus() {
  try {
    const provider = getUiProvider();
    const status = await provider.getStatus();

    return {
      provider: provider.name,
      ...status,
    };
  } catch (error) {
    logger.error('Failed to get provider status', error);
    return {
      provider: config.uiProvider.type,
      available: false,
      configured: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
