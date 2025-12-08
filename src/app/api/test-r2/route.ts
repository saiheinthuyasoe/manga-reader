import { NextResponse } from "next/server";
import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET() {
  try {
    // List objects in bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME!,
      MaxKeys: 10,
    });

    const listResult = await s3Client.send(listCommand);

    // Try to get metadata of first object if exists
    let objectMetadata = null;
    if (listResult.Contents && listResult.Contents.length > 0) {
      const firstKey = listResult.Contents[0].Key;
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: firstKey!,
      });
      objectMetadata = await s3Client.send(headCommand);
    }

    return NextResponse.json({
      success: true,
      bucket: process.env.R2_BUCKET_NAME,
      publicUrl: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
      objectCount: listResult.KeyCount || 0,
      objects:
        listResult.Contents?.map((obj) => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
        })) || [],
      firstObjectMetadata: objectMetadata
        ? {
            contentType: objectMetadata.ContentType,
            contentLength: objectMetadata.ContentLength,
            etag: objectMetadata.ETag,
          }
        : null,
    });
  } catch (error) {
    console.error("R2 test error:", error);
    return NextResponse.json(
      {
        error: "Failed to test R2 connection",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
