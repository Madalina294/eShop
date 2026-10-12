-- =====================================================================
-- eShop - date fictive pentru testare (PostgreSQL)
--
-- Rulare (din folderul Backend/database), dupa create_database.sql:
--   psql -U postgres -d eShop -f seed_data.sql
--
-- Scriptul poate fi rulat de mai multe ori: inregistrarile existente
-- (acelasi email / acelasi nume) nu sunt duplicate.
--
-- Conturi create:
--   ADMIN : admin@gmail.com     / Adminul_0   (doar daca nu exista deja un admin)
--   USERI : *@example.com       / Parola123!
-- =====================================================================

-- Parolele sunt hash-uite cu BCrypt, la fel ca BCryptPasswordEncoder din Spring
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Cont de admin
--    Aplicatia foloseste findByRole(ADMIN), care asteapta UN SINGUR admin,
--    deci il cream doar daca nu exista deja unul.
-- ---------------------------------------------------------------------
INSERT INTO users (firstname, lastname, email, phone_number, password, role,
                   mfa_enabled, preferred_theme, preferred_language, created_at)
SELECT 'Admin', 'Management', 'admin@gmail.com', '0700000000',
       crypt('Adminul_0', gen_salt('bf', 10)), 'ADMIN',
       FALSE, 'dark', 'en', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'ADMIN');

-- ---------------------------------------------------------------------
-- 2. Useri fictivi (parola: Parola123!)
-- ---------------------------------------------------------------------
INSERT INTO users (firstname, lastname, email, phone_number, password, role,
                   mfa_enabled, preferred_theme, preferred_language, created_at)
SELECT u.firstname, u.lastname, u.email, u.phone_number,
       crypt('Parola123!', gen_salt('bf', 10)), 'USER',
       FALSE, u.preferred_theme, u.preferred_language, u.created_at
FROM (VALUES
    ('Andrei',   'Popescu',   'andrei.popescu@example.com',   '0721000001', 'dark',  'ro', NOW() - INTERVAL '90 days'),
    ('Ioana',    'Ionescu',   'ioana.ionescu@example.com',    '0721000002', 'light', 'ro', NOW() - INTERVAL '60 days'),
    ('Mihai',    'Dumitru',   'mihai.dumitru@example.com',    '0721000003', 'dark',  'en', NOW() - INTERVAL '45 days'),
    ('Elena',    'Stan',      'elena.stan@example.com',       '0721000004', 'light', 'ro', NOW() - INTERVAL '20 days'),
    ('Alexandru','Georgescu', 'alex.georgescu@example.com',   '0721000005', 'dark',  'en', NOW() - INTERVAL '7 days'),
    ('Maria',    'Constantin','maria.constantin@example.com', '0721000006', 'light', 'ro', NOW() - INTERVAL '2 days')
) AS u(firstname, lastname, email, phone_number, preferred_theme, preferred_language, created_at)
WHERE NOT EXISTS (SELECT 1 FROM users x WHERE x.email = u.email);

-- ---------------------------------------------------------------------
-- 3. Categorii
-- ---------------------------------------------------------------------
INSERT INTO categories (name, description)
SELECT c.name, c.description
FROM (VALUES
    ('Canapele',    'Canapele si fotolii pentru living, extensibile sau fixe.'),
    ('Mese',        'Mese de dining, mese de cafea si birouri.'),
    ('Scaune',      'Scaune de bucatarie, de birou si scaune de bar.'),
    ('Paturi',      'Paturi si cadre de pat pentru dormitor.'),
    ('Iluminat',    'Lustre, lampadare si veioze.'),
    ('Decoratiuni', 'Oglinzi, vaze, rame si alte accesorii decorative.')
) AS c(name, description)
WHERE NOT EXISTS (SELECT 1 FROM categories x WHERE x.name = c.name);

-- ---------------------------------------------------------------------
-- 4. Produse (imaginea ramane NULL; se poate incarca din panoul de admin)
-- ---------------------------------------------------------------------
INSERT INTO products (name, price, image, category_id, color, description,
                      dimensions, material, weight, quantity)
SELECT p.name, p.price, NULL, c.id, p.color, p.description,
       p.dimensions, p.material, p.weight, p.quantity
