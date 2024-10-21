"use client";

import React, { useState, useEffect } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { Mic, StopCircle, Image as ImageIcon, Redo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function VoiceToImageGeneratorComponent() {
  const [isRecording, setIsRecording] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [editablePrompt, setEditablePrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBrowser, setIsBrowser] = useState(false);

  // Ensure hooks run safely in the browser
  useEffect(() => {
    setIsBrowser(typeof window !== "undefined");
  }, []);

  const { startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder(
    {
      audio: true,
    }
  );

  const handleStartRecording = () => {
    setIsRecording(true);
    startRecording();
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    stopRecording();
    setIsProcessing(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!mediaBlobUrl) throw new Error("No audio recording available");

      const audioBlob = await fetch(mediaBlobUrl).then((r) => r.blob());
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const transcript = await fetchTranscript(formData);
      const prompt = await fetchPrompt(transcript);

      setGeneratedPrompt(prompt);
      setEditablePrompt(prompt);
    } catch (err) {
      handleError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchTranscript = async (formData: FormData) => {
    const res = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });
    if (!res.ok)
      throw new Error((await res.json()).error || "Failed to transcribe audio");
    const { transcript } = await res.json();
    return transcript;
  };

  const fetchPrompt = async (transcript: string) => {
    const res = await fetch("/api/generate-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    if (!res.ok)
      throw new Error((await res.json()).error || "Failed to generate prompt");
    const { prompt } = await res.json();
    return prompt;
  };

  const handleError = (err: unknown) => {
    console.error("Error:", err);
    setError(err instanceof Error ? err.message : "An unknown error occurred");
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: editablePrompt }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to generate image");
      const { imageUrl } = await res.json();
      setGeneratedImage(imageUrl);
    } catch (err) {
      handleError(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromptEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditablePrompt(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Voice to Image Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            {!isRecording ? (
              <Button
                size="lg"
                variant="outline"
                className="w-24 h-24 rounded-full"
                onClick={handleStartRecording}
              >
                <Mic className="h-12 w-12" />
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                className="w-24 h-24 rounded-full animate-pulse"
                onClick={handleStopRecording}
              >
                <StopCircle className="h-12 w-12" />
              </Button>
            )}
          </div>
          <p className="text-center">
            {isRecording
              ? "Recording... Tap to stop"
              : "Tap the microphone to start recording"}
          </p>

          {isProcessing && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2">Processing audio...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg">
              <p>{error}</p>
            </div>
          )}

          {generatedPrompt && !isGenerating && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-lg">
                <label
                  htmlFor="prompt"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Generated Prompt (you can edit):
                </label>
                <textarea
                  id="prompt"
                  value={editablePrompt}
                  onChange={handlePromptEdit}
                  className="w-full min-h-[100px] p-2 text-sm border rounded"
                  placeholder="Edit your prompt here..."
                />
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={handleRegenerate}
                  className="flex items-center space-x-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>Generate Art</span>
                </Button>
              </div>
            </div>
          )}

          {generatedImage && !isGenerating && (
            <div className="space-y-4">
              <Image
                src={generatedImage}
                alt="Generated image"
                width={500}
                height={500}
                className="w-full rounded-lg"
              />
              <div className="flex justify-center">
                <Button
                  onClick={handleRegenerate}
                  className="flex items-center space-x-2"
                >
                  <Redo className="h-4 w-4" />
                  <span>Regenerate</span>
                </Button>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2">Generating image...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
