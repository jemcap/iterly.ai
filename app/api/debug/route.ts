export async function GET() {
  try {
    console.log('Environment check:');
    console.log('FIGMA_ACCESS_TOKEN exists:', !!process.env.FIGMA_ACCESS_TOKEN);
    console.log('FIGMA_ACCESS_TOKEN starts with figd_:', process.env.FIGMA_ACCESS_TOKEN?.startsWith('figd_'));
    
    return Response.json({
      success: true,
      message: 'Environment check passed',
      hasToken: !!process.env.FIGMA_ACCESS_TOKEN,
      tokenPrefix: process.env.FIGMA_ACCESS_TOKEN?.substring(0, 5) + '...'
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function POST(request: Request) {
  try {
    console.log('📝 Raw request body parsing...');
    const body = await request.text();
    console.log('📝 Raw body:', body);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
      console.log('✅ JSON parsed successfully:', parsedBody);
    } catch (jsonError) {
      console.error('❌ JSON parse error:', jsonError);
      return Response.json({
        success: false,
        error: 'JSON parse error',
        details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error',
        receivedBody: body
      }, { status: 400 });
    }

    const { figmaUrl } = parsedBody;
    
    if (!figmaUrl) {
      return Response.json({
        success: false,
        error: 'figmaUrl is required',
        received: parsedBody
      }, { status: 400 });
    }

    return Response.json({
      success: true,
      message: 'JSON parsing successful',
      figmaUrl,
      bodyLength: body.length
    });
    
  } catch (error) {
    console.error('❌ Request processing error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
