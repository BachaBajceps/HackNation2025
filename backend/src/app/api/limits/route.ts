
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LimitInput, LimitDTO, OdpowiedzAPI } from "@/lib/types/limits";

// GET: Pobierz limity (filtr po roku i opcjonalnie departamencie)
// Query: ?rok=2026&dept=DA
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const rok = searchParams.get('rok');
        const dept = searchParams.get('dept');

        if (!rok) {
            return NextResponse.json(
                { sukces: false, blad: "Wymagany parametr rok" } as OdpowiedzAPI<null>,
                { status: 400 }
            );
        }

        const where: any = { rok_budzetowy: parseInt(rok) };
        if (dept) where.kod_departamentu = dept;

        const limity = await prisma.limit_wydatkow.findMany({
            where: where
        });

        const dtos: LimitDTO[] = limity.map(l => ({
            id: l.id,
            rokBudzetowy: l.rok_budzetowy,
            kodDepartamentu: l.kod_departamentu,
            dzialKod: l.dzial_kod,
            rozdzialKod: l.rozdzial_kod,
            grupaWydatkow: l.grupa_wydatkow,
            kwota: l.kwota
        }));

        return NextResponse.json({ sukces: true, dane: dtos } as OdpowiedzAPI<LimitDTO[]>);
    } catch (error) {
        console.error("Błąd pobierania limitów:", error);
        return NextResponse.json(
            { sukces: false, blad: "Nie udało się pobrać limitów" } as OdpowiedzAPI<null>,
            { status: 500 }
        );
    }
}

// POST: Ustaw limit (Upsert)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as LimitInput;

        if (!body.rokBudzetowy || !body.kodDepartamentu || !body.dzialKod || !body.rozdzialKod || !body.grupaWydatkow) {
            return NextResponse.json(
                { sukces: false, blad: "Wszystkie pola są wymagane" } as OdpowiedzAPI<null>,
                { status: 400 }
            );
        }

        // Upsert limit
        const limit = await prisma.limit_wydatkow.upsert({
            where: {
                unique_limit_rok: {
                    rok_budzetowy: body.rokBudzetowy,
                    kod_departamentu: body.kodDepartamentu,
                    dzial_kod: body.dzialKod,
                    rozdzial_kod: body.rozdzialKod,
                    grupa_wydatkow: body.grupaWydatkow
                }
            },
            update: {
                kwota: body.kwota
            },
            create: {
                rok_budzetowy: body.rokBudzetowy,
                kod_departamentu: body.kodDepartamentu,
                dzial_kod: body.dzialKod,
                rozdzial_kod: body.rozdzialKod,
                grupa_wydatkow: body.grupaWydatkow,
                kwota: body.kwota
            }
        });

        const dto: LimitDTO = {
            id: limit.id,
            rokBudzetowy: limit.rok_budzetowy,
            kodDepartamentu: limit.kod_departamentu,
            dzialKod: limit.dzial_kod,
            rozdzialKod: limit.rozdzial_kod,
            grupaWydatkow: limit.grupa_wydatkow,
            kwota: limit.kwota
        };

        return NextResponse.json({ sukces: true, dane: dto } as OdpowiedzAPI<LimitDTO>);
    } catch (error) {
        console.error("Błąd zapisywania limitu:", error);
        return NextResponse.json(
            { sukces: false, blad: "Nie udało się zapisać limitu" } as OdpowiedzAPI<null>,
            { status: 500 }
        );
    }
}
