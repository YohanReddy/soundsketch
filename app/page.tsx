import dynamic from "next/dynamic";

// Disable SSR for this component
const VoiceToImageGeneratorComponent = dynamic(
  () => import("@/components/voice-to-image-generator"),
  { ssr: false }
);

export default function Home() {
  return (
    <div>
      <VoiceToImageGeneratorComponent />
    </div>
  );
}
