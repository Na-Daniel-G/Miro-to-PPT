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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sparkles, 
  Download, 
  Loader2, 
  Presentation,
  StickyNote,
  LayoutGrid,
  Eye,
  Zap,
  Link,
  Unlink,
  History,
  Trash2,
  ExternalLink,
  HelpCircle
} from "lucide-react";
import MiroBoard from "@/components/MiroBoard";
import SlidePreview from "@/components/SlidePreview";
import { GettingStartedModal, GettingStartedBanner } from "@/components/GettingStarted";
import pptxgen from "pptxgenjs";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Professional template configuration
const PROFESSIONAL_TEMPLATE = {
  name: "Professional",
  header_color: "1E3A5F",
  accent_color: "2563EB",
  title_color: "FFFFFF",
  body_color: "1F2937",
  bullet_color: "4B5563",
  background: "FFFFFF"
};

// Modern Midnight Premium template
const MODERN_MIDNIGHT_TEMPLATE = {
  name: "Modern Midnight",
  header_color: "0F172A",
  accent_color: "F59E0B",
  title_color: "F8FAFC",
  body_color: "0F172A",
  bullet_color: "94A3B8",
  divider_color: "1E293B",
  background: "0F172A",
  fonts: {
    title: "Playfair Display",
    body: "Inter"
  }
};

