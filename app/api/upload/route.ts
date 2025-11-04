import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

const bufferToStream = (buffer: Buffer) => {
  return Readable.from(buffer);
};

const parseTags = (value: FormDataEntryValue | null) => {
  if (!value) return undefined;
  return value
    .toString()
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const video = formData.get("video");
    if (!(video instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Video file is required" },
        { status: 400 }
      );
    }

    const title = formData.get("title")?.toString();
    const description = formData.get("description")?.toString();
    const privacyStatus = formData.get("privacyStatus")?.toString() || "unlisted";
    const tags = parseTags(formData.get("tags"));

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400 }
      );
    }

    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing YouTube OAuth credentials. Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN."
        },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    await oauth2Client.getAccessToken();

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client
    });

    const buffer = Buffer.from(await video.arrayBuffer());
    const mimeType = video.type || "video/mp4";

    const uploadResponse = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: "22" // People & Blogs, works well for Shorts
        },
        status: {
          privacyStatus,
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        mimeType,
        body: bufferToStream(buffer)
      }
    });

    const videoId = uploadResponse.data.id;

    if (!videoId) {
      throw new Error("YouTube did not return a video ID.");
    }

    const videoUrl = `https://youtube.com/watch?v=${videoId}`;

    return NextResponse.json({
      success: true,
      videoUrl,
      videoId
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "YouTube upload failed unexpectedly";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
