# Instrukcja Uruchomienia

## 1. Backend (Serwer)
```powershell
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```
*Serwer wystartuje na http://localhost:3000*

## 2. Frontend (Aplikacja)
```powershell
cd frontend
npm install
npm run dev
```
*Aplikacja wystartuje na http://localhost:3001*
