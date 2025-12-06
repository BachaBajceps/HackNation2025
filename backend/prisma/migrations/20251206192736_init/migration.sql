-- CreateTable
CREATE TABLE "budzet_zadaniowy_skrocony" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kod" TEXT NOT NULL,
    "funkcja" TEXT NOT NULL,
    "zadanie" TEXT NOT NULL,
    "nazwa" TEXT
);

-- CreateTable
CREATE TABLE "budzet_zadaniowy_szczegolowy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kod" TEXT NOT NULL,
    "budzet_skrocony_id" INTEGER NOT NULL,
    "podzadanie" TEXT,
    "dzialanie" TEXT,
    "nazwa" TEXT,
    CONSTRAINT "budzet_zadaniowy_szczegolowy_budzet_skrocony_id_fkey" FOREIGN KEY ("budzet_skrocony_id") REFERENCES "budzet_zadaniowy_skrocony" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "czesc_budzetowa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kod" TEXT NOT NULL,
    "nazwa" TEXT
);

-- CreateTable
CREATE TABLE "dane_finansowe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rok" INTEGER NOT NULL,
    "potrzeby_finansowe" REAL,
    "limit_wydatkow" REAL,
    "kwota_niezabezpieczona" REAL,
    "kwota_umowy" REAL,
    "nr_umowy" TEXT
);

-- CreateTable
CREATE TABLE "dzial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kod" TEXT NOT NULL,
    "nazwa" TEXT
);

-- CreateTable
CREATE TABLE "formularz" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pozycja_budzetu_id" INTEGER NOT NULL,
    "data_utworzenia" DATETIME,
    "data_przeslania" DATETIME,
    "status" TEXT,
    CONSTRAINT "formularz_pozycja_budzetu_id_fkey" FOREIGN KEY ("pozycja_budzetu_id") REFERENCES "pozycja_budzetu" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "grupa_wydatkow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nazwa" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ograniczenie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "komorka_organizacyjna" TEXT,
    "dzial" TEXT,
    "rozdzial" TEXT,
    "paragraf" TEXT,
    "czesc_budzetowa" TEXT
);

-- CreateTable
CREATE TABLE "opis_zadania" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nazwa_zadania" TEXT NOT NULL,
    "uzasadnienie" TEXT,
    "przeznaczenie_wydatkow" TEXT,
    "dotacja_partner" TEXT,
    "dotacja_podstawa_prawna" TEXT,
    "uwagi" TEXT
);

-- CreateTable
CREATE TABLE "paragraf" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kod" TEXT NOT NULL,
    "nazwa" TEXT
);

