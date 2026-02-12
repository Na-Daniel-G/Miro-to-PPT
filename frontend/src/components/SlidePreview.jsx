import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  StickyNote,
  Presentation
} from "lucide-react";
import { cn } from "@/lib/utils";

const SlideCard = ({ slideData, index, isActive, onClick }) => {
  const [showNotes, setShowNotes] = useState(false);
  const isEmptyFrame = slideData.is_empty_frame || slideData.raw_notes?.length === 0;

  return (
    <div 
      className={cn(
        "animate-slide-up",
        "transition-all duration-200"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Card 
        data-testid={`slide-card-${index}`}
        className={cn(
          "overflow-hidden cursor-pointer transition-all duration-200",
          isActive 
            ? "ring-2 ring-indigo-500 shadow-xl" 
            : "hover:shadow-lg hover:ring-1 hover:ring-slate-200"
        )}
        onClick={onClick}
      >
        {/* Slide Preview */}
        <div className="slide-card relative bg-white border-b border-slate-100">
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-indigo-500 text-white text-xs">
              Slide {index + 1}
            </Badge>
            {isEmptyFrame && (
              <Badge className="bg-amber-500 text-white text-xs">
                Empty Frame
              </Badge>
            )}
          </div>
          <div className="p-6 pt-12">
            <h3 
              className="text-xl font-bold text-slate-900 mb-4 line-clamp-2"
              style={{ fontFamily: 'Manrope' }}
            >
              {slideData.slide.title}
            </h3>
            <ul className="space-y-2">
              {slideData.slide.bullets.slice(0, 4).map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                  <span className="line-clamp-2">{bullet}</span>
                </li>
              ))}
              {slideData.slide.bullets.length > 4 && (
                <li className="text-xs text-slate-400 pl-3">
                  +{slideData.slide.bullets.length - 4} more...
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Speaker Notes Toggle - only show if there are notes */}
        {!isEmptyFrame && (
          <Collapsible open={showNotes} onOpenChange={setShowNotes}>
            <CollapsibleTrigger asChild>
              <Button
                data-testid={`speaker-notes-toggle-${index}`}
                variant="ghost"
                className="w-full justify-between px-4 py-3 h-auto text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-none"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4" />
                  Speaker Notes ({slideData.raw_notes.length} original notes)
                </span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  showNotes && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2 pt-3">
                  Original sticky note content from "{slideData.frame_title}":
                </p>
                <ScrollArea className="h-32">
                  <ul className="space-y-1.5">
                    {slideData.raw_notes.map((note, i) => (
                      <li 
                        key={i} 
                        className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-200"
                      >
                        {i + 1}. {note}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </Card>
    </div>
  );
};

export default function SlidePreview({ slides, template }) {
  const [activeSlide, setActiveSlide] = useState(0);

  // Default template if not provided
  const slideTemplate = template || {
    header_color: "1E3A5F",
    accent_color: "2563EB",
    title_color: "FFFFFF",
    body_color: "1F2937",
    bullet_color: "4B5563",
    background: "FFFFFF"
  };

  if (!slides || slides.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No slides generated yet
      </div>
    );
  }

  const currentSlide = slides[activeSlide];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: 'Manrope' }}
          >
            Generated Slides
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            AI-summarized content ready for export
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-testid="prev-slide-btn"
            variant="outline"
            size="icon"
            onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
            disabled={activeSlide === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-600 font-mono px-3">
            {activeSlide + 1} / {slides.length}
          </span>
          <Button
            data-testid="next-slide-btn"
            variant="outline"
            size="icon"
            onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
            disabled={activeSlide === slides.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Preview */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden shadow-xl">
            <div 
              className="p-4"
              style={{ backgroundColor: `#${slideTemplate.header_color}` }}
            >
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Presentation className="w-4 h-4" />
                <span>Slide {activeSlide + 1}</span>
              </div>
              <h2 
                className="text-2xl font-bold mt-2"
                style={{ color: `#${slideTemplate.title_color}`, fontFamily: 'Manrope' }}
              >
                {currentSlide.slide.title}
              </h2>
            </div>
            <CardContent className="p-8 bg-white min-h-[350px]">
              <ul className="space-y-4">
                {currentSlide.slide.bullets.map((bullet, i) => (
                  <li 
                    key={i} 
                    className="flex items-start gap-4 text-lg"
                    style={{ color: `#${slideTemplate.bullet_color}` }}
                  >
                    <span 
                      className="w-2 h-2 rounded-full mt-3 flex-shrink-0"
                      style={{ backgroundColor: `#${slideTemplate.accent_color}` }}
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <div 
              className="h-2" 
              style={{ backgroundColor: `#${slideTemplate.accent_color}` }}
            />
          </Card>
          
          {/* Speaker Notes Section */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <StickyNote className="w-4 h-4" />
                Speaker Notes
              </h4>
              <p className="text-xs text-slate-500 mb-2">
                Original content from "{currentSlide.frame_title}":
              </p>
              <ScrollArea className="h-24">
                <div className="space-y-1">
                  {currentSlide.raw_notes.map((note, i) => (
                    <p key={i} className="text-sm text-slate-600">
                      {i + 1}. {note}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Slide Thumbnails */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">All Slides</h3>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {slides.map((slideData, index) => (
                <SlideCard
                  key={slideData.frame_id}
                  slideData={slideData}
                  index={index}
                  isActive={activeSlide === index}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
