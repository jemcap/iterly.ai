import { prisma } from "@/lib/prismaClient";

const mockFigmaComments = [
  {
    id: "comment_1",
    content:
      "The header text is too small and hard to read on mobile. Please increase font size to at least 18px.",
    author: "Sarah Designer",
    nodeId: "header_text_node",
    timestamp: new Date().toISOString(),
  },
  {
    id: "comment_2",
    content:
      "Button colors don't match our brand guidelines. Should be #007AFF instead of current blue.",
    author: "Mike PM",
    nodeId: "cta_button_node",
    timestamp: new Date().toISOString(),
  },
  {
    id: "comment_3",
    content:
      "Loading spinner appears broken on Firefox. Animation stutters and looks unprofessional.",
    author: "QA Team",
    nodeId: "loading_spinner",
    timestamp: new Date().toISOString(),
  },
  {
    id: "comment_4",
    content:
      "Loading video is broken. Please fix the playback controls.",
    author: "QA Team",
    nodeId: "loading_video",
    timestamp: new Date().toISOString(),
  },
];
export async function POST(req: Request) {
  try {
    const { figmaFileId, figmaFileUrl, fileName } = await req.json();
    let designFile = await prisma.designFile.findUnique({
      where: { figmaFileId: figmaFileId },
    });
    if (designFile) {
      return Response.json({
        success: true,
        message: "Design file already exists.",
        figmaId: designFile,
      });
    }
    const uploader = await prisma.user.findUnique({
      where: { email: "designer@example.com" },
    });
    if (!uploader) {
      throw new Error("No user found.");
    }
    designFile = await prisma.designFile.create({
      data: {
        figmaFileId: figmaFileId,
        name: fileName,
        figmaFileUrl: figmaFileUrl,
        uploadedById: uploader.id,
      },
    });

    const processedComments = [];

    for (let comment of mockFigmaComments) {
      const existingFeedback = await prisma.feedback.findFirst({
        where: {
          content: comment.content,
          designFileId: designFile.id,
        },
      });
      if (!existingFeedback) {
        const author = await prisma.user.findUnique({
          where: { email: "designer@example.com" },
        });

        const feedback = await prisma.feedback.create({
          data: {
            content: comment.content,
            figmaNodeId: comment.nodeId,
            authorId: author!.id,
            designFileId: designFile.id,
            isProcessed: false,
          },
        });

        processedComments.push(feedback);
      }
    }

    return Response.json({
      success: true,
      message: `Imported ${processedComments.length} new comments from Figma`,
      designFile,
      comments: processedComments,
    });
  } catch (error) {
    console.error("Figma import error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to import Figma comments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