-- CreateTable
CREATE TABLE "pozycja_budzetu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "zadanie_szczegoly_id" INTEGER,
    "czesc_budzetowa_id" INTEGER NOT NULL,
    "dzial_id" INTEGER,
    "rozdzial_id" INTEGER,
    "paragraf_id" INTEGER,
    "zrodlo_finansowania_id" INTEGER,
    "grupa_wydatkow_id" INTEGER,
    "budzet_zadaniowy_szczegolowy_id" INTEGER,
    "budzet_zadaniowy_skrocony_id" INTEGER,
    "nazwa_programu_projektu" TEXT,
    "nazwa_komorki_organizacyjnej" TEXT,
    "plan_wi" TEXT,
    "dysponent_srodkow" TEXT,
    "budzet" TEXT,
    CONSTRAINT "pozycja_budzetu_budzet_zadaniowy_skrocony_id_fkey" FOREIGN KEY ("budzet_zadaniowy_skrocony_id") REFERENCES "budzet_zadaniowy_skrocony" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "pozycja_budzetu_budzet_zadaniowy_szczegolowy_id_fkey" FOREIGN KEY ("budzet_zadaniowy_szczegolowy_id") REFERENCES "budzet_zadaniowy_szczegolowy" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "pozycja_budzetu_grupa_wydatkow_id_fkey" FOREIGN KEY ("grupa_wydatkow_id") REFERENCES "grupa_wydatkow" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "pozycja_budzetu_zrodlo_finansowania_id_fkey" FOREIGN KEY ("zrodlo_finansowania_id") REFERENCES "zrodlo_finansowania" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "pozycja_budzetu_paragraf_id_fkey" FOREIGN KEY ("paragraf_id") REFERENCES "paragraf" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "pozycja_budzetu_rozdzial_id_fkey" FOREIGN KEY ("rozdzial_id") REFERENCES "rozdzial" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "pozycja_budzetu_dzial_id_fkey" FOREIGN KEY ("dzial_id") REFERENCES "dzial" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "pozycja_budzetu_czesc_budzetowa_id_fkey" FOREIGN KEY ("czesc_budzetowa_id") REFERENCES "czesc_budzetowa" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "pozycja_budzetu_zadanie_szczegoly_id_fkey" FOREIGN KEY ("zadanie_szczegoly_id") REFERENCES "zadanie_szczegoly" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "rozdzial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kod" TEXT NOT NULL,
    "dzial_id" INTEGER,
    "nazwa" TEXT,
    CONSTRAINT "rozdzial_dzial_id_fkey" FOREIGN KEY ("dzial_id") REFERENCES "dzial" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "zadanie_ministerstwo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "formularz_id" INTEGER,
    "ograniczenie_id" INTEGER,
    "termin_do" DATETIME,
    "rok_budzetu" INTEGER,
    "stan" TEXT,
    "data_utworzenia" DATETIME,
    CONSTRAINT "zadanie_ministerstwo_ograniczenie_id_fkey" FOREIGN KEY ("ograniczenie_id") REFERENCES "ograniczenie" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "zadanie_ministerstwo_formularz_id_fkey" FOREIGN KEY ("formularz_id") REFERENCES "formularz" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "zadanie_szczegoly" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "opis_zadania_id" INTEGER,
    "dane_finansowe_id" INTEGER,
    CONSTRAINT "zadanie_szczegoly_dane_finansowe_id_fkey" FOREIGN KEY ("dane_finansowe_id") REFERENCES "dane_finansowe" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "zadanie_szczegoly_opis_zadania_id_fkey" FOREIGN KEY ("opis_zadania_id") REFERENCES "opis_zadania" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "zrodlo_finansowania" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kod" TEXT NOT NULL,
    "nazwa" TEXT
);

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_budzet_zadaniowy_skrocony_1" ON "budzet_zadaniowy_skrocony"("kod");
Pragma writable_schema=0;

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_budzet_zadaniowy_szczegolowy_1" ON "budzet_zadaniowy_szczegolowy"("kod");
Pragma writable_schema=0;

-- CreateIndex
CREATE INDEX "idx_bz_szcz_skrocony" ON "budzet_zadaniowy_szczegolowy"("budzet_skrocony_id");

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_czesc_budzetowa_1" ON "czesc_budzetowa"("kod");
Pragma writable_schema=0;

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_dzial_1" ON "dzial"("kod");
Pragma writable_schema=0;

-- CreateIndex
CREATE INDEX "idx_formularz_pozycja" ON "formularz"("pozycja_budzetu_id");

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_grupa_wydatkow_1" ON "grupa_wydatkow"("nazwa");
Pragma writable_schema=0;

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_paragraf_1" ON "paragraf"("kod");
Pragma writable_schema=0;

-- CreateIndex
CREATE INDEX "idx_pozycja_zadanie" ON "pozycja_budzetu"("zadanie_szczegoly_id");

-- CreateIndex
CREATE INDEX "idx_pozycja_czesc" ON "pozycja_budzetu"("czesc_budzetowa_id");

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_rozdzial_1" ON "rozdzial"("kod");
Pragma writable_schema=0;

-- CreateIndex
CREATE INDEX "idx_rozdzial_dzial" ON "rozdzial"("dzial_id");

-- CreateIndex
CREATE INDEX "idx_zad_min_ograniczenie" ON "zadanie_ministerstwo"("ograniczenie_id");

-- CreateIndex
CREATE INDEX "idx_zad_min_formularz" ON "zadanie_ministerstwo"("formularz_id");

-- CreateIndex
CREATE INDEX "idx_zadanie_szcz_dane" ON "zadanie_szczegoly"("dane_finansowe_id");

-- CreateIndex
CREATE INDEX "idx_zadanie_szcz_opis" ON "zadanie_szczegoly"("opis_zadania_id");

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_zrodlo_finansowania_1" ON "zrodlo_finansowania"("kod");
Pragma writable_schema=0;
