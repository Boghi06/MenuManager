-- ============================================================
-- 022 · Classificazione iniziale dei piatti in carne/pesce/vegetariano
-- Run AFTER 021_categoria_piatto.sql
--
-- Assegna `piatti.categoria` ai piatti che ne sono ancora privi, deducendola
-- dal nome italiano. La 021 aveva potuto dedurre solo i vegetariani dai flag
-- di scheda: qui si aggiungono carne e pesce, che dal flag non si ricavano.
--
-- Gli id sono espliciti e non un LIKE sui nomi: la classificazione è stata
-- rivista una volta, e va applicata identica a ogni ambiente. Se un piatto
-- cambia nome, questa migrazione continua a fare la stessa cosa.
--
-- ⚠️ Vale per il DB di Hotel Garden: gli id sono i suoi. Su un cliente nuovo
-- non trova nulla da aggiornare (nessun id coincide) e resta innocua.
--
-- Criteri, in ordine di precedenza:
--   1. il nome si dichiara vegano/vegetariano/"di magro"  → vegetariano
--   2. il nome cita una specie ittica, un crostaceo o un mollusco → pesce
--   3. il nome cita una carne, un salume o un taglio       → carne
--   4. ragù/carbonara/bollito senza pesce esplicito        → carne
--   5. consommé o brodo non dichiarati vegetali            → carne
--   6. flag vegetariano/vegano già in scheda               → vegetariano
--   7. ingrediente vegetale portante (verdure, formaggi, uova, legumi) → vegetariano
--   8. contorno senza traccia di carne o pesce             → vegetariano
--
-- Restano senza categoria 13 piatti dal nome non deducibile
-- (nomi di fantasia dello chef, piatti misti, righe di servizio): li
-- classificherà l'utente dal form, non li indoviniamo qui.
--
-- ⚠️ AUDIT: senza il blocco che disattiva il trigger, questa migrazione
-- scrive ~610 righe in activity_log tutte con lo stesso timestamp,
-- seppellendo lo storico reale nel Registro attività. Togliere i due blocchi
-- `disable/enable trigger` se invece si vuole tracciare il backfill.
-- ============================================================

-- Silenzia l'audit per la durata del backfill (se il ruolo non è proprietario
-- della tabella prosegue lo stesso, scrivendo il log).
do $$
begin
  alter table public.piatti disable trigger log_piatti_changes;
exception when insufficient_privilege or undefined_object then
  raise notice 'trigger di audit non disattivabile: il backfill finirà in activity_log';
end $$;

-- ── CARNE (247) ─────────────────────────────────────────────
update public.piatti set categoria = 'carne'
 where categoria is null and id in (
    7, 21, 23, 26, 45, 57, 77, 98, 100, 120, 131, 150, 152, 156, 187,
    193, 209, 213, 216, 220, 241, 251, 267, 287, 293, 294, 300, 306, 312, 320,
    327, 336, 337, 338, 339, 346, 352, 354, 359, 364, 375, 377, 381, 394, 404,
    409, 419, 423, 424, 427, 430, 436, 439, 440, 461, 462, 465, 466, 467, 478,
    490, 497, 500, 502, 503, 507, 508, 509, 510, 514, 517, 524, 527, 530, 531,
    533, 539, 555, 557, 570, 571, 573, 581, 593, 594, 602, 605, 607, 613, 614,
    615, 617, 620, 624, 627, 628, 633, 634, 635, 637, 641, 648, 649, 650, 652,
    654, 655, 657, 661, 665, 667, 675, 676, 686, 691, 702, 703, 704, 710, 712,
    717, 719, 724, 725, 727, 735, 739, 740, 741, 744, 746, 747, 750, 753, 754,
    758, 759, 760, 765, 767, 769, 772, 776, 780, 781, 789, 790, 797, 804, 806,
    817, 818, 825, 826, 827, 828, 830, 831, 832, 834, 836, 842, 844, 847, 851,
    864, 865, 866, 868, 874, 878, 882, 889, 890, 897, 901, 902, 905, 908, 911,
    913, 919, 920, 921, 923, 929, 935, 936, 937, 940, 941, 942, 945, 947, 950,
    958, 966, 968, 972, 977, 978, 979, 985, 988, 989, 992, 993, 995, 996, 998,
    1000, 1003, 1004, 1005, 1009, 1010, 1017, 1022, 1023, 1030, 1031, 1034, 1036, 1037, 1038,
    1042, 1045, 1049, 1053, 1056, 1057, 1058, 1063, 1066, 1073, 1078, 1083, 1093, 1099, 1102,
    1104, 1105, 1106, 1107, 1109, 1110, 1111
);

