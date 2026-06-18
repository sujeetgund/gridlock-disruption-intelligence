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
}

export default function ResultCard({ result }: { result: PredictResponse }) {
  if (!result) return null;

  // Derive visual class for the primary badge based on bucket
  const getBadgeVariant = (bucket: string) => {
    switch(bucket) {
      case "Critical": return "bg-red-600 hover:bg-red-700 text-white border-red-600";
      case "High": return "bg-orange-500 hover:bg-orange-600 text-white border-orange-500";
      case "Medium": return "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500";
      case "Low": return "bg-green-500 hover:bg-green-600 text-white border-green-500";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <Card className="w-full shadow-md border-primary/10">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          Recommended Response
        </CardTitle>
        <CardDescription>
          Based on historical corridor metrics and event type precedence.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        
        {/* Precedence UI: Strict visual hierarchy */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
          {/* Primary Badge */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Operational Severity</span>
            <Badge variant="outline" className={`text-xl px-4 py-1.5 shadow-sm ${getBadgeVariant(result.display_severity_bucket)}`}>
              {result.display_severity_bucket}
            </Badge>
          </div>
          
          {/* Secondary Badge (Model Read) */}
          <div className="flex flex-col gap-1 mt-2 md:mt-0 md:ml-auto md:items-end">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {!result.model_confidence.reliable && <AlertCircle className="w-3 h-3 text-amber-500" />}
              Model's directional read
            </span>
            <Badge variant="secondary" className="text-xs font-normal opacity-70">
              {result.ml_severity_bucket} (Low Confidence)
            </Badge>
          </div>
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-muted">
            <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <div className="text-sm font-medium">Clearance Time</div>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">
                {result.predicted_duration_hours} <span className="text-sm font-normal text-muted-foreground">hrs median</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-muted">
            <Users className="w-5 h-5 text-indigo-500 mt-0.5" />
            <div>
              <div className="text-sm font-medium">Deployment</div>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">
                {result.recommended_officers} <span className="text-sm font-normal text-muted-foreground">officers base</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diversion Alert */}
        {result.diversion_required && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-md flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Traffic Diversion Recommended
          </div>
        )}
      </CardContent>
    </Card>
  );
}
