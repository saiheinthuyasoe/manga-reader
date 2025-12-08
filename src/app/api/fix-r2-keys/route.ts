import { NextResponse } from "next/server";
import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST() {
  try {
    const bucket = process.env.R2_BUCKET_NAME!;

    // List all objects
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
    });

    const listResult = await s3Client.send(listCommand);

    if (!listResult.Contents || listResult.Contents.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No objects to fix",
      });
    }

    const fixedKeys = [];
    const bucketPrefix = `${bucket}/`;

    for (const obj of listResult.Contents) {
      const oldKey = obj.Key!;

      // Only process keys that start with the bucket name
      if (oldKey.startsWith(bucketPrefix)) {
        const newKey = oldKey.substring(bucketPrefix.length);

        console.log(`Copying ${oldKey} to ${newKey}`);

        // Copy object to new key
        const copyCommand = new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${oldKey}`,
          Key: newKey,
        });

        await s3Client.send(copyCommand);

        // Delete old object
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucket,
          Key: oldKey,
        });

        await s3Client.send(deleteCommand);

        fixedKeys.push({ from: oldKey, to: newKey });
      }
    }

    return NextResponse.json({
      success: true,
      fixedCount: fixedKeys.length,
      fixedKeys,
    });
  } catch (error) {
    console.error("Error fixing R2 keys:", error);
    return NextResponse.json(
      {
        error: "Failed to fix R2 keys",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
