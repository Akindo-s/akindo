import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reportes",
    description: "Análisis y reportes de ventas",
};

export default function ReportesDistribuidorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
