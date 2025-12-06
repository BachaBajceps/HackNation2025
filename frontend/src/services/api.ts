import { WierszBudzetowy } from '../types/budget';

export async function saveBudgetRow(data: WierszBudzetowy): Promise<{ success: boolean; id?: number; error?: string; details?: string }> {
    try {
        const response = await fetch('/api/budzet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.error || 'Błąd podczas zapisywania danych',
                details: result.details,
            };
        }

        return {
            success: true,
            id: result.id,
        };
    } catch (error) {
        return {
            success: false,
            error: 'Błąd połączenia z serwerem',
            details: error instanceof Error ? error.message : String(error),
        };
    }
}
