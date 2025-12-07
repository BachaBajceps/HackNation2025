import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Funkcja zamiany polskich znaków na ASCII
const transliterate = (text: string): string => {
    const map: Record<string, string> = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
    };
    return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, char => map[char] || char);
};

const formatCurrency = (val: number): string => {
    return val.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' PLN';
};

const formatShortCurrency = (val: number): string => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + ' mln';
    if (val >= 1000) return (val / 1000).toFixed(0) + ' tys';
    return val.toFixed(0);
};

// Kolory dla wykresu kołowego
const chartColors = [
    rgb(0.2, 0.4, 0.8),   // niebieski
    rgb(0.02, 0.6, 0.4),  // zielony
    rgb(0.95, 0.6, 0.1),  // pomarańczowy
    rgb(0.8, 0.2, 0.3),   // czerwony
    rgb(0.5, 0.3, 0.7),   // fioletowy
    rgb(0.2, 0.7, 0.7),   // turkusowy
    rgb(0.9, 0.4, 0.6),   // różowy
    rgb(0.4, 0.4, 0.4),   // szary
];

export async function GET(request: NextRequest) {
    try {
        // 1. Pobieranie danych
        const forms = await prisma.formularz.findMany({
            include: {
                pozycja_budzetu: {
                    include: {
                        zadanie_szczegoly: {
                            include: { dane_finansowe: true }
                        }
                    }
                },
                zadanie_ministerstwo: true
            }
        });

        const ministryTasks = await prisma.zadanie_ministerstwo.findMany();

        // 2. Przetwarzanie danych
        let totalPotrzeby = 0;
        let totalLimit = 0;

        ministryTasks.forEach(t => {
            if (t.kwota) totalLimit += t.kwota;
        });

        const byDept: Record<string, { forms: any[], sum: number }> = {};

        forms.forEach(f => {
            const dept = f.pozycja_budzetu?.nazwa_komorki_organizacyjnej || 'Inne';
            if (!byDept[dept]) byDept[dept] = { forms: [], sum: 0 };
            byDept[dept].forms.push(f);

            const potrzeby = f.pozycja_budzetu?.zadanie_szczegoly?.dane_finansowe?.potrzeby_finansowe || 0;
            byDept[dept].sum += potrzeby;
            totalPotrzeby += potrzeby;
        });

        const totalRoznica = totalLimit - totalPotrzeby;
        const departments = Object.keys(byDept).sort();

        // 3. Tworzenie dokumentu PDF
        const pdfDoc = await PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Kolory
        const primaryColor = rgb(0.15, 0.25, 0.55);
        const greenColor = rgb(0.02, 0.6, 0.4);
        const redColor = rgb(0.86, 0.15, 0.15);
        const grayColor = rgb(0.4, 0.4, 0.4);
        const lightGray = rgb(0.95, 0.95, 0.95);

        // === STRONA 1: Podsumowanie i wykresy ===
        let page = pdfDoc.addPage([595, 842]);
        const { width, height } = page.getSize();

        // Nagłówek
        page.drawRectangle({ x: 0, y: height - 100, width: width, height: 100, color: primaryColor });
        page.drawText('RAPORT BUDZETOWY 2026', { x: 50, y: height - 50, size: 26, font: helveticaBold, color: rgb(1, 1, 1) });
        page.drawText(transliterate(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`), { x: 50, y: height - 75, size: 11, font: helveticaFont, color: rgb(0.8, 0.8, 0.9) });

        // Karty podsumowania (kompaktowe)
        const cardY = height - 150;
        const cardW = 170;

        // Potrzeby
        page.drawRectangle({ x: 50, y: cardY - 45, width: cardW, height: 55, color: lightGray, borderColor: rgb(0.2, 0.4, 0.8), borderWidth: 2 });
        page.drawText('POTRZEBY', { x: 60, y: cardY - 8, size: 9, font: helveticaBold, color: grayColor });
        page.drawText(formatCurrency(totalPotrzeby), { x: 60, y: cardY - 30, size: 13, font: helveticaBold, color: primaryColor });

        // Limit
        page.drawRectangle({ x: 50 + cardW + 15, y: cardY - 45, width: cardW, height: 55, color: lightGray, borderColor: rgb(0.2, 0.4, 0.8), borderWidth: 2 });
        page.drawText('LIMIT', { x: 60 + cardW + 15, y: cardY - 8, size: 9, font: helveticaBold, color: grayColor });
        page.drawText(formatCurrency(totalLimit), { x: 60 + cardW + 15, y: cardY - 30, size: 13, font: helveticaBold, color: primaryColor });

        // Bilans
        const bilansColor = totalRoznica < 0 ? redColor : greenColor;
        page.drawRectangle({ x: 50 + (cardW + 15) * 2, y: cardY - 45, width: cardW, height: 55, color: lightGray, borderColor: bilansColor, borderWidth: 2 });
        page.drawText('BILANS', { x: 60 + (cardW + 15) * 2, y: cardY - 8, size: 9, font: helveticaBold, color: grayColor });
        page.drawText(formatCurrency(totalRoznica), { x: 60 + (cardW + 15) * 2, y: cardY - 30, size: 13, font: helveticaBold, color: bilansColor });

        // === WYKRES KOŁOWY ===
        const pieY = cardY - 200;
        const pieX = 150;
        const pieRadius = 80;

        page.drawText('Rozklad potrzeb wg departamentow', { x: 50, y: pieY + 100, size: 12, font: helveticaBold, color: primaryColor });

        // Rysowanie wykresu kołowego (sektory jako wielokąty)
        if (totalPotrzeby > 0) {
            let startAngle = 0;
            departments.forEach((dept, idx) => {
                const deptData = byDept[dept];
                const percentage = deptData.sum / totalPotrzeby;
                const sweepAngle = percentage * Math.PI * 2;
                const color = chartColors[idx % chartColors.length];

                // Rysuj sektor jako serię trójkątów
                const segments = Math.max(1, Math.ceil(sweepAngle / 0.1));
                for (let i = 0; i < segments; i++) {
                    const a1 = startAngle + (sweepAngle * i / segments);
                    const a2 = startAngle + (sweepAngle * (i + 1) / segments);

                    // Rysuj trójkąt od środka
                    page.drawLine({
                        start: { x: pieX, y: pieY },
                        end: { x: pieX + Math.cos(a1) * pieRadius, y: pieY + Math.sin(a1) * pieRadius },
                        thickness: pieRadius * 0.02,
                        color: color
                    });
                }

                // Wypełnij sektor małymi liniami
                for (let r = 5; r <= pieRadius; r += 2) {
                    const arcSegments = Math.max(2, Math.ceil(sweepAngle * r / 5));
                    for (let i = 0; i < arcSegments; i++) {
                        const a = startAngle + (sweepAngle * i / arcSegments);
                        page.drawCircle({
                            x: pieX + Math.cos(a) * r,
                            y: pieY + Math.sin(a) * r,
                            size: 2,
                            color: color
                        });
                    }
                }

                startAngle += sweepAngle;
            });

            // Legenda wykresu kołowego
            departments.forEach((dept, idx) => {
                const legendY = pieY + 70 - idx * 15;
                const color = chartColors[idx % chartColors.length];
                const percentage = ((byDept[dept].sum / totalPotrzeby) * 100).toFixed(1);

                page.drawRectangle({ x: pieX + pieRadius + 30, y: legendY - 4, width: 10, height: 10, color: color });
                page.drawText(`${transliterate(dept.substring(0, 15))} (${percentage}%)`, {
                    x: pieX + pieRadius + 45, y: legendY, size: 8, font: helveticaFont, color: grayColor
                });
            });
        }

        // === WYKRES SŁUPKOWY ===
        const barY = pieY - 180;
        const barMaxWidth = 200;
        const barHeight = 25;

        page.drawText('Porownanie: Potrzeby vs Limit', { x: 50, y: barY + 80, size: 12, font: helveticaBold, color: primaryColor });

        const maxValue = Math.max(totalPotrzeby, totalLimit) || 1;

        // Słupek Potrzeby
        const potrzebyWidth = (totalPotrzeby / maxValue) * barMaxWidth;
        page.drawRectangle({ x: 150, y: barY + 40, width: potrzebyWidth, height: barHeight, color: rgb(0.2, 0.4, 0.8) });
        page.drawText('Potrzeby', { x: 50, y: barY + 48, size: 10, font: helveticaFont, color: grayColor });
        page.drawText(formatShortCurrency(totalPotrzeby), { x: 155 + potrzebyWidth, y: barY + 48, size: 9, font: helveticaBold, color: primaryColor });

        // Słupek Limit
        const limitWidth = (totalLimit / maxValue) * barMaxWidth;
        page.drawRectangle({ x: 150, y: barY + 5, width: limitWidth, height: barHeight, color: greenColor });
        page.drawText('Limit', { x: 50, y: barY + 13, size: 10, font: helveticaFont, color: grayColor });
        page.drawText(formatShortCurrency(totalLimit), { x: 155 + limitWidth, y: barY + 13, size: 9, font: helveticaBold, color: greenColor });

        // === TABELA DEPARTAMENTÓW (kompaktowa) ===
        const tableY = barY - 50;
        page.drawText('Zestawienie departamentow', { x: 50, y: tableY, size: 12, font: helveticaBold, color: primaryColor });

        // Nagłówki
        let tY = tableY - 25;
        page.drawRectangle({ x: 50, y: tY - 5, width: width - 100, height: 20, color: primaryColor });
        page.drawText('Departament', { x: 55, y: tY, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });
        page.drawText('Formularzy', { x: 250, y: tY, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });
        page.drawText('Suma potrzeb', { x: 330, y: tY, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });
        page.drawText('Udzial', { x: 450, y: tY, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });

        tY -= 20;

        // Wiersze (kompaktowe - tylko podsumowanie per departament)
        departments.slice(0, 10).forEach((dept, idx) => {
            const deptData = byDept[dept];
            const percentage = totalPotrzeby > 0 ? ((deptData.sum / totalPotrzeby) * 100).toFixed(1) : '0';

            if (idx % 2 === 0) {
                page.drawRectangle({ x: 50, y: tY - 5, width: width - 100, height: 18, color: lightGray });
            }

            page.drawText(transliterate(dept.substring(0, 25)), { x: 55, y: tY, size: 9, font: helveticaFont, color: rgb(0.2, 0.2, 0.2) });
            page.drawText(deptData.forms.length.toString(), { x: 270, y: tY, size: 9, font: helveticaFont, color: grayColor });
            page.drawText(formatCurrency(deptData.sum), { x: 330, y: tY, size: 9, font: helveticaFont, color: primaryColor });
            page.drawText(`${percentage}%`, { x: 455, y: tY, size: 9, font: helveticaBold, color: chartColors[idx % chartColors.length] });

            tY -= 18;
        });

        if (departments.length > 10) {
            page.drawText(`... i ${departments.length - 10} wiecej`, { x: 55, y: tY, size: 8, font: helveticaFont, color: grayColor });
        }

        // Stopka
        page.drawText('Dokument wygenerowany automatycznie z systemu BFF', { x: 50, y: 30, size: 8, font: helveticaFont, color: grayColor });

        // Serializacja
        const pdfBytes = await pdfDoc.save();

        return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Raport_Budzetowy_2026_${new Date().toISOString().slice(0, 10)}.pdf"`
            }
        });

    } catch (error) {
        console.error('Blad generowania PDF:', error);
        return NextResponse.json({
            error: 'Wystapil blad podczas generowania raportu: ' + (error instanceof Error ? error.message : String(error))
        }, { status: 500 });
    }
}
