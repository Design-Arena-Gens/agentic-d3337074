"use client";

import { FormEvent, useState, useTransition } from "react";

type GenerationResult = {
  title: string;
  description: string;
  script: string;
  shotIdeas: string[];
  hashtags: string[];
  callToAction: string;
};

type GenerateResponse =
  | { success: true; data: GenerationResult }
  | { success: false; error: string };

type UploadResponse =
  | { success: true; videoUrl: string; videoId: string }
  | { success: false; error: string };

const initialResult: GenerationResult = {
  title: "",
  description: "",
  script: "",
  shotIdeas: [],
  hashtags: [],
  callToAction: ""
};

export default function Home() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Energetic");
  const [duration, setDuration] = useState("45");
  const [audience, setAudience] = useState("Creators exploring AI workflows");
  const [result, setResult] = useState<GenerationResult>(initialResult);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  const handleGenerate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGenerateError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, tone, duration, audience })
        });
        const payload = (await response.json()) as GenerateResponse;
        if (!response.ok || !payload.success) {
          throw new Error(
            payload.success ? "Unexpected error" : payload.error || "Unknown error"
          );
        }
        setResult(payload.data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to generate short plan";
        setGenerateError(message);
        setResult(initialResult);
      }
    });
  };

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    setIsUploading(true);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as UploadResponse;
      if (!response.ok || !payload.success) {
        throw new Error(
          payload.success ? "Unexpected error" : payload.error || "Unknown error"
        );
      }
      setUploadSuccess(
        `Upload succeeded. Video ID: ${payload.videoId}. Preview: ${payload.videoUrl}`
      );
      form.reset();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload video";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="page">
      <header className="hero">
        <div>
          <h1>Shorts Agent</h1>
          <p>
            Orchestrate high-impact YouTube Shorts with Gemini-generated scripts and
            a push-button upload flow.
          </p>
        </div>
        <div className="badge">Powered by Gemini + YouTube API</div>
      </header>

      <section className="panel">
        <h2>1. Generate your short</h2>
        <form className="form" onSubmit={handleGenerate}>
          <label>
            Topic / Hook
            <input
              required
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. Automate YouTube Shorts with AI"
            />
          </label>
          <div className="grid">
            <label>
              Tone
              <input
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                placeholder="Energetic, inspirational..."
              />
            </label>
            <label>
              Target Duration (seconds)
              <input
                inputMode="numeric"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </label>
          </div>
          <label>
            Target Audience
            <input
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
              placeholder="Creators exploring AI workflows"
            />
          </label>
          <button type="submit" disabled={isPending}>
            {isPending ? "Generating..." : "Generate plan"}
          </button>
        </form>
        {generateError && <p className="error">{generateError}</p>}
      </section>

      {result.script && (
        <section className="panel">
          <h2>2. Review creative package</h2>
          <div className="result">
            <div>
              <h3>Short Script</h3>
              <textarea value={result.script} readOnly rows={10} />
            </div>
            <div className="meta">
              <div>
                <h3>Title</h3>
                <p>{result.title}</p>
              </div>
              <div>
                <h3>Description</h3>
                <p>{result.description}</p>
              </div>
              <div>
                <h3>Call to Action</h3>
                <p>{result.callToAction}</p>
              </div>
              <div>
                <h3>Shot Ideas</h3>
                <ul>
                  {result.shotIdeas.map((shot, index) => (
                    <li key={index}>{shot}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Hashtags</h3>
                <p>{result.hashtags.join(" ")}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="panel">
        <h2>3. Upload final cut to YouTube</h2>
        <form className="form upload" onSubmit={handleUpload}>
          <label>
            Final Video File (MP4 / MOV)
            <input name="video" type="file" accept="video/mp4,video/quicktime" required />
          </label>
          <label>
            Title
            <input
              name="title"
              defaultValue={result.title}
              placeholder="Short title"
              required
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              defaultValue={result.description}
              placeholder="Description with context and hashtags"
              rows={4}
              required
            />
          </label>
          <label>
            Visibility
            <select name="privacyStatus" defaultValue="unlisted">
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label>
            Tags (comma separated)
            <input
              name="tags"
              defaultValue={result.hashtags.join(", ").replace(/#/g, "")}
              placeholder="ai, shorts, automation"
            />
          </label>
          <button type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload to YouTube"}
          </button>
        </form>
        {uploadError && <p className="error">{uploadError}</p>}
        {uploadSuccess && <p className="success">{uploadSuccess}</p>}
      </section>
    </main>
  );
}
