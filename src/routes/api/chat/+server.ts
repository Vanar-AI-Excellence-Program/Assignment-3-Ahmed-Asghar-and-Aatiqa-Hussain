import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { aiService } from "$lib/server/ai";
import { auth } from "$lib/server/auth";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.auth?.user?.id) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      message,
      conversationHistory = [],
      model = "gemini-2.5-pro",
    } = await request.json();

    if (!message || typeof message !== "string") {
      return json({ error: "Message is required" }, { status: 400 });
    }

    // Validate conversation history format
    if (!Array.isArray(conversationHistory)) {
      return json(
        { error: "Invalid conversation history format" },
        { status: 400 }
      );
    }

    // Extract user name for personalization
    let userName = "User";

    if (locals.auth.user.name && locals.auth.user.name !== "The Shield") {
      userName = locals.auth.user.name;
    } else if (locals.auth.user.email) {
      // Try to extract a better name from email
      const emailPrefix = locals.auth.user.email.split("@")[0];
      // For now, let's use a more friendly approach - try to make it look like a name
      if (emailPrefix === "shieldauthsec") {
        userName = "Shield"; // Use "Shield" as a friendly name
      } else if (
        emailPrefix.includes(".") ||
        /\d/.test(emailPrefix) ||
        emailPrefix.length > 10
      ) {
        // Try to extract a reasonable name from complex usernames
        const cleanName = emailPrefix.replace(/[._-]/g, " ").replace(/\d/g, "");
        if (cleanName.length > 2) {
          userName =
            cleanName.split(" ")[0].charAt(0).toUpperCase() +
            cleanName.split(" ")[0].slice(1);
        } else {
          userName = "User";
        }
      } else {
        // Capitalize first letter if it looks like a name
        userName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      }
    }

    console.log("User data for AI:", {
      name: locals.auth.user.name,
      email: locals.auth.user.email,
      extractedName: userName,
    });

    // Generate AI response with context
    const response = await aiService.generateContextualResponse(
      message,
      conversationHistory,
      userName,
      model
    );

    return json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return json(
      {
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
