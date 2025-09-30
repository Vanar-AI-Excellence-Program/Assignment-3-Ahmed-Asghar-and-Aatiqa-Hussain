import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { aiService } from "$lib/server/ai";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    const auth = locals.auth as any;
    if (!auth?.user?.id) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const message = formData.get("message") as string;
    const file = formData.get("file") as File;
    const conversationHistory = JSON.parse(
      (formData.get("conversationHistory") as string) || "[]"
    );
    const model = (formData.get("model") as string) || "gemini-2.5-pro";
    const conversationId = formData.get("conversationId") as string;

    if (!message || typeof message !== "string") {
      return json({ error: "Message is required" }, { status: 400 });
    }

    if (!file) {
      return json({ error: "File is required" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const allowedExtensions = [".txt", ".pdf", ".doc", ".docx"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      return json(
        {
          error:
            "Invalid file type. Please upload .txt, .pdf, .doc, or .docx files.",
        },
        { status: 400 }
      );
    }

    // Extract user name for personalization
    let userName = "User";
    if (auth.user.name && auth.user.name !== "The Shield") {
      userName = auth.user.name;
    } else if (auth.user.email) {
      const emailPrefix = auth.user.email.split("@")[0];
      if (emailPrefix === "shieldauthsec") {
        userName = "Shield";
      } else if (
        emailPrefix.includes(".") ||
        /\d/.test(emailPrefix) ||
        emailPrefix.length > 10
      ) {
        const cleanName = emailPrefix.replace(/[._-]/g, " ").replace(/\d/g, "");
        if (cleanName.length > 2) {
          userName =
            cleanName.split(" ")[0].charAt(0).toUpperCase() +
            cleanName.split(" ")[0].slice(1);
        } else {
          userName = "User";
        }
      } else {
        userName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      }
    }

    console.log("File upload request:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      message: message,
      userName: userName,
    });

    // Process file with Gemini
    const response = await aiService.processFileWithQuestion(
      file,
      message,
      conversationHistory,
      userName,
      auth.user.id,
      conversationId,
      model
    );

    // Provide simple citations for UI: show the uploaded document as source 1
    const citations = [
      {
        index: 1,
        content: `Document: ${file.name}`,
      },
    ];

    return json({
      response,
      citations,
      timestamp: new Date().toISOString(),
      fileName: file.name,
    });
  } catch (error) {
    console.error("File upload API error:", error);
    return json(
      {
        error: "Failed to process file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
