
'use client';
import PlatformSettings from "@/components/platform-settings";

export default function PlatformSetupPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Platform Setup</h1>
                <p className="text-muted-foreground">Select the platforms you own and choose a favorite.</p>
            </div>
            <PlatformSettings isOnboarding={true} />
        </div>
    </div>
  )
}
