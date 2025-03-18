import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Handle request timeouts
const TIMEOUT_DURATION = 60000; // 60 seconds

export async function POST(req: Request) {
  try {
    const { text, summaryLength = "medium" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Set up length-specific parameters
    const lengthParams: {
      [key: string]: { instruction: string; maxTokens: number };
    } = {
      short: {
        instruction:
          "Create a very concise summary in 1-2 short paragraphs. Focus on only the most important points.",
        maxTokens: 250,
      },
      medium: {
        instruction:
          "Create a balanced summary in 2-3 paragraphs. Include the main points and key details.",
        maxTokens: 500,
      },
      long: {
        instruction:
          "Create a comprehensive summary in 3-4 paragraphs. Include all important points and supporting details.",
        maxTokens: 750,
      },
    };

    const { instruction, maxTokens } =
      lengthParams[summaryLength] || lengthParams.medium;

    // Split text into chunks if it's too long (OpenAI has token limits)
    // A token is roughly 4 characters, so 4000 tokens ≈ 16000 characters
    const maxChunkLength = 16000;
    const chunks = text.match(new RegExp(`.{1,${maxChunkLength}}`, "g")) || [
      text,
    ];

    let fullSummary = "";

    // Create a promise with timeout
    const summarizeWithTimeout = async () => {
      let processedChunks = 0;

      for (const chunk of chunks) {
        processedChunks++;

        // For multi-chunk texts, let the model know where we are in the process
        let chunkInstruction = instruction;
        if (chunks.length > 1) {
          if (processedChunks === 1) {
            chunkInstruction = `${instruction} This is part ${processedChunks} of ${chunks.length}.`;
          } else if (processedChunks === chunks.length) {
            chunkInstruction = `${instruction} This is the final part ${processedChunks} of ${chunks.length}. Provide a cohesive summary that connects with previous parts.`;
          } else {
            chunkInstruction = `${instruction} This is part ${processedChunks} of ${chunks.length}. Provide a continuation that connects with previous parts.`;
          }
        }

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that creates summaries of text. ${chunkInstruction}`,
            },
            {
              role: "user",
              content: `Please summarize the following text:\n\n${chunk}`,
            },
          ],
          temperature: 0.3,
          max_tokens: maxTokens,
        });

        const summary = completion.choices[0]?.message?.content || "";
        fullSummary +=
          summary +
          (chunks.length > 1 && processedChunks < chunks.length ? "\n\n" : "");
      }

      return fullSummary.trim();
    };

    // Create a timeout promise
    const timeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Request timed out"));
      }, TIMEOUT_DURATION);
    });

    // Race the summarization against the timeout
    const summary = (await Promise.race([
      summarizeWithTimeout(),
      timeout,
    ])) as string;

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Error generating summary:", error);

    // Provide specific error messages based on error type
    if (error.message === "Request timed out") {
      return NextResponse.json(
        {
          error:
            "The summary generation took too long. Please try with a shorter text or try again later.",
        },
        { status: 408 }
      );
    } else if (error.code === "context_length_exceeded") {
      return NextResponse.json(
        {
          error:
            "The text is too long. Please reduce the length and try again.",
        },
        { status: 413 }
      );
    } else if (error.code === "rate_limit_exceeded") {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
