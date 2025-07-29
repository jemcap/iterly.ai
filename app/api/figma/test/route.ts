import { getFigmaClient, extractFileKeyFromUrl, isValidFigmaUrl } from '@/lib/figmaApiClient';

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('❌ JSON parsing error:', jsonError);
      return Response.json(
        { 
          error: 'Invalid JSON in request body',
          details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error',
          help: 'Make sure your JSON is properly formatted and escaped'
        },
        { status: 400 }
      );
    }

    const { figmaUrl } = body;
    
    // Validate input
    if (!figmaUrl) {
      return Response.json(
        { error: 'figmaUrl is required' },
        { status: 400 }
      );
    }

    // Clean the URL - remove backslashes that might be escaped
    const cleanedUrl = figmaUrl.replace(/\\/g, '').trim();
    console.log(`🔧 Original URL: ${figmaUrl}`);
    console.log(`🔧 Cleaned URL: ${cleanedUrl}`);
    
    if (!isValidFigmaUrl(cleanedUrl)) {
      return Response.json(
        { 
          error: 'Invalid Figma URL format',
          received: figmaUrl,
          cleaned: cleanedUrl,
          help: 'URL should be like: https://www.figma.com/file/ABC123/File-Name or https://www.figma.com/design/ABC123/File-Name'
        },
        { status: 400 }
      );
    }
    
    const fileKey = extractFileKeyFromUrl(cleanedUrl)!;
    
    console.log(`🔍 Testing Figma API with file key: ${fileKey}`);
    
    // Get Figma client instance
    const figmaClient = getFigmaClient();
    
    // Test API access by fetching file info and comments
    const [fileInfo, commentsData] = await Promise.all([
      figmaClient.getFileInfo(fileKey),
      figmaClient.getComments(fileKey)
    ]);
    
    const comments = commentsData.comments || [];
    
    // Analyze the data
    const analysis = {
      fileInfo: {
        name: fileInfo.name,
        role: fileInfo.role || 'unknown',
        lastModified: fileInfo.lastModified,
        thumbnailUrl: fileInfo.thumbnailUrl,
        version: fileInfo.version
      },
      commentsAnalysis: {
        totalComments: comments.length,
        unresolvedComments: comments.filter(c => !c.resolved_at).length,
        resolvedComments: comments.filter(c => c.resolved_at).length,
        commentsByUser: comments.reduce((acc, comment) => {
          const user = comment.user.handle;
          acc[user] = (acc[user] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        commentsWithNodes: comments.filter(c => c.client_meta?.node_id?.length).length,
        recentComments: comments
          .filter(c => !c.resolved_at)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(c => ({
            id: c.id,
            message: c.message.substring(0, 100) + (c.message.length > 100 ? '...' : ''),
            author: c.user.handle,
            createdAt: c.created_at,
            hasNodeId: !!c.client_meta?.node_id?.length
          }))
      }
    };
    
    return Response.json({
      success: true,
      message: `Successfully connected to Figma file: ${fileInfo.name}`,
      fileKey,
      analysis
    });
    
  } catch (error) {
    console.error('❌ Figma API test failed:', error);
    
    // Provide helpful error messages
    let errorMessage = 'Unknown error';
    let helpText = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (errorMessage.includes('403')) {
        helpText = 'Access denied. Check your Figma token has access to this file.';
      } else if (errorMessage.includes('404')) {
        helpText = 'File not found. Check the Figma URL is correct and file exists.';
      } else if (errorMessage.includes('401')) {
        helpText = 'Invalid Figma token. Generate a new token from Figma settings.';
      }
    }
    
    return Response.json(
      {
        success: false,
        error: errorMessage,
        help: helpText,
        troubleshooting: {
          checkToken: 'Verify FIGMA_ACCESS_TOKEN in .env.local',
          checkUrl: 'Ensure URL is a valid Figma file URL',
          checkAccess: 'Make sure you have access to view this Figma file'
        }
      },
      { status: 500 }
    );
  }
}