-- ── PESCE (116) ─────────────────────────────────────────────
update public.piatti set categoria = 'pesce'
 where categoria is null and id in (
    140, 230, 289, 296, 311, 316, 319, 323, 328, 345, 351, 353, 355, 358, 360,
    365, 378, 382, 383, 390, 393, 407, 415, 416, 429, 442, 447, 450, 452, 456,
    468, 471, 485, 489, 491, 492, 495, 496, 498, 529, 535, 549, 572, 585, 592,
    598, 599, 616, 619, 621, 643, 651, 660, 664, 672, 674, 679, 681, 685, 687,
    692, 693, 698, 708, 714, 716, 730, 743, 748, 749, 774, 784, 787, 791, 792,
    794, 795, 798, 799, 808, 809, 815, 819, 820, 821, 822, 823, 843, 855, 859,
    877, 879, 883, 884, 891, 899, 903, 904, 909, 926, 931, 932, 953, 957, 969,
    970, 976, 999, 1002, 1007, 1019, 1026, 1080, 1086, 1090, 1092
);

-- ── VEGETARIANO (245) ─────────────────────────────────────────────
update public.piatti set categoria = 'vegetariano'
 where categoria is null and id in (
    17, 40, 56, 61, 63, 66, 72, 83, 94, 95, 102, 103, 104, 105, 115,
    124, 127, 143, 144, 145, 155, 160, 166, 167, 170, 171, 177, 188, 198, 199,
    200, 203, 210, 217, 218, 222, 227, 229, 237, 246, 247, 259, 262, 263, 268,
    269, 277, 280, 283, 284, 286, 295, 297, 301, 308, 314, 317, 318, 322, 324,
    325, 332, 335, 344, 347, 349, 363, 372, 373, 376, 385, 386, 388, 389, 391,
    395, 397, 398, 399, 400, 403, 406, 410, 412, 418, 432, 433, 441, 445, 449,
    451, 454, 455, 457, 458, 472, 477, 481, 486, 504, 505, 511, 518, 519, 522,
    532, 538, 542, 545, 560, 565, 568, 577, 579, 587, 595, 596, 597, 601, 603,
    604, 608, 623, 630, 631, 636, 638, 639, 640, 642, 644, 645, 646, 647, 658,
    663, 666, 668, 669, 670, 673, 680, 684, 689, 696, 705, 707, 713, 715, 720,
    721, 722, 723, 728, 729, 736, 738, 742, 751, 752, 755, 757, 766, 775, 783,
    785, 786, 793, 801, 802, 805, 807, 810, 811, 812, 813, 824, 837, 845, 846,
    848, 849, 857, 867, 869, 885, 886, 887, 892, 893, 900, 907, 912, 915, 916,
    917, 922, 928, 934, 943, 944, 948, 951, 954, 962, 967, 973, 980, 984, 990,
    994, 997, 1001, 1008, 1012, 1015, 1016, 1018, 1025, 1028, 1029, 1033, 1039, 1040, 1043,
    1044, 1047, 1048, 1065, 1068, 1070, 1071, 1074, 1075, 1076, 1084, 1087, 1091, 1095, 1096,
    1097, 1098, 1100, 1101, 1108
);

-- ── Correzioni (2) ────────────────────────────────────────────────────
-- Piatti che la 021 aveva marcato vegetariani seguendo il flag di scheda, che
-- però è sbagliato: il nome dice chiaramente il contrario. Qui si corregge solo
-- la categoria; il flag `vegetariano` resta com'è e va sistemato a mano.
update public.piatti set categoria = 'pesce' where id = 371;  -- Sogliola di Dover dorata alla maggiorana fresca
update public.piatti set categoria = 'pesce' where id = 770;  -- Pasticcio di lasagne con pesce alla Veneziana

do $$
begin
  alter table public.piatti enable trigger log_piatti_changes;
exception when insufficient_privilege or undefined_object then
  null;
end $$;
