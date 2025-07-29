import { FigmaComment, FigmaApiError, FigmaFileInfo } from "@/types/figmaType";

class FigmaApiClient {
  private accessToken: string;
  private baseUrl: string = "https://api.figma.com/v1";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetchFromFigma(endpoint: string): Promise<any> {
    const url = `${this.baseUrl}/${endpoint}`;
    
    console.log(`🔄 Figma API Request: ${url}`);

    const response = await fetch(url, {
      headers: {
        "X-Figma-Token": this.accessToken,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Figma API Error:', data);
      throw new Error(
        `Figma API Error ${response.status}: ${data.err || data.message || 'Unknown error'}`
      );
    }

    console.log(`✅ Figma API Success: ${endpoint}`);
    return data;
  }

  async getFileInfo(fileKey: string): Promise<FigmaFileInfo> {
    return this.fetchFromFigma(`files/${fileKey}`);
  }

  async getComments(fileKey: string): Promise<{ comments: FigmaComment[] }> {
    return this.fetchFromFigma(`files/${fileKey}/comments`);
  }

  async getFileNodes(fileKey: string, nodeIds: string[]): Promise<any> {
    const nodeParam = nodeIds.join(',');
    return this.fetchFromFigma(`files/${fileKey}/nodes?ids=${nodeParam}`);
  }
}

// Utility Functions
export function extractFileKeyFromUrl(figmaUrl: string): string | null {
  // Clean the URL first - remove backslashes and decode
  let cleanUrl = figmaUrl.replace(/\\/g, '').trim();
  
  console.log(`🔧 Cleaning URL: ${figmaUrl} → ${cleanUrl}`);
  
  // Handle various Figma URL formats:
  // https://www.figma.com/file/ABC123/File-Name
  // https://www.figma.com/design/ABC123/File-Name  
  // https://figma.com/file/ABC123/File-Name?node-id=123
  // https://www.figma.com/design/4aIR9Cex7pbzHehmK9kb3R/ARMONIA-A---WEB-DESIGN?node-id=0-1&p=f&t=0jyhQ0s0oDJj3fPY-0
  
  const patterns = [
    /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)(?:\/[^?]*)?(?:\?.*)?$/,
    /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)\//,
    /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)\?/,
    /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)$/
  ];
  
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      const fileKey = match[1];
      console.log(`📝 Extracted file key: ${fileKey} from URL: ${cleanUrl}`);
      return fileKey;
    }
  }
  
  console.error(`❌ Could not extract file key from URL: ${cleanUrl}`);
  return null;
}

export function isValidFigmaUrl(url: string): boolean {
  return url.includes('figma.com') && extractFileKeyFromUrl(url) !== null;
}

// Create client instance
export function createFigmaClient(): FigmaApiClient {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  
  if (!token) {
    throw new Error('FIGMA_ACCESS_TOKEN environment variable is required');
  }
  
  if (!token.startsWith('figd_')) {
    console.warn('⚠️  Figma token should start with "figd_" - make sure you copied the correct token');
  }
  
  return new FigmaApiClient(token);
}

// Lazy-loaded singleton instance
let _figmaClient: FigmaApiClient | null = null;

export function getFigmaClient(): FigmaApiClient {
  if (!_figmaClient) {
    _figmaClient = createFigmaClient();
  }
  return _figmaClient;
}
