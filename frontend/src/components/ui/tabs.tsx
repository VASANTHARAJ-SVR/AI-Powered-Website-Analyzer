import * as React from "react"
// import * as TabsPrimitive from "@radix-ui/react-tabs" // Removed unused import to fix build error
import { cn } from "../../utils/cn"

// Since I didn't install radix-tabs, I'll implement a simple version or just assume standard divs for now in the dashboard
// But for completeness, I should have installed it. I will mock it here with simple divs/states if needed,
// but the dashboard implementation I wrote above used custom divs for tabs to avoid complexity for now.
// I'll keep this file empty or just a placeholder if I decide to use the installed version later.
// Actually, I can just export simple components that mimic the behavior with context if I really wanted to,
// but for now I'll skip this file and let the Dashboard use the inline tabs I wrote (which I actually didn't write fully inline, I referenced them).

// Wait, I referenced `../components/ui/tabs` in `AnalyzerDashboard.tsx`.
// So I MUST create this file. I'll implement a simple React context based tabs system here to avoid dependency.

const TabsContext = React.createContext<{ activeTab: string; setActiveTab: (v: string) => void } | null>(null);

export const Tabs = ({ defaultValue, children, className }: any) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue);
    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={cn("", className)}>{children}</div>
        </TabsContext.Provider>
    );
};

export const TabsList = ({ children, className }: any) => (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 p-1 text-zinc-500", className)}>
        {children}
    </div>
);

export const TabsTrigger = ({ value, children, className }: any) => {
    const ctx = React.useContext(TabsContext);
    if (!ctx) throw new Error("TabsTrigger must be used within Tabs");
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                ctx.activeTab === value ? "bg-white text-zinc-950 shadow-sm" : "hover:bg-zinc-200/50 hover:text-zinc-900",
                className
            )}
            onClick={() => ctx.setActiveTab(value)}
        >
            {children}
        </button>
    );
};

export const TabsContent = ({ value, children, className }: any) => {
    const ctx = React.useContext(TabsContext);
    if (!ctx) throw new Error("TabsContent must be used within Tabs");
    if (ctx.activeTab !== value) return null;
    return (
        <div className={cn("mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2", className)}>
            {children}
        </div>
    );
};
