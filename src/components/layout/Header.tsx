import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { cn } from "@/utils/cn";

interface HeaderProps {
  online: boolean;
}

export function Header({ online }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl">
             <ChartNoAxesColumnIncreasing />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-slate-900 sm:text-lg">
              BI - DESEMPENHO DOS TERCEIROS
            </h1>
            <p className="hidden text-xs text-slate-500 sm:block">
              Análise para apoiar a escolha do melhor terceiro para cada
              produção
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
              online
                ? "bg-success-100 text-success-700"
                : "bg-danger-100 text-danger-700",
            )}
            role="status"
            aria-label={online ? "API online" : "API offline"}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                online ? "bg-success-500" : "bg-danger-500",
                online && "animate-pulse",
              )}
            />
            {online ? "Online" : "Offline"}
          </div>

          <div className="flex items-center gap-2"></div>
        </div>
      </div>
    </header>
  );
}
