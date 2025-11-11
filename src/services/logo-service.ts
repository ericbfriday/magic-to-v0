/**
 * Service layer for logo search operations
 */

import { logger } from '../utils/logger.js';
import { ExternalServiceError, ValidationError } from '../utils/errors.js';
import type { LogoSearchRequest, SVGLogo } from '../types/index.js';

interface LogoSearchResult {
  query: string;
  success: boolean;
  content?: string;
  message?: string;
}

interface LogoSearchResponse {
  icons: Array<{
    icon: string;
    code: string;
  }>;
  notFound: Array<{
    icon: string;
    alternatives: string[];
  }>;
  setup: string;
}

export class LogoService {
  private readonly SVGL_API_BASE = 'https://api.svgl.app';

  /**
   * Fetch logos from SVGL API
   */
  private async fetchLogos(query: string): Promise<SVGLogo[]> {
    const url = `${this.SVGL_API_BASE}?search=${encodeURIComponent(query)}`;

    logger.debug('Fetching logos from SVGL', { query, url });

    try {
      const response = await fetch(url);

      if (response.status === 404) {
        return []; // No results found
      }

      if (!response.ok) {
        throw new ExternalServiceError(
          `SVGL API error: ${response.statusText}`,
          'SVGL',
          { status: response.status, statusText: response.statusText }
        );
      }

      const data = await response.json();
      const logos = Array.isArray(data) ? data : [];

      logger.debug('Fetched logos from SVGL', { query, count: logos.length });

      return logos;
    } catch (error) {
      logger.error('Failed to fetch logos from SVGL', error, { query });

      if (error instanceof ExternalServiceError) {
        throw error;
      }

      throw new ExternalServiceError(
        `Failed to fetch logos: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SVGL',
        { query }
      );
    }
  }

  /**
   * Fetch SVG content from URL
   */
  private async fetchSVGContent(url: string): Promise<string> {
    logger.debug('Fetching SVG content', { url });

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new ExternalServiceError(
          `Failed to fetch SVG content: ${response.statusText}`,
          'SVGL',
          { status: response.status, url }
        );
      }

      const content = await response.text();
      logger.debug('Fetched SVG content', { url, contentLength: content.length });

      return content;
    } catch (error) {
      logger.error('Failed to fetch SVG content', error, { url });
      throw error;
    }
  }

  /**
   * Convert SVG to JSX/TSX format
   */
  private convertToFormat(
    svgContent: string,
    format: 'JSX' | 'TSX' | 'SVG',
    componentName: string
  ): string {
    if (format === 'SVG') {
      return svgContent;
    }

    // Convert to JSX/TSX
    const jsxContent = svgContent
      .replace(/class=/g, 'className=')
      .replace(/style="([^"]*)"/g, (match: string, styles: string) => {
        const cssObject = styles
          .split(';')
          .filter(Boolean)
          .map((style: string) => {
            const [property, value] = style
              .split(':')
              .map((s: string) => s.trim());
            const camelProperty = property.replace(/-([a-z])/g, (g: string) =>
              g[1].toUpperCase()
            );
            return `${camelProperty}: "${value}"`;
          })
          .join(', ');
        return `style={{${cssObject}}}`;
      });

    // Ensure component name ends with Icon
    const finalComponentName = componentName.endsWith('Icon')
      ? componentName
      : `${componentName}Icon`;

    return format === 'TSX'
      ? `const ${finalComponentName}: React.FC = () => (${jsxContent})`
      : `function ${finalComponentName}() { return (${jsxContent}) }`;
  }

  /**
   * Process a single logo query
   */
  private async processLogo(
    query: string,
    format: 'JSX' | 'TSX' | 'SVG'
  ): Promise<LogoSearchResult> {
    try {
      logger.debug('Processing logo query', { query, format });

      const logos = await this.fetchLogos(query);

      if (logos.length === 0) {
        logger.info('No logo found', { query });
        return {
          query,
          success: false,
          message: `No logo found for: "${query}"`,
        };
      }

      const logo = logos[0];
      logger.debug('Processing logo', { title: logo.title, query });

      const svgUrl =
        typeof logo.route === 'string' ? logo.route : logo.route.light;

      const svgContent = await this.fetchSVGContent(svgUrl);
      const formattedContent = this.convertToFormat(
        svgContent,
        format,
        logo.title + 'Icon'
      );

      logger.info('Successfully processed logo', { query, title: logo.title });

      return {
        query,
        success: true,
        content: `// ${logo.title} (${logo.url})\n${formattedContent}`,
      };
    } catch (error) {
      logger.error('Failed to process logo', error, { query });
      return {
        query,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search for logos
   */
  async searchLogos(request: LogoSearchRequest): Promise<LogoSearchResponse> {
    logger.info('Searching for logos', {
      queries: request.queries,
      format: request.format,
    });

    if (request.queries.length === 0) {
      throw new ValidationError('At least one query is required');
    }

    if (request.queries.length > 10) {
      throw new ValidationError('Maximum 10 queries allowed');
    }

    try {
      // Process all queries in parallel
      const results = await Promise.all(
        request.queries.map((query) => this.processLogo(query, request.format))
      );

      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      logger.info('Logo search completed', {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
      });

      // Format response
      const foundIcons = successful.map((r) => {
        const title =
          r.content?.split('\n')[0].replace('// ', '').split(' (')[0] || '';
        const componentName =
          title
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join('')
            .replace(/[^a-zA-Z0-9]/g, '') + 'Icon';

        return {
          icon: componentName,
          code: r.content?.split('\n').slice(1).join('\n') || '',
        };
      });

      const missingIcons = failed.map((f) => ({
        icon: f.query,
        alternatives: [
          'Search for SVG version on the official website',
          'Check other icon libraries (e.g., heroicons, lucide)',
          'Request SVG file from the user',
        ],
      }));

      const setup = [
        '1. Add these icons to your project:',
        foundIcons
          .map((c) => `   ${c.icon}.${request.format.toLowerCase()}`)
          .join('\n'),
        '2. Import and use like this:',
        '```tsx',
        'import { ' + foundIcons.map((c) => c.icon).join(', ') + " } from '@/icons';",
        '```',
      ].join('\n');

      return {
        icons: foundIcons,
        notFound: missingIcons,
        setup,
      };
    } catch (error) {
      logger.error('Logo search failed', error);
      throw error;
    }
  }
}

// Export singleton instance
export const logoService = new LogoService();
