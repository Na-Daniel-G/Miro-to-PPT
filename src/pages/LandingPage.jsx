import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Github, 
  Scaling, 
  Type, 
  LayoutGrid,
  Shield,
  Lock,
  Eye,
  Calendar,
  Table,
  FileCode,
  Users,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] flex items-center justify-center">
                <Scaling className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
                Miro-to-PPT
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-slate-900 text-sm font-medium"
              >
                Documentation
              </a>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
                onClick={() => window.open('https://github.com', '_blank')}
              >
                <Github className="w-4 h-4" />
                GitHub
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-6 bg-[#1E3A5F]/10 text-[#1E3A5F] hover:bg-[#1E3A5F]/10">
              Open Source • MIT License
            </Badge>
            
            <h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight"
              style={{ fontFamily: 'Manrope' }}
            >
              Editable Slides,{" "}
              <span className="text-[#2563EB]">Not Static Screenshots</span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              The open-source bridge between Miro and PowerPoint. Transform your boards into fully editable decks with vector shapes, real text boxes, and preserved layouts.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                data-testid="cta-convert-btn"
                size="lg"
                className="bg-[#1E3A5F] hover:bg-[#152d4a] text-white px-8 py-6 text-lg gap-2 shadow-lg shadow-[#1E3A5F]/20"
                onClick={onGetStarted}
              >
                Convert My Board Now
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button 
                data-testid="cta-github-btn"
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg gap-2 border-slate-300"
                onClick={() => window.open('https://github.com', '_blank')}
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </Button>
            </div>
            
            <p className="mt-6 text-sm text-slate-500">
              No sign-up required • Works with any Miro board
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION - "The Magic" */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 
              className="text-3xl sm:text-4xl font-bold text-slate-900"
              style={{ fontFamily: 'Manrope' }}
            >
              The Magic Behind the Conversion
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Three core capabilities that make your exports actually useful.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Vector Scaling */}
            <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6">
                  <Scaling className="w-7 h-7 text-white" />
                </div>
                <h3 
                  className="text-xl font-bold text-slate-900 mb-3"
                  style={{ fontFamily: 'Manrope' }}
                >
                  Vector Scaling
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Resize shapes to any dimension without pixelation—your sticky notes stay crisp at 4K or thumbnail size.
                </p>
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Crisp at any resolution
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2: Text Mapping */}
            <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6">
                  <Type className="w-7 h-7 text-white" />
                </div>
                <h3 
                  className="text-xl font-bold text-slate-900 mb-3"
                  style={{ fontFamily: 'Manrope' }}
                >
                  Text Mapping
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Every sticky note becomes a real text box—edit, spell-check, and reformat directly in PowerPoint.
                </p>
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    Fully editable text boxes
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3: Layout Preservation */}
            <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6">
                  <LayoutGrid className="w-7 h-7 text-white" />
                </div>
                <h3 
                  className="text-xl font-bold text-slate-900 mb-3"
                  style={{ fontFamily: 'Manrope' }}
                >
                  Layout Preservation
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Miro frames automatically become PowerPoint slides with spatial relationships intact.
                </p>
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-violet-500" />
                    Frames → Slides mapping
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* TRUST & SECURITY SECTION */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 lg:p-16">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 
                  className="text-3xl sm:text-4xl font-bold text-white"
                  style={{ fontFamily: 'Manrope' }}
                >
                  Corporate-Grade Privacy
                </h2>
              </div>
              
              <p className="text-lg text-slate-300 leading-relaxed mb-8">
                Our <strong className="text-white">pass-through architecture</strong> means your board data never touches a database. Content is processed entirely in-memory during conversion and immediately discarded. No logs, no storage, no traces.
              </p>
              
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Zero Storage</h4>
                    <p className="text-sm text-slate-400">No database, no files saved</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">In-Memory Only</h4>
                    <p className="text-sm text-slate-400">Process and discard instantly</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Github className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">100% Open Source</h4>
                    <p className="text-sm text-slate-400">Audit every line of code</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP SECTION */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl sm:text-4xl font-bold text-slate-900"
              style={{ fontFamily: 'Manrope' }}
            >
              What's Next
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Features on our roadmap—contributions welcome.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Table className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">Miro Tables Support</h4>
                  <p className="text-sm text-slate-600">Convert Miro tables to native PowerPoint tables</p>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-200">
                  In Progress
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileCode className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">Custom .potx Templates</h4>
                  <p className="text-sm text-slate-600">Apply your brand's PowerPoint template to exports</p>
                </div>
                <Badge variant="outline" className="text-slate-500 border-slate-200">
                  Planned
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">Microsoft Teams Integration</h4>
                  <p className="text-sm text-slate-600">Convert and share directly within Teams</p>
                </div>
                <Badge variant="outline" className="text-slate-500 border-slate-200">
                  Planned
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 
              className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6"
              style={{ fontFamily: 'Manrope' }}
            >
              Ready to ditch the screenshots?
            </h2>
            <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto">
              Convert your first Miro board in under 2 minutes. No account required.
            </p>
            <Button 
              data-testid="cta-bottom-btn"
              size="lg"
              className="bg-[#1E3A5F] hover:bg-[#152d4a] text-white px-10 py-6 text-lg gap-2 shadow-lg shadow-[#1E3A5F]/20"
              onClick={onGetStarted}
            >
              <Sparkles className="w-5 h-5" />
              Convert My Board Now
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] flex items-center justify-center">
                <Scaling className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-slate-600">
                Miro-to-PPT • Open Source under MIT License
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="https://github.com" className="hover:text-slate-900">GitHub</a>
              <a href="#" className="hover:text-slate-900">Documentation</a>
              <a href="#" className="hover:text-slate-900">Report Issue</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
