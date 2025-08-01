import { prisma } from "@/lib/prismaClient";
import { getFigmaClient, extractFileKeyFromUrl } from '@/lib/figmaApiClient';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(session as any).user?.id) {
      return Response.json(
        { error: "Unauthorized - Please sign in" }, 
        { status: 401 }
      );
    }

    const userId = (session as any).user.id;

    const body = await req.json();
    console.log('📝 Received request body:', body);
    
    // Handle both field name variations
    const figmaFileUrl = body.figmaFileUrl || body.figmaUrl;
    const fileName = body.fileName;
    
    if (!figmaFileUrl) {
      return Response.json(
        { 
          error: "Figma URL is required",
          expectedFields: "figmaFileUrl or figmaUrl",
          received: Object.keys(body)
        },
        { status: 400 }
      );
    }
    
    // Clean and validate Figma URL
    const cleanedUrl = figmaFileUrl.replace(/\\/g, '').trim();
    const figmaFileId = extractFileKeyFromUrl(cleanedUrl);
    
    if (!figmaFileId) {
      return Response.json(
        { error: "Invalid Figma URL. Please provide a valid Figma file URL." },
        { status: 400 }
      );
    }

    console.log(`🔍 Processing Figma file: ${figmaFileId}`);

    // Check if design file already exists
    let designFile = await prisma.designFile.findUnique({
      where: { figmaFileId: figmaFileId }
    });

    // Get current authenticated user
    const uploader = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!uploader) {
      return Response.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    // Get Figma client and fetch real data
    const figmaClient = getFigmaClient();
    const [fileInfo, commentsData] = await Promise.all([
      figmaClient.getFileInfo(figmaFileId),
      figmaClient.getComments(figmaFileId)
    ]);

    const figmaComments = commentsData.comments || [];

    // Create or update design file record
    if (!designFile) {
      designFile = await prisma.designFile.create({
        data: {
          figmaFileId: figmaFileId,
          name: fileName || fileInfo.name,
          figmaFileUrl: cleanedUrl,
          uploadedById: uploader.id
        }
      });
    }

    // Process each real Figma comment
    const processedComments = [];
    
    for (const comment of figmaComments) {
      // Skip resolved comments (they're done)
      if (comment.resolved_at) {
        console.log(`⏭️  Skipping resolved comment: ${comment.id}`);
        continue;
      }
      
      // Check if comment already exists for this specific user and design file
      // Use Figma comment ID for true uniqueness per user
      const existingFeedback = await prisma.feedback.findFirst({
        where: {
          figmaCommentId: comment.id,
          designFileId: designFile.id,
          userId: userId // Make comments user-specific
        }
      });

      if (!existingFeedback) {
        const feedback = await prisma.feedback.create({
          data: {
            content: comment.message,
            figmaCommentId: comment.id, // Store original Figma comment ID
            figmaNodeId: comment.client_meta?.node_id?.[0] || null,
            authorId: uploader.id, // In real app, map Figma user to your user
            userId: userId, // Link feedback to the authenticated user who imported it
            designFileId: designFile.id,
            isProcessed: false
          }
        });

        processedComments.push(feedback);
        console.log(`✅ Added comment: "${comment.message.substring(0, 50)}..."`);
      } else {
        console.log(`⏭️  Comment already exists: "${comment.message.substring(0, 30)}..."`);
      }
    }

    return Response.json({
      success: true,
      message: `Imported ${processedComments.length} new comments from Figma`,
      designFile,
      comments: processedComments,
      figmaAnalysis: {
        totalFigmaComments: figmaComments.length,
        resolvedComments: figmaComments.filter(c => c.resolved_at).length,
        newCommentsAdded: processedComments.length,
        lastModified: fileInfo.lastModified,
        fileName: fileInfo.name
      }
    });

  } catch (error) {
    console.error("Figma import error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to import Figma comments",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
