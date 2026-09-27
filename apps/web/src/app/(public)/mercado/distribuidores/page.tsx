import { Suspense } from "react";
import Distribuidores from "@akindo/ui/screens/distribuidores";

export default function DistribuidoresPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" /></div>}>
            <Distribuidores />
        </Suspense>
    );
}
