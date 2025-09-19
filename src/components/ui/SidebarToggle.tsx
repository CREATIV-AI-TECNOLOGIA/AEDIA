import { Button } from "@/components/ui/Button"
import { PanelLeftClose, PanelLeft } from "lucide-react"

interface SidebarToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
  controlsId?: string;
}

export default function SidebarToggle({ isCollapsed, onToggle, controlsId }: SidebarToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle sidebar"
      aria-expanded={!isCollapsed}
      aria-controls={controlsId}
      onClick={onToggle}
      className="shrink-0 focus:outline-none focus-visible:outline-none focus:ring-0"
    >
      {isCollapsed ? <PanelLeft className="h-6 w-6" /> : <PanelLeftClose className="h-6 w-6" />}
    </Button>
  )
}
