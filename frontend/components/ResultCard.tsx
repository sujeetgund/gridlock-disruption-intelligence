import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Users, ShieldAlert, BarChart3, HelpCircle } from "lucide-react";

interface PredictResponse {
  display_severity_bucket: string;
  ml_severity_bucket: string;
  predicted_duration_hours: number;
  recommended_officers: number;
  diversion_required: boolean;
  model_confidence: {
    reliable: boolean;
    reason: string;
  };
  fallback_status: string;
  predicted_bucket: string;
  predicted_score: number;
  predictive_factors: Record<string, any>;
  ml_importances: Record<string, number>;
}

function formatDuration(hours: number) {
  if (hours < 1) {
    return `${Math.round(hours * 60)} mins`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h} hr${h > 1 ? 's' : ''}`;
  return `${h} hr${h > 1 ? 's' : ''} ${m} mins`;
}

// Pretty print ML feature names
function formatFeatureName(name: string) {
  return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export default function ResultCard({ result }: { result: PredictResponse }) {
  if (!result) return null;

  // Derive visual class for the primary badge based on bucket
  const getBadgeVariant = (bucket: string) => {
    switch(bucket) {
      case "Critical": return "bg-[#e51716] text-white";
      case "High": return "bg-[#ea0201] text-white";
      case "Medium": return "bg-[#31313b] text-white";
      case "Low": return "bg-[#1f7f51] text-white";
      default: return "bg-[#71717a] text-white";
    }
  };

  // Sort and format ML importances for top 3
  const topMlFeatures = Object.entries(result.ml_importances || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, val]) => ({ name: formatFeatureName(key), pct: (val * 100).toFixed(1) }));

  const priorityWeight = 57.14;
  const corridorWeight = 42.86;
  const priorityScore = (result.predictive_factors?.priority_component || 0) * priorityWeight;
  const corridorScore = (result.predictive_factors?.corridor_frequency_component || 0) * corridorWeight;

  return (
    <div className="bi-card p-0 flex flex-col h-full bg-[#fafafa]">
      <div className="pb-4 border-b border-border p-6 bg-background">
        <h3 className="text-[20px] font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          Recommended Response
        </h3>
        <p className="text-[14px] text-muted-foreground mt-1">
          Based on historical corridor metrics and event type precedence.
        </p>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        
        {/* Precedence UI: Strict visual hierarchy */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
          {/* Primary Badge */}
          <div className="flex flex-col gap-1">
            <span className="text-[12px] text-muted-foreground font-bold uppercase tracking-wider">
              Operational Severity <span className="font-normal normal-case">(Historical Baseline)</span>
            </span>
            <span className={`inline-flex items-center px-4 py-1.5 rounded-[2px] font-serif text-[16px] font-bold ${getBadgeVariant(result.display_severity_bucket)}`}>
              {result.display_severity_bucket}
            </span>
          </div>
          
          {/* Secondary Badge (Model Read) */}
          <div className="flex flex-col gap-1 mt-2 md:mt-0 md:ml-auto md:items-end">
            <span className="text-[12px] text-muted-foreground flex items-center gap-1">
              {!result.model_confidence.reliable && <AlertCircle className="w-3 h-3 text-[#e51716]" />}
              Model's directional read
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-[2px] font-serif text-[12px] bg-muted text-muted-foreground border border-border">
              {result.ml_severity_bucket} (Low Confidence)
            </span>
          </div>
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-[2px] bg-background border border-border">
            <Clock className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <div className="text-[14px] font-bold">Clearance Time</div>
              <div className="text-[24px] font-bold text-foreground mt-1 leading-none">
                {formatDuration(result.predicted_duration_hours)} <span className="text-[14px] font-normal text-muted-foreground">median</span>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground leading-tight max-w-[200px]">
                {result.fallback_status}
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 rounded-[2px] bg-background border border-border">
            <Users className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <div className="text-[14px] font-bold">Deployment</div>
              <div className="text-[24px] font-bold text-foreground mt-1 leading-none">
                {result.recommended_officers} <span className="text-[14px] font-normal text-muted-foreground">officers base</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diversion Alert */}
        {result.diversion_required && (
          <div className="mt-6 p-4 bg-[#e51716]/10 border border-[#e51716]/20 text-[#e51716] rounded-[2px] flex items-center gap-2 text-[14px] font-bold">
            <AlertCircle className="w-4 h-4" />
            Traffic Diversion Recommended
          </div>
        )}

        {/* Phase 4: Explainability Panel */}
        <div className="mt-auto pt-8">
          <div className="border-t border-border pt-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-[14px] font-bold text-foreground">Explainability Breakdown</h4>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Rule-Based Factors */}
              <div className="bg-background border border-border rounded-[2px] p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Report-Time Predictive Score (Secondary)</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-[2px] ${getBadgeVariant(result.predicted_bucket)}`}>
                    {result.predicted_bucket}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-foreground font-medium">Priority <span className="text-muted-foreground text-[10px] ml-1">(Weight: 57.14%)</span></span>
                      <span className="font-serif">+{priorityScore.toFixed(2)} pts</span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden flex">
                      <div className="bg-foreground h-full" style={{ width: `${(priorityScore / result.predicted_score) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-foreground font-medium">Corridor Freq <span className="text-muted-foreground text-[10px] ml-1">(Weight: 42.86%)</span></span>
                      <span className="font-serif">+{corridorScore.toFixed(2)} pts</span>
                    </div>
                    {result.predictive_factors?.corridor_lookup_miss ? (
                      <div className="w-full bg-[#ea0201]/10 text-[#ea0201] text-[10px] p-1.5 rounded-[2px] font-bold border border-[#ea0201]/20 mt-1">
                        Corridor not recognized in lookup table — frequency defaulted to 0.0
                      </div>
                    ) : (
                      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden flex">
                        <div className="bg-muted-foreground h-full" style={{ width: `${(corridorScore / result.predicted_score) * 100}%` }}></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between border-t border-border pt-2 mt-2 text-[12px] font-bold">
                    <span>Total Raw Score</span>
                    <span className="font-serif text-[14px]">{result.predicted_score.toFixed(2)} / 100</span>
                  </div>
                </div>
              </div>

              {/* ML Global Importances */}
              <div className="bg-muted/30 border border-dashed border-border rounded-[2px] p-4 flex flex-col justify-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  Most influential features across the model overall (Low Confidence)
                </span>
                <div className="space-y-2">
                  {topMlFeatures.map((feat, i) => (
                    <div key={i} className="flex justify-between items-center text-[12px]">
                      <span className="text-muted-foreground">{i + 1}. {feat.name}</span>
                      <span className="font-serif text-muted-foreground">{feat.pct}%</span>
                    </div>
                  ))}
                  {topMlFeatures.length === 0 && (
                    <div className="text-[12px] text-muted-foreground italic">No ML importances available.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
