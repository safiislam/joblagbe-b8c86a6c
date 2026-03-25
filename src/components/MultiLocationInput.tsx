import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MultiLocationInputProps {
  locations: string[];
  onChange: (locations: string[]) => void;
  placeholder?: string;
}

const MultiLocationInput = ({ locations, onChange, placeholder = "e.g. Dhaka" }: MultiLocationInputProps) => {
  const [input, setInput] = useState("");

  const addLocation = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (locations.includes(trimmed)) {
      setInput("");
      return;
    }
    onChange([...locations, trimmed]);
    setInput("");
  };

  const removeLocation = (index: number) => {
    onChange(locations.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLocation();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="rounded-xl"
        />
        <Button type="button" variant="outline" size="icon" onClick={addLocation} className="shrink-0 rounded-xl">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {locations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {locations.map((loc, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1 text-xs">
              {loc}
              <button type="button" onClick={() => removeLocation(i)} className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">Enter দিয়ে বা + বাটনে ক্লিক করে একাধিক লোকেশন যোগ করুন</p>
    </div>
  );
};

export default MultiLocationInput;
