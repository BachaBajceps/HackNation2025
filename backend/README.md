# Backend - System Planowania Budżetu

## Wymagania
- Node.js
- npm

## Instalacja

1. Zainstaluj zależności:
```bash
npm install
```

## Baza Danych (SQLite)

Baza danych `dev.db` jest lokalną bazą SQLite. Aby ją zainicjalizować i wypełnić danymi słownikowymi, wykonaj poniższe kroki.

**Kroki naprawcze / Inicjalizacja od zera:**

1. Skonfiguruj schemat bazy (tworzy tabele):
```bash
npx prisma db push
```

2. Załaduj dane początkowe (słowniki, części budżetowe, klasyfikację):
```bash
npm run seed
```

Po wykonaniu tych kroków baza `dev.db` powinna zawierać wszystkie niezbędne tabele oraz dane słownikowe.

Możesz zweryfikować poprawność instalacji skryptem:
```bash
npx tsx check_db.ts
```

## Uruchomienie serwera

```bash
npm run dev
```
Serwer backendu wystartuje na porcie (domyślnie 3000 lub innym skonfigurowanym).

## Struktura projektu
- `/prisma` - schemat bazy danych i skrypt seedujący
- `/src` - kod źródłowy aplikacji (Next.js App Router)
- `/scripts` - dodatkowe skrypty narzędziowe