export default function Dashboard() {
  const [boardData, setBoardData] = useState(null);
  const [mappedData, setMappedData] = useState(null);
  const [generatedSlides, setGeneratedSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("board");
  const [selectedFrame, setSelectedFrame] = useState(null);
  
  // Miro OAuth state
  const [miroStatus, setMiroStatus] = useState({ connected: false, configured: false });
  const [miroBoards, setMiroBoards] = useState([]);
  const [selectedMiroBoard, setSelectedMiroBoard] = useState(null);
  const [loadingMiroBoards, setLoadingMiroBoards] = useState(false);
  
  // Export history state
  const [exportHistory, setExportHistory] = useState([]);
  
  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState("midnight");
  
  // Getting Started modal state
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  
  const currentTemplate = selectedTemplate === "midnight" ? MODERN_MIDNIGHT_TEMPLATE : PROFESSIONAL_TEMPLATE;

  useEffect(() => {
    // Load export history from localStorage
    const savedHistory = localStorage.getItem("mirobridge_export_history");
    if (savedHistory) {
      setExportHistory(JSON.parse(savedHistory));
    }
    
    // Check URL params for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("miro_connected") === "true") {
      toast.success("Connected to Miro successfully!");
      window.history.replaceState({}, "", "/");
    }
    if (urlParams.get("miro_error")) {
      toast.error(`Miro connection failed: ${urlParams.get("miro_error")}`);
      window.history.replaceState({}, "", "/");
    }
    
    checkMiroStatus();
    fetchBoardData();
  }, []);

  const checkMiroStatus = async () => {
    try {
      const response = await axios.get(`${API}/miro/status`);
      setMiroStatus(response.data);
      
      if (response.data.connected) {
        fetchMiroBoards();
      }
    } catch (error) {
      console.error("Failed to check Miro status:", error);
    }
  };

  const fetchMiroBoards = async () => {
    setLoadingMiroBoards(true);
    try {
      const response = await axios.get(`${API}/miro/boards`);
      setMiroBoards(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch Miro boards:", error);
      if (error.response?.status === 401) {
        setMiroStatus({ connected: false, configured: true });
        toast.error("Miro session expired, please reconnect");
      }
    } finally {
      setLoadingMiroBoards(false);
    }
  };

  const connectMiro = () => {
    window.location.href = `${API}/miro/auth`;
  };

  const disconnectMiro = async () => {
    try {
      await axios.post(`${API}/miro/disconnect`);
      setMiroStatus({ connected: false, configured: true });
      setMiroBoards([]);
      setSelectedMiroBoard(null);
      toast.success("Disconnected from Miro");
    } catch (error) {
      toast.error("Failed to disconnect");
    }
  };

  const loadMiroBoard = async (boardId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/miro/boards/${boardId}`);
      const miroBoard = response.data;
      
      setBoardData(miroBoard);
      
      // Map notes to frames using coordinate overlap
      // Frame positions are centers, so calculate bounds
      const frameNotes = {};
      miroBoard.frames.forEach(frame => {
        frameNotes[frame.id] = [];
      });
      
      miroBoard.sticky_notes.forEach(note => {
        // Note position is its center
        const noteX = note.x;
        const noteY = note.y;
        
        // Find which frame contains this note
        for (const frame of miroBoard.frames) {
          // Frame position is center, calculate bounds
          const frameLeft = frame.x - frame.width / 2;
          const frameRight = frame.x + frame.width / 2;
          const frameTop = frame.y - frame.height / 2;
          const frameBottom = frame.y + frame.height / 2;
          
          // Check if note center is within frame bounds (with some tolerance)
          const tolerance = 50; // pixels
          if (noteX >= frameLeft - tolerance && noteX <= frameRight + tolerance &&
              noteY >= frameTop - tolerance && noteY <= frameBottom + tolerance) {
            frameNotes[frame.id].push(note);
            break;
          }
        }
      });
      
      const framesWithNotes = miroBoard.frames.map(frame => ({
        frame,
        notes: frameNotes[frame.id] || [],
        note_count: (frameNotes[frame.id] || []).length
      }));
      
      // Log for debugging
      console.log("Frames with notes:", framesWithNotes);
      console.log("Total sticky notes:", miroBoard.sticky_notes.length);
      
      setMappedData({
        board_id: miroBoard.id,
        board_name: miroBoard.name,
        frames_with_notes: framesWithNotes
      });
      
      setSelectedMiroBoard(boardId);
      setGeneratedSlides([]);
      toast.success(`Loaded board: ${miroBoard.name} (${miroBoard.sticky_notes.length} content items)`);
    } catch (error) {
      console.error("Failed to load Miro board:", error);
      toast.error("Failed to load board from Miro");
    } finally {
      setIsLoading(false);
    }
  };

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
      const totalFrames = frames.length; // Include all frames, not just those with notes
      let completed = 0;
      const slides = [];
      
      for (const frameData of frames) {
        const notes = frameData.notes.map(n => n.text);
        
        // Handle frames without sticky notes
        if (notes.length === 0) {
          slides.push({
            frame_id: frameData.frame.id,
            frame_title: frameData.frame.title,
            slide: {
              title: frameData.frame.title,
              bullets: ["Content to be added"]
            },
            raw_notes: [],
            is_empty_frame: true
          });
          completed++;
          setProgress(Math.round((completed / totalFrames) * 100));
          continue;
        }
        
        try {
          const response = await axios.post(`${API}/summarize`, {
            notes: notes,
            frame_title: frameData.frame.title
          });
          
          slides.push({
            frame_id: frameData.frame.id,
            frame_title: frameData.frame.title,
            slide: response.data,
            raw_notes: notes,
            is_empty_frame: false
          });
        } catch (err) {
          slides.push({
            frame_id: frameData.frame.id,
            frame_title: frameData.frame.title,
            slide: {
              title: frameData.frame.title,
              bullets: notes.slice(0, 5)
            },
            raw_notes: notes,
            is_empty_frame: false
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

  const saveExportHistory = (record) => {
    const newHistory = [record, ...exportHistory].slice(0, 10); // Keep last 10
    setExportHistory(newHistory);
    localStorage.setItem("mirobridge_export_history", JSON.stringify(newHistory));
  };

  const clearExportHistory = () => {
    setExportHistory([]);
    localStorage.removeItem("mirobridge_export_history");
    toast.success("Export history cleared");
  };

  const deleteHistoryItem = (id) => {
    const newHistory = exportHistory.filter(item => item.id !== id);
    setExportHistory(newHistory);
    localStorage.setItem("mirobridge_export_history", JSON.stringify(newHistory));
  };

  const exportToPowerPoint = async () => {
    if (generatedSlides.length === 0) {
      toast.error("No slides to export. Generate slides first.");
      return;
    }

    try {
      const template = PROFESSIONAL_TEMPLATE;
      const pptx = new pptxgen();
      pptx.author = "MiroBridge";
      pptx.title = boardData?.name || "Miro Board Export";
      pptx.subject = "AI-Generated Presentation from Miro";
      
      // Define Professional slide master with dark blue header
      pptx.defineSlideMaster({
        title: "PROFESSIONAL",
        background: { color: template.background },
        objects: [
          // Dark blue header bar
          { rect: { x: 0, y: 0, w: "100%", h: "15%", fill: { color: template.header_color } } },
          // Bottom accent line
          { rect: { x: 0, y: "95%", w: "100%", h: "5%", fill: { color: template.accent_color } } },
          // Footer text
          { text: { 
            text: "MiroBridge Export", 
            options: { 
              x: 0.5, 
              y: "96%", 
              w: 3, 
              h: 0.3, 
              fontSize: 9, 
              color: "FFFFFF", 
              fontFace: "Arial" 
            } 
          }}
        ]
      });

      generatedSlides.forEach((slideData, index) => {
        const slide = pptx.addSlide({ masterName: "PROFESSIONAL" });
        const isEmptyFrame = slideData.is_empty_frame || slideData.raw_notes?.length === 0;
        
        // Add title in header area
        slide.addText(slideData.slide.title, {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.8,
          fontSize: 28,
          fontFace: "Arial",
          color: template.title_color,
          bold: true
        });
        
        // Add bullets in body area
        const bulletText = slideData.slide.bullets.map(bullet => ({
          text: bullet,
          options: { 
            bullet: { type: "bullet", color: template.accent_color }, 
            fontSize: 18, 
            color: template.bullet_color, 
            breakLine: true,
            paraSpaceAfter: 12
          }
        }));
        
        slide.addText(bulletText, {
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 4,
          fontFace: "Arial",
          valign: "top"
        });
        
        // Add speaker notes (only if there are original notes)
        if (!isEmptyFrame && slideData.raw_notes?.length > 0) {
          const speakerNotes = `Original Sticky Notes from "${slideData.frame_title}":\n\n${slideData.raw_notes.map((note, i) => `${i + 1}. ${note}`).join("\n")}`;
          slide.addNotes(speakerNotes);
        } else {
          slide.addNotes(`Frame: "${slideData.frame_title}" - No sticky notes in this frame.`);
        }
      });

      // Browser-safe export
      const blob = await pptx.write({ outputType: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileName = `${boardData?.name || "MiroBridge-Export"}.pptx`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Save to export history
      const exportRecord = {
        id: Date.now().toString(),
        board_name: boardData?.name || "Untitled Board",
        slide_count: generatedSlides.length,
        template: "Professional",
        exported_at: new Date().toISOString()
      };
      saveExportHistory(exportRecord);
      
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
      {/* Getting Started Banner */}
      <GettingStartedBanner 
        isConnected={miroStatus.connected}
        onLearnMore={() => setShowGettingStarted(true)}
        onConnect={connectMiro}
      />
      
      {/* Getting Started Modal */}
      <GettingStartedModal
        open={showGettingStarted}
        onOpenChange={setShowGettingStarted}
        onConnect={() => {
          setShowGettingStarted(false);
          connectMiro();
        }}
      />

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
              {/* Help Button */}
              <Button
                data-testid="help-btn"
                variant="ghost"
                size="icon"
                onClick={() => setShowGettingStarted(true)}
                className="text-slate-500 hover:text-slate-700"
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
              
              {/* Miro Connection Status */}
              {miroStatus.configured && (
                miroStatus.connected ? (
                  <Button
                    data-testid="disconnect-miro-btn"
                    onClick={disconnectMiro}
                    variant="outline"
                    size="sm"
                    className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Link className="w-4 h-4" />
                    Miro Connected
                  </Button>
                ) : (
                  <Button
                    data-testid="connect-miro-btn"
                    onClick={connectMiro}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Connect Miro
                  </Button>
                )
              )}
              
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

      {/* Miro Board Selector */}
      {miroStatus.connected && miroBoards.length > 0 && (
        <div className="bg-indigo-50 border-b border-indigo-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-indigo-700">
                Select a Miro Board:
              </span>
              <Select 
                value={selectedMiroBoard || ""} 
                onValueChange={loadMiroBoard}
              >
                <SelectTrigger 
                  data-testid="miro-board-select"
                  className="w-64 bg-white"
                >
                  <SelectValue placeholder="Choose a board..." />
                </SelectTrigger>
                <SelectContent>
                  {miroBoards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchBoardData}
                className="text-indigo-600"
              >
                Use Demo Board
              </Button>
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
              <TabsTrigger 
                value="history" 
                data-testid="tab-history"
                className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 gap-2"
              >
                <History className="w-4 h-4" />
                Export History
                {exportHistory.length > 0 && (
                  <Badge className="ml-1 bg-slate-500 text-white text-xs">
                    {exportHistory.length}
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
                <>
                  {/* Template Selector */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700">Theme:</span>
                      <div className="flex gap-2">
                        <Button
                          data-testid="template-midnight"
                          variant={selectedTemplate === "midnight" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTemplate("midnight")}
                          className={selectedTemplate === "midnight" ? "bg-slate-900 hover:bg-slate-800" : ""}
                        >
                          <span className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
                          Modern Midnight
                        </Button>
                        <Button
                          data-testid="template-professional"
                          variant={selectedTemplate === "professional" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTemplate("professional")}
                          className={selectedTemplate === "professional" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                        >
                          <span className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                          Professional
                        </Button>
                      </div>
                    </div>
                  </div>
                  <SlidePreview 
                    slides={generatedSlides} 
                    template={currentTemplate}
                    onSlidesUpdate={setGeneratedSlides}
                  />
                </>
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

            <TabsContent value="history" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 
                    className="text-2xl font-bold text-slate-900"
                    style={{ fontFamily: 'Manrope' }}
                  >
                    Export History
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Your recent PowerPoint exports (stored locally)
                  </p>
                </div>
                {exportHistory.length > 0 && (
                  <Button
                    data-testid="clear-history-btn"
                    variant="outline"
                    size="sm"
                    onClick={clearExportHistory}
                    className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </Button>
                )}
              </div>
              
              {exportHistory.length > 0 ? (
                <div className="grid gap-4">
                  {exportHistory.map((record) => (
                    <Card key={record.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Presentation className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{record.board_name}</h4>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              <span>{record.slide_count} slides</span>
                              <span>•</span>
                              <span>{record.template} template</span>
                              <span>•</span>
                              <span>{new Date(record.exported_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHistoryItem(record.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <History className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Manrope' }}>
                      No Export History
                    </h3>
                    <p className="text-slate-500 text-center max-w-md">
                      Your exported presentations will appear here. Generate and export slides to see your history.
                    </p>
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
