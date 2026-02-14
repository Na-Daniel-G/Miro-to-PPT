import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ExternalLink, 
  Shield, 
  Zap, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Sparkles
} from "lucide-react";

const TONES = {
  efficiency: {
    name: "Efficiency Expert",
    badge: "For Pros",
    connect: {
      title: "Connect Miro. Save 45 Minutes.",
      subtitle: "One click. Full board access. Zero hassle.",
      button: "Connect Now →",
      timeNote: "Setup takes 30 seconds"
    },
    permissions: {
      title: "Read-Only Access",
      points: [
        "We read your frames and sticky notes",
        "We analyze positions to group content",
        "We never modify your boards",
        "Your data stays yours"
      ]
    },
    selection: {
      title: "Select Your Board",
      steps: [
        "Pick your board from the dropdown",
        "We fetch all frames & notes instantly",
        "Hit 'Generate' — done in 90 seconds"
      ]
    },
    cta: "From sticky note chaos to slide deck ready. Under 2 minutes."
  },
  helpful: {
    name: "Helpful Assistant",
    badge: "Friendly",
    connect: {
      title: "Let's Connect Your Miro Account! 🎉",
      subtitle: "Don't worry — this is quick and easy. We'll guide you through every step.",
      button: "Connect to Miro",
      timeNote: "This only takes a moment"
    },
    permissions: {
      title: "What We Need (and Why)",
      points: [
        "📋 Read your boards — so we can see your sticky notes",
        "📍 Check positions — to know which notes go together",
        "🔒 Read-only access — we promise not to change anything!",
        "✨ That's it! Your boards stay exactly as they are"
      ]
    },
    selection: {
      title: "Finding Your Board",
      steps: [
        "After connecting, you'll see all your Miro boards",
        "Just pick the one with your brainstorm content",
        "Click 'Generate Slides' and watch the magic happen!"
      ]
    },
    cta: "Turn your brainstorm into a beautiful presentation — we'll do the heavy lifting! 💪"
  },
  minimalist: {
    name: "Minimalist",
    badge: "Clean",
    connect: {
      title: "Connect Miro",
      subtitle: "Authorize read access to your boards.",
      button: "Connect",
      timeNote: "30 sec"
    },
    permissions: {
      title: "Permissions",
      points: [
        "Read frames",
        "Read sticky notes",
        "Read positions",
        "No write access"
      ]
    },
    selection: {
      title: "Select Board",
      steps: [
        "Choose board",
        "Generate slides",
        "Export PPTX"
      ]
    },
    cta: "Sticky notes → Slides. 2 min."
  }
};

export function GettingStartedModal({ open, onOpenChange, onConnect }) {
  const [selectedTone, setSelectedTone] = useState("efficiency");
  const tone = TONES[selectedTone];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white" style={{ fontFamily: 'Manrope' }}>
              Getting Started with MiroBridge
            </DialogTitle>
            <DialogDescription className="text-indigo-100">
              Connect your Miro account to transform sticky notes into presentations
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          {/* Tone Selector */}
          <div className="mb-6">
            <p className="text-xs text-slate-500 mb-2">Choose your guide style:</p>
            <Tabs value={selectedTone} onValueChange={setSelectedTone}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="efficiency" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Pro
                </TabsTrigger>
                <TabsTrigger value="helpful" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Friendly
                </TabsTrigger>
                <TabsTrigger value="minimalist" className="text-xs">
                  Minimal
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Step 1: Connect */}
          <div className="space-y-6">
            <Card className="border-indigo-100 bg-indigo-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{tone.connect.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{tone.connect.subtitle}</p>
                    <div className="flex items-center gap-3">
                      <Button 
                        data-testid="modal-connect-btn"
                        onClick={onConnect}
                        className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {tone.connect.button}
                      </Button>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {tone.connect.timeNote}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Permissions */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <h3 className="font-semibold text-slate-900">{tone.permissions.title}</h3>
                    </div>
                    <ul className="space-y-1">
                      {tone.permissions.points.map((point, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Selection */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">{tone.selection.title}</h3>
                    <ol className="space-y-1">
                      {tone.selection.steps.map((step, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Footer */}
          <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg text-center">
            <p className="text-sm font-medium text-indigo-700">
              {tone.cta}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GettingStartedBanner({ onLearnMore, onConnect, isConnected }) {
  if (isConnected) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5" />
            <p className="text-sm font-medium">
              <span className="hidden sm:inline">Transform sticky note chaos into presentation-ready slides. </span>
              Connect Miro to get started.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              data-testid="banner-learn-more-btn"
              variant="ghost" 
              size="sm" 
              onClick={onLearnMore}
              className="text-white hover:bg-white/20"
            >
              Learn More
            </Button>
            <Button 
              data-testid="banner-connect-btn"
              size="sm" 
              onClick={onConnect}
              className="bg-white text-indigo-600 hover:bg-indigo-50"
            >
              Connect Miro
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
