import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Key parameter required" },
        { status: 400 }
      );
    }

    // Get object from R2
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    const response = await s3Client.send(command);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const bodyStream = response.Body;

    if (bodyStream && typeof (bodyStream as NodeJS.ReadableStream)[Symbol.asyncIterator] === "function") {
      // Node.js ReadableStream
      for await (const chunk of bodyStream as NodeJS.ReadableStream) {
        chunks.push(chunk as Uint8Array);
      }
    } else if (bodyStream && typeof (bodyStream as ReadableStream).getReader === "function") {
      // Web ReadableStream
      const reader = (bodyStream as ReadableStream<Uint8Array>).getReader();
      let result = await reader.read();
      while (!result.done) {
        chunks.push(result.value);
        result = await reader.read();
      }
    } else {
      throw new Error("Unknown stream type received from S3");
    }

    const buffer = Buffer.concat(chunks);

    // Return image with proper headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.ContentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    );
  }
}
