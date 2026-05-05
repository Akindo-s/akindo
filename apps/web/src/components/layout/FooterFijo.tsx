import { ReactNode } from "react";

export default function FooterFijo({ children,className }: { children: ReactNode,className?:string }) {
    return (
        <footer className={`z-50 fixed bottom-0 left-0 right-0 md:left-56 lg:left-64 bg-white border-t border-stone-100 px-4 py-3 flex gap-3 max-w-2xl lg:max-w-6xl mx-auto shadow-[0_-4px_12px_rgba(0,0,0,0.06)] ${className}`}>
            {children}
        </footer>
    )
}