export const SCHEMA_SQL = `
-- Departamenty (16 komorek organizacyjnych)
CREATE TABLE IF NOT EXISTS departamenty (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nazwa TEXT NOT NULL,
  kod TEXT UNIQUE NOT NULL
);

-- Zadania (zlecenia od ministerstwa) z wersjonowaniem
CREATE TABLE IF NOT EXISTS zadania (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tytul TEXT NOT NULL,
  opis TEXT,
  termin_do TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  wersja INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed'))
);

-- Limity budzetu per departament w ramach zadania
CREATE TABLE IF NOT EXISTS limity_departamentow (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zadanie_id INTEGER NOT NULL REFERENCES zadania(id) ON DELETE CASCADE,
  departament_id INTEGER NOT NULL REFERENCES departamenty(id),
  limit_budzetu REAL NOT NULL DEFAULT 0,
  UNIQUE(zadanie_id, departament_id)
);

-- Ograniczenia/reguly walidacji dla zadania
-- Typ: 'pole_wartosc' - jesli pole ma wartosc X to inne pole <= Y
-- Typ: 'suma_pola' - suma danego pola dla departamentu <= Y
-- Typ: 'wymagane_pole' - pole musi byc wypelnione jesli inne pole = X
CREATE TABLE IF NOT EXISTS ograniczenia_zadania (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zadanie_id INTEGER NOT NULL REFERENCES zadania(id) ON DELETE CASCADE,
  nazwa TEXT NOT NULL,
  opis TEXT,
  typ TEXT NOT NULL CHECK (typ IN ('pole_wartosc', 'suma_pola', 'wymagane_pole', 'zakres_wartosci', 'custom')),

  -- Warunki i ograniczenia jako JSON
  warunek_pole TEXT,
  warunek_operator TEXT CHECK (warunek_operator IN ('=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL')),
  warunek_wartosc TEXT,

  -- Ograniczenie do zastosowania
  ograniczenie_pole TEXT,
  ograniczenie_operator TEXT CHECK (ograniczenie_operator IN ('<=', '>=', '<', '>', '=', 'IN', 'NOT_NULL')),
  ograniczenie_wartosc TEXT,

  -- Komunikat bledu
  komunikat_bledu TEXT NOT NULL,

  aktywne INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Wysylki zbiorcze departamentow (sledzenie kto wyslal, kto zalega)
CREATE TABLE IF NOT EXISTS wysylki_departamentow (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zadanie_id INTEGER NOT NULL REFERENCES zadania(id),
  departament_id INTEGER NOT NULL REFERENCES departamenty(id),
  zadanie_wersja INTEGER NOT NULL,

  status TEXT DEFAULT 'oczekuje' CHECK (status IN ('oczekuje', 'wyslano', 'wymaga_korekty')),

  -- Ile formularzy wyslano w tej wysylce
  liczba_formularzy INTEGER DEFAULT 0,
  suma_rok_1 REAL DEFAULT 0,
  suma_rok_2 REAL DEFAULT 0,
  suma_rok_3 REAL DEFAULT 0,
  suma_rok_4 REAL DEFAULT 0,

  wyslano_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),

  UNIQUE(zadanie_id, departament_id, zadanie_wersja)
);

-- Formularze budzetowe
CREATE TABLE IF NOT EXISTS formularze (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zadanie_id INTEGER NOT NULL REFERENCES zadania(id),
  departament_id INTEGER NOT NULL REFERENCES departamenty(id),
  wysylka_id INTEGER REFERENCES wysylki_departamentow(id),

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'historical', 'archived')),

  -- Powiazanie z poprzednia wersja (dla kopii przy korekcie)
  parent_formularz_id INTEGER REFERENCES formularze(id),
  zadanie_wersja INTEGER DEFAULT 1,

  -- Pola do filtrowania/sortowania (13 pol)
  kod_rozdzialu TEXT,
  kod_paragrafu TEXT,
  kod_dzialania TEXT,
  nazwa_zadania TEXT,
  kategoria TEXT,
  priorytet TEXT,
  rok_1 REAL,
  rok_2 REAL,
  rok_3 REAL,
  rok_4 REAL,
  typ_wydatku TEXT,
  zrodlo_finansowania TEXT,
  jednostka_realizujaca TEXT,

  -- Pola dodatkowe (dane mniej wazne)
  opis_szczegolowy TEXT,
  uzasadnienie TEXT,
  uwagi TEXT,
  zalaczniki_ref TEXT,
  osoba_odpowiedzialna TEXT,
  telefon_kontaktowy TEXT,
  email_kontaktowy TEXT,
  data_rozpoczecia TEXT,
  data_zakonczenia TEXT,
  wskazniki_realizacji TEXT,

  -- Metadane
  created_at TEXT DEFAULT (datetime('now')),
  submitted_at TEXT,
  version INTEGER DEFAULT 1
);

-- Historia zmian zadan (audit log)
CREATE TABLE IF NOT EXISTS zadania_historia (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zadanie_id INTEGER NOT NULL REFERENCES zadania(id),
  wersja INTEGER NOT NULL,
  zmiana_typ TEXT NOT NULL,
  zmiana_opis TEXT,
  stare_dane TEXT,
  nowe_dane TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_formularze_zadanie ON formularze(zadanie_id);
CREATE INDEX IF NOT EXISTS idx_formularze_departament ON formularze(departament_id);
CREATE INDEX IF NOT EXISTS idx_formularze_status ON formularze(status);
CREATE INDEX IF NOT EXISTS idx_formularze_wysylka ON formularze(wysylka_id);
CREATE INDEX IF NOT EXISTS idx_formularze_parent ON formularze(parent_formularz_id);
CREATE INDEX IF NOT EXISTS idx_formularze_kod_rozdzialu ON formularze(kod_rozdzialu);
CREATE INDEX IF NOT EXISTS idx_formularze_kod_paragrafu ON formularze(kod_paragrafu);
CREATE INDEX IF NOT EXISTS idx_formularze_kategoria ON formularze(kategoria);
CREATE INDEX IF NOT EXISTS idx_formularze_priorytet ON formularze(priorytet);
CREATE INDEX IF NOT EXISTS idx_ograniczenia_zadanie ON ograniczenia_zadania(zadanie_id);
CREATE INDEX IF NOT EXISTS idx_wysylki_zadanie ON wysylki_departamentow(zadanie_id);
CREATE INDEX IF NOT EXISTS idx_wysylki_departament ON wysylki_departamentow(departament_id);
CREATE INDEX IF NOT EXISTS idx_wysylki_status ON wysylki_departamentow(status);
`;

export const SEED_DEPARTAMENTY_SQL = `
INSERT OR IGNORE INTO departamenty (nazwa, kod) VALUES
  ('Departament Cyberbezpieczenstwa', 'DC'),
  ('Departament Rozwoju Uslug Cyfrowych', 'DRUC'),
  ('Departament Systemow Panstwowych', 'DSP'),
  ('Departament Zarzadzania Danymi', 'DZD'),
  ('Departament Spoleczenstwa Informacyjnego', 'DSI'),
  ('Departament Telekomunikacji', 'DT'),
  ('Departament Prawny', 'DP'),
  ('Biuro Dyrektora Generalnego', 'BDG'),
  ('Biuro Budzetowo-Finansowe', 'BBF'),
  ('Biuro Administracyjne', 'BA'),
  ('Biuro Komunikacji', 'BK'),
  ('Biuro Ministra', 'BM'),
  ('Biuro Kontroli i Audytu', 'BKA'),
  ('Biuro Kadr i Organizacji', 'BKO'),
  ('Biuro Zamowien Publicznych', 'BZP'),
  ('Gabinet Polityczny Ministra', 'GPM');
`;
