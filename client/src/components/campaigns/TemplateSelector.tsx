import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { campaignPresets, CampaignPreset } from "@/lib/campaign-presets";
import { cn } from "@/lib/utils";
import { Check, FileText, Layout, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { EmailTemplate } from "@shared/schema";

type TemplateSelectorProps = {
  selectedPreset?: string;
  onSelect: (preset: CampaignPreset) => void;
  onSelectCustomTemplate?: (template: EmailTemplate) => void;
  type?: 'email' | 'sms';
  selectedCustomTemplateId?: string;
};

export function TemplateSelector({ 
  selectedPreset, 
  onSelect, 
  onSelectCustomTemplate,
  type,
  selectedCustomTemplateId 
}: TemplateSelectorProps) {
  const filteredPresets = type 
    ? campaignPresets.filter(p => p.type === type || p.id === 'custom')
    : campaignPresets;

  const { data: savedTemplates, isLoading: loadingTemplates } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/email-templates'],
  });

  const activeTemplates = savedTemplates?.filter(t => t.status === 'active') || [];
  const draftTemplates = savedTemplates?.filter(t => t.status === 'draft') || [];

  return (
    <Tabs defaultValue="presets" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="presets" data-testid="tab-presets">
          <Layout className="w-4 h-4 mr-2" />
          Campaign Templates
        </TabsTrigger>
        <TabsTrigger value="saved" data-testid="tab-saved">
          <FileText className="w-4 h-4 mr-2" />
          My Templates
          {savedTemplates && savedTemplates.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {savedTemplates.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="presets">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPresets.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPreset === preset.id && !selectedCustomTemplateId;

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
      </TabsContent>

      <TabsContent value="saved">
        {loadingTemplates ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading your templates...</span>
          </div>
        ) : savedTemplates && savedTemplates.length > 0 ? (
          <div className="space-y-6">
            {activeTemplates.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Active Templates ({activeTemplates.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeTemplates.map((template) => {
                    const isSelected = selectedCustomTemplateId === template.id;
                    return (
                      <Card
                        key={template.id}
                        className={cn(
                          "cursor-pointer transition-all hover-elevate relative",
                          isSelected && "border-primary"
                        )}
                        onClick={() => onSelectCustomTemplate?.(template)}
                        data-testid={`saved-template-${template.id}`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                        
                        <CardHeader className="space-y-1">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-2 bg-gradient-to-br from-primary to-primary/70">
                            <FileText className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg" data-testid={`text-saved-template-name-${template.id}`}>
                              {template.name}
                            </CardTitle>
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          </div>
                          <CardDescription className="text-sm">
                            {template.workflowType !== 'custom' ? template.workflowType.replace(/_/g, ' ') : 'Custom email template'}
                          </CardDescription>
                          {template.updatedAt && (
                            <p className="text-xs text-muted-foreground">
                              Last updated: {new Date(template.updatedAt).toLocaleDateString()}
                            </p>
                          )}
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {draftTemplates.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Draft Templates ({draftTemplates.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {draftTemplates.map((template) => {
                    const isSelected = selectedCustomTemplateId === template.id;
                    return (
                      <Card
                        key={template.id}
                        className={cn(
                          "cursor-pointer transition-all hover-elevate relative",
                          isSelected && "border-primary"
                        )}
                        onClick={() => onSelectCustomTemplate?.(template)}
                        data-testid={`draft-template-${template.id}`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                        
                        <CardHeader className="space-y-1">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-2 bg-gradient-to-br from-slate-500 to-slate-600">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg" data-testid={`text-draft-template-name-${template.id}`}>
                              {template.name}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              Draft
                            </Badge>
                          </div>
                          <CardDescription className="text-sm">
                            {template.workflowType !== 'custom' ? template.workflowType.replace(/_/g, ' ') : 'Custom email template'}
                          </CardDescription>
                          {template.updatedAt && (
                            <p className="text-xs text-muted-foreground">
                              Last updated: {new Date(template.updatedAt).toLocaleDateString()}
                            </p>
                          )}
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No saved templates yet</h3>
            <p className="text-muted-foreground mb-4">
              Create custom email templates using the drag-and-drop builder
            </p>
            <a 
              href="/custom-templates" 
              className="text-primary hover:underline"
              data-testid="link-create-template"
            >
              Go to Template Builder
            </a>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
