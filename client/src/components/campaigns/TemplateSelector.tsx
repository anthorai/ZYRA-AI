import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { campaignPresets, CampaignPreset } from "@/lib/campaign-presets";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type TemplateSelectorProps = {
  selectedPreset?: string;
  onSelect: (preset: CampaignPreset) => void;
  type?: 'email' | 'sms';
};

export function TemplateSelector({ selectedPreset, onSelect, type }: TemplateSelectorProps) {
  const filteredPresets = type 
    ? campaignPresets.filter(p => p.type === type || p.id === 'custom')
    : campaignPresets;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredPresets.map((preset) => {
        const Icon = preset.icon;
        const isSelected = selectedPreset === preset.id;

        return (
          <Card
            key={preset.id}
            className={cn(
              "cursor-pointer transition-all hover-elevate relative",
              isSelected && "border-primary"
            )}
            onClick={() => onSelect(preset)}
            data-testid={`template-${preset.id}`}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            
            <CardHeader className="space-y-1">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center mb-2 bg-gradient-to-br",
                preset.color
              )}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg" data-testid={`text-template-name-${preset.id}`}>
                {preset.name}
              </CardTitle>
              <CardDescription className="text-sm">
                {preset.description}
              </CardDescription>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
