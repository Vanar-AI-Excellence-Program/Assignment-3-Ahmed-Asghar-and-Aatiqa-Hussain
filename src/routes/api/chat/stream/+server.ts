import type { RequestHandler } from "./$types";
import { aiService } from "$lib/server/ai";
import { auth } from "$lib/server/auth";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.auth?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const {
      message,
      conversationHistory = [],
      model = "models/gemini-1.5-flash",
    } = await request.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate conversation history format
    if (!Array.isArray(conversationHistory)) {
      return new Response(
        JSON.stringify({ error: "Invalid conversation history format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create a readable stream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
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
              const cleanName = emailPrefix
                .replace(/[._-]/g, " ")
                .replace(/\d/g, "");
              if (cleanName.length > 2) {
                userName =
                  cleanName.split(" ")[0].charAt(0).toUpperCase() +
                  cleanName.split(" ")[0].slice(1);
              } else {
                userName = "User";
              }
            } else {
              // Capitalize first letter if it looks like a name
              userName =
                emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
            }
          }

          console.log("User data for AI:", {
            name: locals.auth.user.name,
            email: locals.auth.user.email,
            extractedName: userName,
          });

          // Generate streaming AI response with context
          const responseStream = aiService.generateContextualStreamingResponse(
            message,
            conversationHistory,
            userName,
            model
          );

          for await (const chunk of responseStream) {
            const data =
              JSON.stringify({
                type: "chunk",
                content: chunk,
                timestamp: new Date().toISOString(),
              }) + "\n";

            controller.enqueue(new TextEncoder().encode(data));
          }

          // Send completion signal
          const completionData =
            JSON.stringify({
              type: "complete",
              timestamp: new Date().toISOString(),
            }) + "\n";

          controller.enqueue(new TextEncoder().encode(completionData));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorData =
            JSON.stringify({
              type: "error",
              error: "Failed to generate response",
              details: error instanceof Error ? error.message : "Unknown error",
            }) + "\n";

          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat stream API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
