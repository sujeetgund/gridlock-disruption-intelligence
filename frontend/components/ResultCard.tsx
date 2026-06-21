import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Users, ShieldAlert } from "lucide-react";

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
            <span className="text-[12px] text-muted-foreground font-bold uppercase tracking-wider">Operational Severity</span>
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
      </div>
    </div>
  );
}
