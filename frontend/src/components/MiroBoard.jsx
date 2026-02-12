import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STICKY_COLORS = {
  yellow: "bg-yellow-200 text-yellow-900 border-yellow-300",
  blue: "bg-blue-200 text-blue-900 border-blue-300",
  green: "bg-green-200 text-green-900 border-green-300",
  pink: "bg-pink-200 text-pink-900 border-pink-300"
};

export const StickyNoteComponent = ({ note, compact = false }) => {
  const colorClass = STICKY_COLORS[note.color] || STICKY_COLORS.yellow;
  const rotation = Math.random() * 4 - 2; // Random rotation between -2 and 2 degrees
  
  return (
    <div
      data-testid={`sticky-note-${note.id}`}
      className={cn(
        "p-3 rounded shadow-sm border transition-all duration-200 hover:scale-105 hover:shadow-md cursor-default",
        colorClass,
        compact ? "text-xs" : "text-sm"
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <p className="line-clamp-3 font-medium leading-tight">{note.text}</p>
    </div>
  );
};

export const FrameComponent = ({ frame, notes, isSelected, onSelect }) => {
  return (
    <Card 
      data-testid={`frame-${frame.id}`}
      className={cn(
        "transition-all duration-200 cursor-pointer hover:shadow-lg",
        isSelected ? "ring-2 ring-indigo-500 shadow-lg" : "hover:ring-1 hover:ring-slate-300"
      )}
      onClick={() => onSelect?.(frame.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle 
            className="text-lg font-semibold text-slate-900"
            style={{ fontFamily: 'Manrope' }}
          >
            {frame.title}
          </CardTitle>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
            {notes.length} notes
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="miro-frame p-4 min-h-[180px]">
          {notes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {notes.map((note) => (
                <StickyNoteComponent key={note.id} note={note} compact />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              No sticky notes in this frame
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function MiroBoard({ data, onFrameSelect, selectedFrame }) {
  if (!data || !data.frames_with_notes) {
    return (
      <div className="text-center py-12 text-slate-500">
        No board data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: 'Manrope' }}
          >
            {data.board_name}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Click on a frame to see details
          </p>
        </div>
      </div>

      <div 
        data-testid="miro-board-grid"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {data.frames_with_notes.map((frameData) => (
          <FrameComponent
            key={frameData.frame.id}
            frame={frameData.frame}
            notes={frameData.notes}
            isSelected={selectedFrame === frameData.frame.id}
            onSelect={onFrameSelect}
          />
        ))}
      </div>
    </div>
  );
}
