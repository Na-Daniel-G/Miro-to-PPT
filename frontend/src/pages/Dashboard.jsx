import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  Download, 
  Loader2, 
  Presentation,
  StickyNote,
  LayoutGrid,
  Eye,
  ChevronRight,
  Zap
} from "lucide-react";
import MiroBoard from "@/components/MiroBoard";
import SlidePreview from "@/components/SlidePreview";
import pptxgen from "pptxgenjs";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [boardData, setBoardData] = useState(null);
  const [mappedData, setMappedData] = useState(null);
  const [generatedSlides, setGeneratedSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("board");
  const [selectedFrame, setSelectedFrame] = useState(null);

  useEffect(() => {
    fetchBoardData();
  }, []);

  const fetchBoardData = async () => {
    setIsLoading(true);
    try {
      const [boardRes, mappedRes] = await Promise.all([
        axios.get(`${API}/board`),
        axios.get(`${API}/board/mapped`)
      ]);
      setBoardData(boardRes.data);
      setMappedData(mappedRes.data);
      toast.success("Board data loaded successfully");
    } catch (error) {
      console.error("Failed to fetch board data:", error);
      toast.error("Failed to load board data");
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlides = async () => {
    if (!mappedData) return;
    
    setIsGenerating(true);
    setProgress(0);
    setGeneratedSlides([]);
    
    try {
      const frames = mappedData.frames_with_notes;
      const totalFrames = frames.filter(f => f.note_count > 0).length;
      let completed = 0;
      const slides = [];
      
      for (const frameData of frames) {
        if (frameData.note_count === 0) continue;
        
        const notes = frameData.notes.map(n => n.text);
        
        try {
          const response = await axios.post(`${API}/summarize`, {
            notes: notes,
            frame_title: frameData.frame.title
          });
          
          slides.push({
            frame_id: frameData.frame.id,
            frame_title: frameData.frame.title,
            slide: response.data,
            raw_notes: notes
          });
        } catch (err) {
          // Fallback if AI fails
          slides.push({
            frame_id: frameData.frame.id,
            frame_title: frameData.frame.title,
            slide: {
              title: frameData.frame.title,
              bullets: notes.slice(0, 5)
            },
            raw_notes: notes
          });
        }
        
        completed++;
        setProgress(Math.round((completed / totalFrames) * 100));
      }
      
      setGeneratedSlides(slides);
      setActiveTab("preview");
      toast.success(`Generated ${slides.length} slides with AI`);
    } catch (error) {
      console.error("Failed to generate slides:", error);
      toast.error("Failed to generate slides");
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  };

  const exportToPowerPoint = async () => {
    if (generatedSlides.length === 0) {
      toast.error("No slides to export. Generate slides first.");
      return;
    }

    try {
      const pptx = new pptxgen();
      pptx.author = "MiroBridge";
      pptx.title = boardData?.name || "Miro Board Export";
      pptx.subject = "AI-Generated Presentation from Miro";
      
      // Define slide master with professional styling
      pptx.defineSlideMaster({
        title: "MIROBRIDGE",
        background: { color: "FFFFFF" },
        objects: [
          { rect: { x: 0, y: "93%", w: "100%", h: "7%", fill: { color: "6366F1" } } },
          { text: { text: "MiroBridge Export", options: { x: 0.5, y: "94%", w: 3, h: 0.4, fontSize: 10, color: "FFFFFF", fontFace: "Arial" } } }
        ]
      });

      generatedSlides.forEach((slideData, index) => {
        const slide = pptx.addSlide({ masterName: "MIROBRIDGE" });
        
        // Add title
        slide.addText(slideData.slide.title, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 1,
          fontSize: 32,
          fontFace: "Arial",
          color: "0F172A",
          bold: true
        });
        
        // Add bullets
        const bulletText = slideData.slide.bullets.map(bullet => ({
          text: bullet,
          options: { bullet: true, fontSize: 18, color: "475569", breakLine: true }
        }));
        
        slide.addText(bulletText, {
          x: 0.5,
          y: 1.7,
          w: 9,
          h: 4,
          fontFace: "Arial",
          valign: "top"
        });
        
        // Add speaker notes with raw sticky note content
        const speakerNotes = `Original Sticky Notes from "${slideData.frame_title}":\n\n${slideData.raw_notes.map((note, i) => `${i + 1}. ${note}`).join("\n")}`;
        slide.addNotes(speakerNotes);
      });

      // Browser-safe: Download as blob (no node:fs needed)
      const blob = await pptx.write({ outputType: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${boardData?.name || "MiroBridge-Export"}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("PowerPoint exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PowerPoint");
    }
  };

  const stats = mappedData ? {
    frames: mappedData.frames_with_notes?.length || 0,
    notes: mappedData.frames_with_notes?.reduce((acc, f) => acc + f.note_count, 0) || 0,
    slides: generatedSlides.length
  } : { frames: 0, notes: 0, slides: 0 };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Presentation className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
                  MiroBridge
                </h1>
                <p className="text-xs text-slate-500">AI-Powered Export</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                data-testid="generate-slides-btn"
                onClick={generateSlides}
                disabled={isGenerating || !mappedData}
                className="btn-magic text-white border-0 gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Slides
                  </>
                )}
              </Button>
              
              <Button
                data-testid="export-pptx-btn"
                onClick={exportToPowerPoint}
                disabled={generatedSlides.length === 0}
                variant="outline"
                className="gap-2 border-slate-200 hover:bg-slate-50"
              >
                <Download className="w-4 h-4" />
                Export PPTX
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="bg-white border-b border-slate-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700">
                AI Processing...
              </span>
              <Progress value={progress} className="flex-1 h-2" />
              <span className="text-sm font-mono text-indigo-600">{progress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{stats.frames}</span> Frames
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{stats.notes}</span> Sticky Notes
                </span>
              </div>
              {stats.slides > 0 && (
                <div className="flex items-center gap-2">
                  <Presentation className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm text-slate-600">
                    <span className="font-semibold text-indigo-600">{stats.slides}</span> Slides Generated
                  </span>
                </div>
              )}
            </div>
            
            {boardData && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                {boardData.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-600">Loading board data...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white border border-slate-200 p-1">
              <TabsTrigger 
                value="board" 
                data-testid="tab-board"
                className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Board View
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                data-testid="tab-preview"
                className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 gap-2"
                disabled={generatedSlides.length === 0}
              >
                <Eye className="w-4 h-4" />
                Slide Preview
                {generatedSlides.length > 0 && (
                  <Badge className="ml-1 bg-indigo-500 text-white text-xs">
                    {generatedSlides.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="board" className="space-y-6">
              {mappedData && (
                <MiroBoard 
                  data={mappedData} 
                  onFrameSelect={setSelectedFrame}
                  selectedFrame={selectedFrame}
                />
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              {generatedSlides.length > 0 ? (
                <SlidePreview slides={generatedSlides} />
              ) : (
                <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                      <Zap className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Manrope' }}>
                      No Slides Generated Yet
                    </h3>
                    <p className="text-slate-500 text-center max-w-md mb-6">
                      Click "Generate Slides" to use AI to transform your Miro sticky notes into professional presentation slides.
                    </p>
                    <Button
                      data-testid="generate-slides-empty-btn"
                      onClick={generateSlides}
                      disabled={isGenerating || !mappedData}
                      className="btn-magic text-white border-0 gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Slides
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-slate-500">
            MiroBridge transforms messy brainstorms into polished presentations with AI
          </p>
        </div>
      </footer>
    </div>
  );
}
