"use server";

import {
    ShieldCheck,
    Users,
    Star,
    ArrowRight,
    Globe,
    Handshake,
    TrendingUp,
} from "lucide-react";

// Componentes de la app
import { Titulo, SubTitulo, Parrafo } from "@/components/titles";
import { Boton } from "@/components/ui/Boton";
import { Badge } from "@/components/ui/Badge";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Revelar } from "@/components/ui/Revelar";

// ── Configuración de Contenido (Editable) ────────────────────────────────────

const CONTENT = {
    hero: {
        badge: "{inserte subtitulo}",
        titulo: "{inserte título principal}",
        descripcion: "{lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.}",
        ctaPrincipal: "explora el mercado",
        ctaSecundario: "registrate como vendedor"
    },
    stats: [
        { valor: "{000+}", etiqueta: "{inserte etiqueta}" },
        { valor: "{000+}", etiqueta: "{inserte etiqueta}" },
        { valor: "{000%}", etiqueta: "{inserte etiqueta}" },
        { valor: "{0}", etiqueta: "{inserte etiqueta}" },
    ],
    mision: {
        badge: "{inserte badge}",
        titulo: "Mision de Akindo",
        descripcion: "{lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.}"
    },
    valores: {
        badge: "(si tenemos lo juro)",
        titulo: "Los Akindo valores",
        items: [
            {
                Icono: ShieldCheck,
                titulo: "{inserte título}",
                descripcion: "{lorem ipsum dolor sit amet.}"
            },
            {
                Icono: Handshake,
                titulo: "{inserte título}",
                descripcion: "{lorem ipsum dolor sit amet.}"
            },
            {
                Icono: TrendingUp,
                titulo: "{inserte título}",
                descripcion: "{lorem ipsum dolor sit amet.}"
            },
            {
                Icono: Globe,
                titulo: "{inserte título}",
                descripcion: "{lorem ipsum dolor sit amet.}"
            }
        ]
    },
    proceso: {
        badge: "{inserte badge}",
        titulo: "Como se usa Akindo",
        pasos: [
            {
                numero: "01",
                titulo: "{inserte paso}",
                descripcion: "{lorem ipsum dolor sit amet.}"
            },
            {
                numero: "02",
                titulo: "{inserte paso}",
                descripcion: "{lorem ipsum dolor sit amet.}"
            },
            {
                numero: "03",
                titulo: "{inserte paso}",
                descripcion: "{lorem ipsum dolor sit amet.}"
            }
        ]
    },
    equipo: {
        badge: "{inserte badge}",
        titulo: "Akindo Miembros",
        placeholderTitle: "{inserte título de sección equipo}",
        placeholderDesc: "{lorem ipsum dolor sit amet, consectetur adipiscing elit.}"
    },
    testimonios: {
        badge: "{inserte badge}",
        titulo: "Testimonios de Akindo",
        items: [
            {
                estrellas: 2,
                nombre: "Maria",
                rol: "la del barrio",
                comentario: "Desde que uso akindo no tengo ganas de atropellar a la gente que cruza a medio bulevar. Es horrible..."
            },
            {
                estrellas: 5,

                nombre: "{nombre}",
                rol: "{rol}",
                comentario: "{lorem ipsum dolor sit amet, consectetur adipiscing elit.}"
            },
            {
                estrellas: 5,

                nombre: "{nombre}",
                rol: "{rol}",
                comentario: "{lorem ipsum dolor sit amet, consectetur adipiscing elit.}"
            }
        ]
    },
    ctaFinal: {
        titulo: "{inserte título final}",
        descripcion: "{lorem ipsum dolor sit amet, consectetur adipiscing elit.}",
        ctaPrincipal: "explora el mercado",
        ctaSecundario: "registrate"
    }
};

// ── Componente Principal ─────────────────────────────────────────────────────

