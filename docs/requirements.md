# 📝 Kravspecifikation: Bankoplade Generator

Dette dokument beskriver de funktionelle og ikke-funktionelle krav til et softwareprogram, der skal generere og udskrive valide, unikke bankoplader (90-tals banko).

---

## 1. Generelle Systemkrav

| Krav ID | Beskrivelse | Prioritet |
| :--- | :--- | :--- |
| **G-100** | Programmet skal være i stand til at generere et **valgfrit antal** bankoplader. | Høj |
| **G-101** | Programmet skal sikre, at hver genereret plade er **unik** (ingen duplikerede plader i samme batch). | Høj |
| **G-102** | Programmet skal være **brugervenligt** og have en klar grænseflade for indtastning af parametre. | Medium |

---

## 2. Funktionelle Krav (FN)

### 2.1 Plade-Struktur & Validering

Bankoplader skal følge de klassiske danske regler (9x3 matrix, tal 1-90).

| Krav ID | Beskrivelse | Detaljer |
| :--- | :--- | :--- |
| **FN-110** | **Pladeformat:** Hver plade skal have **3 vandrette rækker** og **9 lodrette kolonner**. | |
| **FN-111** | **Antal tal pr. række:** Hver vandret række skal indeholde **præcist 5 tal** (og 4 blanke felter). | |
| **FN-112** | **Total antal tal:** Hver plade skal indeholde **præcist 15 tal** i alt. | |
| **FN-113** | **Kolonneintervaller:** Tallene skal være korrekt placeret i kolonner efter deres ti-interval. | **Kolonne 1:** 1-9; **Kolonne 2:** 10-19; **Kolonne 3:** 20-29; **Kolonne 4:** 30-39; **Kolonne 5:** 40-49; **Kolonne 6:** 50-59; **Kolonne 7:** 60-69; **Kolonne 8:** 70-79; **Kolonne 9:** 80-90. |
| **FN-114** | **Antal tal pr. kolonne:** En lodret kolonne må **maksimalt indeholde 3 tal**. | |
| **FN-115** | **Kolonne 9 undtagelse:** Kolonne 9 skal indeholde tal fra 80 til 90 (11 tal). | |
| **FN-116** | **Rækkefølge:** Tallene i hver kolonne skal vises i **stigende rækkefølge** oppefra og ned. | |

### 2.2 Input & Output

| Krav ID | Beskrivelse | Prioritet |
| :--- | :--- | :--- |
| **FN-210** | Brugeren skal kunne **indtaste antallet af plader**, der skal genereres. | Høj |
| **FN-211** | Programmet skal kunne **gemme de genererede plader** som en fil. | Høj |
| **FN-212** | Output-formatet skal inkludere **PDF-eksport** optimeret til udskrivning (typisk 6 plader pr. A4-side). | Høj |
| **FN-213** | Programmet skal kunne **gemme listen over de udtrukne tal** i en tekstfil eller CSV (til manuel kontrol). | Medium |
| **FN-214** | Programmet skal vise et **visuelt preview** af en genereret plade i grænsefladen. | Medium |

---

## 3. Ikke-Funktionelle Krav (IFN)

### 3.1 Ydeevne

| Krav ID | Beskrivelse | Acceptkriterie |
| :--- | :--- | :--- |
| **IFN-100** | Genereringstid | Programmet skal kunne generere 1.000 unikke plader på **maksimalt 5 sekunder**. |
| **IFN-101** | Hukommelsesforbrug | Programmet skal opretholde et lavt hukommelsesforbrug under genereringen. |

### 3.2 Sikkerhed & Pålidelighed

| Krav ID | Beskrivelse | Prioritet |
| :--- | :--- | :--- |
| **IFN-200** | **Unikhed:** Programmet skal garantere, at der **aldrig genereres duplikerede plader** i samme genereringsproces. | Kritisk |
| **IFN-201** | **Tilfældighed:** Algoritmen til talplacering skal bruge en **stærkt tilfældig** generator for at sikre fair og uforudsigelig pladegenerering. | Høj |
| **IFN-202** | **Fejlhåndtering:** Programmet skal give en klar fejlmeddelelse, hvis plade-genereringen mislykkes. | Høj |

### 3.3 Miljø & Skalerbarhed

| Krav ID | Beskrivelse | Detaljer |
| :--- | :--- | :--- |
| **IFN-300** | **Plattform:** Softwaren skal køre på **Windows og macOS** eller være web-baseret. | |
| **IFN-301** | **Vedligeholdelse:** Kildekoden skal være veldokumenteret og let at vedligeholde/opdatere i fremtiden. | |

---

## 4. Billed- & Printkrav (UX/UI)

| Krav ID | Beskrivelse | Prioritet |
| :--- | :--- | :--- |
| **UX-100** | Hver plade skal have et **unikt ID-nummer** (Plade-ID) for nem kontrol og reference. | Høj |
| **UX-101** | **Udskriftsdesign:** Tallene skal være store, tydelige og letlæselige ved udskrivning. | Høj |
| **UX-102** | **Branding:** Pladerne skal inkludere en mulighed for at indsætte et **logo** eller et arrangementsnavn i sidehovedet. | Medium |

---

## 5. Algoritmekrav (AL)

Algoritmen skal løse det centrale problem med at placere præcist 15 tal på en 9x3 plade, mens alle valideringsregler opfyldes.

| Krav ID | Beskrivelse | Metodik |
| :--- | :--- | :--- |
| **AL-100** | **Initialisering:** Generer tre rækker med 5 tilfældige tal, der er unikke for pladen, men uden at overtræde kolonnekravet (maksimalt 3 tal pr. kolonne). | Sørg for at den totale sum af tal i hver af de 9 kolonner er $\leq 3$. |
| **AL-101** | **Fordelingsoptimering:** Sikr en **ligelig fordeling** af tallene på rækkerne for optimal variation. | |
| **AL-102** | **Unikhedskontrol:** Kontrollér den nygenererede plade mod alle tidligere genererede plader i batchen. | Hvis der findes en duplikat, skal den kasseres og en ny plade genereres. |
