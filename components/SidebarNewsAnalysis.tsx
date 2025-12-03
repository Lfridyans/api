
import React from 'react';
import { Sparkles, FileText, AlertTriangle } from 'lucide-react';

interface SidebarNewsAnalysisProps {
    analysis: string | null;
    isLoading: boolean;
}

const SidebarNewsAnalysis: React.FC<SidebarNewsAnalysisProps> = ({ analysis, isLoading }) => {
    return (
        <div className="mx-4 mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    AI Strategic Brief
                </h4>
            </div>

            {isLoading ? (
                <div className="space-y-3 animate-pulse">
                    <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                    <div className="space-y-1.5">
                        <div className="h-2 bg-slate-200 rounded w-full"></div>
                        <div className="h-2 bg-slate-200 rounded w-full"></div>
                        <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                    </div>
                    <div className="h-2 bg-slate-200 rounded w-1/2 pt-2"></div>
                </div>
            ) : analysis ? (
                <div 
                    className="text-[10px] text-slate-600 leading-relaxed font-medium [&>h4]:font-bold [&>h4]:text-indigo-800 [&>h4]:mb-1 [&>h4]:mt-2 [&>h4:first-child]:mt-0 [&>ul]:pl-3 [&>ul]:list-disc [&>ul]:mb-2 [&>p]:mb-2 [&>strong]:text-slate-800"
                    dangerouslySetInnerHTML={{ __html: analysis }}
                />
            ) : (
                <div className="text-center py-4 opacity-50">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-[10px] text-slate-400">
                        Scan events to generate intelligence brief.
                    </p>
                </div>
            )}
            
            {!isLoading && analysis && (
                 <div className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[9px] text-slate-400">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    <span>AI Analysis based on detected signals</span>
                 </div>
            )}
        </div>
    );
};

export default SidebarNewsAnalysis;