export default async function SobreNosotrosPage() {
    return (
        <div className="flex flex-col min-h-screen bg-[#FAF5EE]">

            {/* Hero */}
            <section className="relative overflow-hidden bg-[#1C1C1C] px-6 py-24 md:py-32 flex flex-col items-center text-center gap-6">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #DAA520 0%, transparent 60%), radial-gradient(circle at 80% 20%, #DAA520 0%, transparent 50%)" }} />

                <Revelar delay={100}>
                    <Badge variante="oro" className="relative z-10 border-[#DAA520]/40 text-[#DAA520] bg-[#DAA520]/20">
                        {CONTENT.hero.badge}
                    </Badge>
                </Revelar>

                <Revelar delay={300}>
                    <Titulo className="relative z-10 text-3xl md:text-5xl text-white leading-tight max-w-2xl">
                        {CONTENT.hero.titulo}
                    </Titulo>
                </Revelar>

                <Revelar delay={500}>
                    <Parrafo className="relative z-10 text-stone-400 text-sm md:text-base leading-relaxed max-w-xl">
                        {CONTENT.hero.descripcion}
                    </Parrafo>
                </Revelar>

                <Revelar delay={700} direccion="abajo">
                    <div className="relative z-10 flex flex-wrap gap-3 justify-center mt-2">
                        <Boton href="/mercado" className="px-6 py-3 rounded-xl shadow-lg hover:shadow-[#DAA520]/30">
                            <ArrowRight />
                            {CONTENT.hero.ctaPrincipal}
                        </Boton>
                        <Boton href="/auth/registro" variante="secundario" className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10">
                            {CONTENT.hero.ctaSecundario}
                        </Boton>
                    </div>
                </Revelar>
            </section>

            {/* Stats */}
            <section className="bg-[#F8EED9] border-y border-[#E8DEC1]">
                <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {CONTENT.stats.map((stat, i) => (
                        <Revelar key={i} delay={i * 100} direccion="abajo">
                            <div className="flex flex-col items-center text-center gap-1">
                                <span className="text-3xl font-extrabold text-[#1C1C1C]">{stat.valor}</span>
                                <span className="text-xs text-[#8B7355] font-medium uppercase tracking-wider">{stat.etiqueta}</span>
                            </div>
                        </Revelar>
                    ))}
                </div>
            </section>

            {/* Misión */}
            <section className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center gap-6">
                <Revelar>
                    <Badge variante="oro">{CONTENT.mision.badge}</Badge>
                </Revelar>
                <Revelar delay={200}>
                    <Titulo className="max-w-2xl leading-snug">{CONTENT.mision.titulo}</Titulo>
                </Revelar>
                <Revelar delay={400}>
                    <Parrafo className="text-sm leading-relaxed max-w-xl">{CONTENT.mision.descripcion}</Parrafo>
                </Revelar>
                <Revelar delay={600} className="w-16 h-1 rounded-full bg-[#DAA520] mt-2" />
            </section>

            {/* Valores */}
            <section className="bg-white border-y border-stone-100">
                <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col gap-10">
                    <div className="flex flex-col items-center text-center gap-2">
                        <Revelar>
                            <Badge variante="oro">{CONTENT.valores.badge}</Badge>
                        </Revelar>
                        <Revelar delay={200}>
                            <Titulo>{CONTENT.valores.titulo}</Titulo>
                        </Revelar>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {CONTENT.valores.items.map((item, i) => (
                            <Revelar key={i} delay={i * 150}>
                                <Tarjeta className="flex flex-col gap-3 h-full hover:shadow-md transition-shadow bg-[#FAF7F2]">
                                    <div className="w-10 h-10 rounded-xl bg-[#F8EED9] flex items-center justify-center">
                                        <item.Icono size={20} className="text-[#DAA520]" />
                                    </div>
                                    <SubTitulo className="font-bold text-stone-900">{item.titulo}</SubTitulo>
                                    <Parrafo>{item.descripcion}</Parrafo>
                                </Tarjeta>
                            </Revelar>
                        ))}
                    </div>
                </div>
            </section>

            {/* Proceso */}
            <section className="max-w-5xl mx-auto px-6 py-20 flex flex-col gap-10">
                <div className="flex flex-col items-center text-center gap-2">
                    <Revelar>
                        <Badge variante="oro">{CONTENT.proceso.badge}</Badge>
                    </Revelar>
                    <Revelar delay={200}>
                        <Titulo>{CONTENT.proceso.titulo}</Titulo>
                    </Revelar>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {CONTENT.proceso.pasos.map((paso, i) => (
                        <Revelar key={i} delay={i * 200} direccion="izquierda">
                            <div className="flex flex-col gap-4 relative">
                                <span className="text-5xl font-black text-[#E8DEC1] leading-none select-none">{paso.numero}</span>
                                <div className="flex flex-col gap-2">
                                    <SubTitulo className="font-bold text-stone-900">{paso.titulo}</SubTitulo>
                                    <Parrafo>{paso.descripcion}</Parrafo>
                                </div>
                            </div>
                        </Revelar>
                    ))}
                </div>
            </section>

            {/* Equipo */}
            <section className="bg-[#F8EED9] border-y border-[#E8DEC1]">
                <div className="max-w-3xl mx-auto px-6 py-20 flex flex-col items-center text-center gap-6">
                    <Revelar>
                        <Badge variante="oro">{CONTENT.equipo.badge}</Badge>
                    </Revelar>
                    <Revelar delay={200}>
                        <Titulo>{CONTENT.equipo.titulo}</Titulo>
                    </Revelar>
                    <Revelar delay={400} className="w-full">
                        <div className="w-full rounded-2xl border-2 border-dashed border-[#DAA520]/50 bg-white/60 p-10 flex flex-col items-center gap-3">
                            <Users size={32} className="text-[#DAA520]/60" />
                            <Parrafo className="text-stone-400 font-medium">{CONTENT.equipo.placeholderTitle}</Parrafo>
                            <Parrafo className="text-stone-300">{CONTENT.equipo.placeholderDesc}</Parrafo>
                        </div>
                    </Revelar>
                </div>
            </section>

            {/* Testimonios */}
            <section className="max-w-5xl mx-auto px-6 py-20 flex flex-col gap-10">
                <div className="flex flex-col items-center text-center gap-2">
                    <Revelar>
                        <Badge variante="oro">{CONTENT.testimonios.badge}</Badge>
                    </Revelar>
                    <Revelar delay={200}>
                        <Titulo>{CONTENT.testimonios.titulo}</Titulo>
                    </Revelar>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {CONTENT.testimonios.items.map((test, i) => (
                        <Revelar key={i} delay={i * 150} direccion="derecha">
                            <Tarjeta className="flex flex-col gap-4 h-full">
                                <div className="flex gap-0.5">
                                    {[...Array(test.estrellas)].map((_, s) => <Star key={s} size={12} className="text-[#DAA520] fill-[#DAA520]" />)}
                                </div>
                                <Parrafo className="italic leading-relaxed">"{test.comentario}"</Parrafo>
                                <div className="flex items-center gap-2 mt-auto">
                                    <div className="w-7 h-7 rounded-full bg-[#E8DEC1] flex items-center justify-center text-[#8B7355] text-xs font-bold">{test.nombre[1]}</div>
                                    <div>
                                        <SubTitulo className="font-bold text-stone-900 leading-none">{test.nombre}</SubTitulo>
                                        <Parrafo className="text-stone-400">{test.rol}</Parrafo>
                                    </div>
                                </div>
                            </Tarjeta>
                        </Revelar>
                    ))}
                </div>
            </section>

            {/* CTA Final */}

            <section className="bg-[#1C1C1C] px-6 py-20 flex flex-col items-center text-center gap-6">
                <Titulo className="text-white max-w-lg leading-snug">{CONTENT.ctaFinal.titulo}</Titulo>
                <Parrafo className="text-stone-400 text-sm max-w-md">{CONTENT.ctaFinal.descripcion}</Parrafo>
                <div className="flex flex-wrap gap-3 justify-center">
                    <Boton href="/mercado" className="px-7 py-3 rounded-xl shadow-lg hover:shadow-[#DAA520]/30">
                        <ArrowRight />
                        {CONTENT.ctaFinal.ctaPrincipal}
                    </Boton>
                    <Boton href="/registro/distribuidor" variante="secundario" className="px-7 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10">
                        {CONTENT.ctaFinal.ctaSecundario}
                    </Boton>
                </div>
            </section>

        </div>
    );
}