FROM (VALUES
    -- Canapele
    ('Canapea extensibila Oslo',    2499.99, 'Canapele',    'Gri',       'Canapea extensibila cu 3 locuri si lada de depozitare.',        '220 x 95 x 85 cm',  'Stofa, lemn de pin',    '68 kg', 12),
    ('Fotoliu Nordic',               899.00, 'Canapele',    'Verde',     'Fotoliu tapitat cu catifea si picioare din lemn masiv.',         '75 x 80 x 90 cm',   'Catifea, fag',          '18 kg', 20),
    ('Coltar Milano',               4299.50, 'Canapele',    'Bej',       'Coltar modular pentru living spatios, cu perne detasabile.',     '280 x 180 x 88 cm', 'Piele ecologica',       '110 kg', 5),
    -- Mese
    ('Masa dining Toscana',         1799.00, 'Mese',        'Stejar',    'Masa extensibila pentru 6-8 persoane.',                          '160-200 x 90 x 75 cm', 'Lemn de stejar',     '45 kg', 8),
    ('Masuta de cafea Loft',         549.90, 'Mese',        'Negru',     'Masuta in stil industrial cu blat din lemn si cadru metalic.',   '110 x 60 x 45 cm',  'MDF, otel',             '15 kg', 25),
    ('Birou Ergo',                  1249.00, 'Mese',        'Alb',       'Birou cu inaltime reglabila electric.',                          '140 x 70 x 72-120 cm', 'PAL, otel',          '32 kg', 10),
    -- Scaune
    ('Scaun bucatarie Bistro',       229.00, 'Scaune',      'Natur',     'Scaun din lemn masiv cu sezut ergonomic.',                       '45 x 50 x 82 cm',   'Fag',                   '5 kg', 40),
    ('Scaun birou Pro',              799.00, 'Scaune',      'Negru',     'Scaun de birou cu suport lombar si brate reglabile.',            '65 x 65 x 115-125 cm', 'Plasa, plastic',     '14 kg', 18),
    ('Scaun bar Metro',              349.50, 'Scaune',      'Gri',       'Scaun de bar cu inaltime reglabila si rotire 360 de grade.',     '42 x 42 x 85-105 cm', 'Piele ecologica, crom', '7 kg', 30),
    -- Paturi
    ('Pat matrimonial Siena',       2199.00, 'Paturi',      'Nuc',       'Pat matrimonial cu tablie tapitata si somiera inclusa.',         '160 x 200 cm',      'Lemn, stofa',           '75 kg', 6),
    ('Pat single Junior',            999.00, 'Paturi',      'Alb',       'Pat single cu doua sertare pentru depozitare.',                  '90 x 200 cm',       'PAL melaminat',         '40 kg', 14),
    -- Iluminat
    ('Lustra Aurora',                459.00, 'Iluminat',    'Auriu',     'Lustra cu 6 brate, compatibila cu becuri LED E14.',              'Diametru 60 cm',    'Metal, sticla',         '4 kg', 22),
    ('Lampadar Arc',                 389.99, 'Iluminat',    'Negru',     'Lampadar arcuit, ideal langa canapea.',                          '180 x 35 cm',       'Otel, marmura',         '9 kg', 15),
    ('Veioza Luna',                  129.00, 'Iluminat',    'Alb',       'Veioza cu abajur textil si intrerupator pe cablu.',              '25 x 25 x 45 cm',   'Ceramica, textil',      '1.5 kg', 50),
    -- Decoratiuni
    ('Oglinda rotunda Halo',         319.00, 'Decoratiuni', 'Auriu',     'Oglinda de perete cu rama metalica subtire.',                    'Diametru 80 cm',    'Sticla, metal',         '6 kg', 17),
    ('Set 3 vaze Terra',             149.90, 'Decoratiuni', 'Teracota',  'Set de trei vaze decorative de dimensiuni diferite.',            '15 / 22 / 30 cm',   'Ceramica',              '2.8 kg', 35),
    ('Covor Boho',                   599.00, 'Decoratiuni', 'Crem',      'Covor tesut manual cu model geometric.',                         '160 x 230 cm',      'Bumbac, iuta',          '8 kg', 9),
    ('Ceas de perete Vintage',        99.00, 'Decoratiuni', 'Maro',      'Ceas de perete silentios cu cifre romane.',                      'Diametru 40 cm',    'Lemn, sticla',          '1.2 kg', 0)
) AS p(name, price, category, color, description, dimensions, material, weight, quantity)
JOIN categories c ON c.name = p.category
WHERE NOT EXISTS (SELECT 1 FROM products x WHERE x.name = p.name);

COMMIT;

-- Rezumat
SELECT 'users' AS tabel, COUNT(*) FROM users
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'products',   COUNT(*) FROM products;
