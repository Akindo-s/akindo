import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Distribuidores",
    description: "Encuentra proveedores mayoristas verificados",
};

export default function DistribuidoresLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
