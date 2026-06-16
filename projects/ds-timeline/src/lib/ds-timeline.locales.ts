/**
 * Built-in locale strings for ds-timeline UI labels.
 * Structure mirrors FullCalendar's locale format so locale packs can be reused.
 *
 * Keys in DS_LOCALES use the BCP-47 language tag (lowercase, hyphen-separated).
 * Lookup order: exact match → language-only prefix → 'en' fallback.
 */

export interface DsLocale {
  /** Text direction. 'rtl' flips the layout for Arabic, Hebrew, Farsi. Default: 'ltr'. */
  direction: 'ltr' | 'rtl';
  buttonText: {
    today: string;
    day:   string;
    week:  string;
    month: string;
  };
  /** Prefix for week-number labels (e.g. 'W', 'KW', '주'). */
  weekText: string;
  /** Label shown on all-day event bars. */
  allDayText: string;
  /** '+N more' chip text. Receives the hidden-event count. */
  moreLinkText: (n: number) => string;
  /** Empty-state message (no events in view). */
  noEventsText: string;
  /** 'All' option in the group-filter dropdown. */
  allFilter: string;
  /** Tooltip hint shown while drag-selecting. */
  releaseToConfirm: string;
  /** Badge text for the single-overlap mode indicator. */
  exclusive: string;
}

type PartialLocale = Partial<Omit<DsLocale, 'buttonText' | 'moreLinkText'>> & {
  buttonText?: Partial<DsLocale['buttonText']>;
  moreLinkText?: (n: number) => string;
};

const EN: DsLocale = {
  direction:        'ltr',
  buttonText:       { today: 'Today', day: 'Day', week: 'Week', month: 'Month' },
  weekText:         'W',
  allDayText:       'All day',
  moreLinkText:     n => `+${n} more`,
  noEventsText:     'No events to display',
  allFilter:        'All',
  releaseToConfirm: 'Release to confirm',
  exclusive:        'Exclusive',
};

/** Partial locale definitions — merged with English fallback. */
const PARTIAL: Record<string, PartialLocale> = {
  // ── Germanic ──────────────────────────────────────────────────────────────
  de: {
    buttonText:       { today: 'Heute', day: 'Tag', week: 'Woche', month: 'Monat' },
    weekText:         'KW',
    allDayText:       'Ganztägig',
    moreLinkText:     n => `+${n} weitere`,
    noEventsText:     'Keine Ereignisse anzuzeigen',
    allFilter:        'Alle',
    releaseToConfirm: 'Loslassen zum Bestätigen',
    exclusive:        'Exklusiv',
  },
  nl: {
    buttonText:       { today: 'Vandaag', day: 'Dag', week: 'Week', month: 'Maand' },
    weekText:         'Wk',
    allDayText:       'Hele dag',
    moreLinkText:     n => `+${n} meer`,
    noEventsText:     'Geen evenementen om te tonen',
    allFilter:        'Alle',
    releaseToConfirm: 'Loslaten om te bevestigen',
    exclusive:        'Exclusief',
  },
  af: {
    buttonText:       { today: 'Vandag', day: 'Dag', week: 'Week', month: 'Maand' },
    weekText:         'Wk',
    allDayText:       'Hele dag',
    moreLinkText:     n => `+${n} meer`,
    noEventsText:     'Geen geleenthede om te wys nie',
    allFilter:        'Alle',
    releaseToConfirm: 'Los om te bevestig',
    exclusive:        'Eksklusief',
  },
  // ── Scandinavian ──────────────────────────────────────────────────────────
  sv: {
    buttonText:       { today: 'Idag', day: 'Dag', week: 'Vecka', month: 'Månad' },
    weekText:         'v',
    allDayText:       'Hela dagen',
    moreLinkText:     n => `+${n} till`,
    noEventsText:     'Inga händelser att visa',
    allFilter:        'Alla',
    releaseToConfirm: 'Släpp för att bekräfta',
    exclusive:        'Exklusivt',
  },
  da: {
    buttonText:       { today: 'I dag', day: 'Dag', week: 'Uge', month: 'Måned' },
    weekText:         'Uge',
    allDayText:       'Hele dagen',
    moreLinkText:     n => `+${n} mere`,
    noEventsText:     'Ingen begivenheder at vise',
    allFilter:        'Alle',
    releaseToConfirm: 'Slip for at bekræfte',
    exclusive:        'Eksklusiv',
  },
  nb: {
    buttonText:       { today: 'I dag', day: 'Dag', week: 'Uke', month: 'Måned' },
    weekText:         'Uke',
    allDayText:       'Hele dagen',
    moreLinkText:     n => `+${n} mer`,
    noEventsText:     'Ingen hendelser å vise',
    allFilter:        'Alle',
    releaseToConfirm: 'Slipp for å bekrefte',
    exclusive:        'Eksklusiv',
  },
  nn: {
    buttonText:       { today: 'I dag', day: 'Dag', week: 'Veke', month: 'Månad' },
    weekText:         'Veke',
    allDayText:       'Heile dagen',
    moreLinkText:     n => `+${n} meir`,
    noEventsText:     'Ingen hendingar å vise',
    allFilter:        'Alle',
    releaseToConfirm: 'Slipp for å stadfesta',
    exclusive:        'Eksklusiv',
  },
  fi: {
    buttonText:       { today: 'Tänään', day: 'Päivä', week: 'Viikko', month: 'Kuukausi' },
    weekText:         'Vk',
    allDayText:       'Koko päivä',
    moreLinkText:     n => `+${n} lisää`,
    noEventsText:     'Ei tapahtumia näytettäväksi',
    allFilter:        'Kaikki',
    releaseToConfirm: 'Vapauta vahvistaaksesi',
    exclusive:        'Yksinoikeus',
  },
  // ── Romance ───────────────────────────────────────────────────────────────
  fr: {
    buttonText:       { today: "Aujourd'hui", day: 'Jour', week: 'Semaine', month: 'Mois' },
    weekText:         'Sem.',
    allDayText:       'Toute la journée',
    moreLinkText:     n => `+${n} autre${n > 1 ? 's' : ''}`,
    noEventsText:     'Aucun événement à afficher',
    allFilter:        'Tous',
    releaseToConfirm: 'Relâcher pour confirmer',
    exclusive:        'Exclusif',
  },
  'fr-ca': {
    buttonText:       { today: "Aujourd'hui", day: 'Jour', week: 'Semaine', month: 'Mois' },
    weekText:         'Sem.',
    allDayText:       'Toute la journée',
    moreLinkText:     n => `+${n} autre${n > 1 ? 's' : ''}`,
    noEventsText:     'Aucun événement à afficher',
    allFilter:        'Tous',
    releaseToConfirm: 'Relâcher pour confirmer',
    exclusive:        'Exclusif',
  },
  es: {
    buttonText:       { today: 'Hoy', day: 'Día', week: 'Semana', month: 'Mes' },
    weekText:         'Sem',
    allDayText:       'Todo el día',
    moreLinkText:     n => `+${n} más`,
    noEventsText:     'No hay eventos para mostrar',
    allFilter:        'Todos',
    releaseToConfirm: 'Soltar para confirmar',
    exclusive:        'Exclusivo',
  },
  'es-us': {
    buttonText:       { today: 'Hoy', day: 'Día', week: 'Semana', month: 'Mes' },
    weekText:         'Sem',
    allDayText:       'Todo el día',
    moreLinkText:     n => `+${n} más`,
    noEventsText:     'No hay eventos para mostrar',
    allFilter:        'Todos',
    releaseToConfirm: 'Soltar para confirmar',
    exclusive:        'Exclusivo',
  },
  it: {
    buttonText:       { today: 'Oggi', day: 'Giorno', week: 'Settimana', month: 'Mese' },
    weekText:         'Sett',
    allDayText:       'Tutto il giorno',
    moreLinkText:     n => `+${n} altro${n > 1 ? 'i' : ''}`,
    noEventsText:     'Non ci sono eventi da mostrare',
    allFilter:        'Tutti',
    releaseToConfirm: 'Rilascia per confermare',
    exclusive:        'Esclusivo',
  },
  pt: {
    buttonText:       { today: 'Hoje', day: 'Dia', week: 'Semana', month: 'Mês' },
    weekText:         'Sem',
    allDayText:       'Dia inteiro',
    moreLinkText:     n => `+${n} mais`,
    noEventsText:     'Sem eventos para exibir',
    allFilter:        'Todos',
    releaseToConfirm: 'Solte para confirmar',
    exclusive:        'Exclusivo',
  },
  'pt-br': {
    buttonText:       { today: 'Hoje', day: 'Dia', week: 'Semana', month: 'Mês' },
    weekText:         'Sem',
    allDayText:       'Dia todo',
    moreLinkText:     n => `+${n} mais`,
    noEventsText:     'Nenhum evento para exibir',
    allFilter:        'Todos',
    releaseToConfirm: 'Solte para confirmar',
    exclusive:        'Exclusivo',
  },
  ro: {
    buttonText:       { today: 'Azi', day: 'Zi', week: 'Săptămână', month: 'Lună' },
    weekText:         'Săpt',
    allDayText:       'Toată ziua',
    moreLinkText:     n => `+${n} mai mult`,
    noEventsText:     'Niciun eveniment de afișat',
    allFilter:        'Toate',
    releaseToConfirm: 'Eliberați pentru confirmare',
    exclusive:        'Exclusiv',
  },
  ca: {
    buttonText:       { today: 'Avui', day: 'Dia', week: 'Setmana', month: 'Mes' },
    weekText:         'Set',
    allDayText:       'Tot el dia',
    moreLinkText:     n => `+${n} més`,
    noEventsText:     "No hi ha esdeveniments per mostrar",
    allFilter:        'Tots',
    releaseToConfirm: 'Deixa anar per confirmar',
    exclusive:        'Exclusiu',
  },
  gl: {
    buttonText:       { today: 'Hoxe', day: 'Día', week: 'Semana', month: 'Mes' },
    weekText:         'Sem',
    allDayText:       'Todo o día',
    moreLinkText:     n => `+${n} máis`,
    noEventsText:     'Non hai eventos para mostrar',
    allFilter:        'Todos',
    releaseToConfirm: 'Soltar para confirmar',
    exclusive:        'Exclusivo',
  },
  eu: {
    buttonText:       { today: 'Gaur', day: 'Eguna', week: 'Astea', month: 'Hilabetea' },
    weekText:         'Ast',
    allDayText:       'Egun osoa',
    moreLinkText:     n => `+${n} gehiago`,
    noEventsText:     'Ez dago erakusteko ekitaldirik',
    allFilter:        'Guztiak',
    releaseToConfirm: 'Askatu baieztatzeko',
    exclusive:        'Esklusibo',
  },
  // ── Slavic ────────────────────────────────────────────────────────────────
  pl: {
    buttonText:       { today: 'Dziś', day: 'Dzień', week: 'Tydzień', month: 'Miesiąc' },
    weekText:         'Tydz',
    allDayText:       'Cały dzień',
    moreLinkText:     n => `+${n} więcej`,
    noEventsText:     'Brak wydarzeń do wyświetlenia',
    allFilter:        'Wszystkie',
    releaseToConfirm: 'Puść, aby potwierdzić',
    exclusive:        'Ekskluzywny',
  },
  cs: {
    buttonText:       { today: 'Dnes', day: 'Den', week: 'Týden', month: 'Měsíc' },
    weekText:         'Týd',
    allDayText:       'Celý den',
    moreLinkText:     n => `+${n} dalších`,
    noEventsText:     'Žádné události k zobrazení',
    allFilter:        'Vše',
    releaseToConfirm: 'Pusťte pro potvrzení',
    exclusive:        'Exkluzivní',
  },
  sk: {
    buttonText:       { today: 'Dnes', day: 'Deň', week: 'Týždeň', month: 'Mesiac' },
    weekText:         'Týž',
    allDayText:       'Celý deň',
    moreLinkText:     n => `+${n} ďalších`,
    noEventsText:     'Žiadne udalosti na zobrazenie',
    allFilter:        'Všetky',
    releaseToConfirm: 'Uvoľnite pre potvrdenie',
    exclusive:        'Exkluzívny',
  },
  ru: {
    buttonText:       { today: 'Сегодня', day: 'День', week: 'Неделя', month: 'Месяц' },
    weekText:         'Нед',
    allDayText:       'Весь день',
    moreLinkText:     n => `+${n} ещё`,
    noEventsText:     'Нет событий для отображения',
    allFilter:        'Все',
    releaseToConfirm: 'Отпустите для подтверждения',
    exclusive:        'Эксклюзив',
  },
  uk: {
    buttonText:       { today: 'Сьогодні', day: 'День', week: 'Тиждень', month: 'Місяць' },
    weekText:         'Тиж',
    allDayText:       'Весь день',
    moreLinkText:     n => `+${n} ще`,
    noEventsText:     'Немає подій для відображення',
    allFilter:        'Всі',
    releaseToConfirm: 'Відпустіть для підтвердження',
    exclusive:        'Ексклюзивно',
  },
  bg: {
    buttonText:       { today: 'Днес', day: 'Ден', week: 'Седмица', month: 'Месец' },
    weekText:         'Седм',
    allDayText:       'Целодневно',
    moreLinkText:     n => `+${n} още`,
    noEventsText:     'Няма събития за показване',
    allFilter:        'Всички',
    releaseToConfirm: 'Пуснете за потвърждение',
    exclusive:        'Ексклузивно',
  },
  hr: {
    buttonText:       { today: 'Danas', day: 'Dan', week: 'Tjedan', month: 'Mjesec' },
    weekText:         'Tje',
    allDayText:       'Cijeli dan',
    moreLinkText:     n => `+${n} više`,
    noEventsText:     'Nema događaja za prikaz',
    allFilter:        'Sve',
    releaseToConfirm: 'Pustite za potvrdu',
    exclusive:        'Isključivo',
  },
  sr: {
    buttonText:       { today: 'Danas', day: 'Dan', week: 'Nedelja', month: 'Mesec' },
    weekText:         'Ned',
    allDayText:       'Ceo dan',
    moreLinkText:     n => `+${n} više`,
    noEventsText:     'Nema događaja za prikaz',
    allFilter:        'Sve',
    releaseToConfirm: 'Pustite za potvrdu',
    exclusive:        'Isključivo',
  },
  sl: {
    buttonText:       { today: 'Danes', day: 'Dan', week: 'Teden', month: 'Mesec' },
    weekText:         'Ted',
    allDayText:       'Cel dan',
    moreLinkText:     n => `+${n} več`,
    noEventsText:     'Ni dogodkov za prikaz',
    allFilter:        'Vse',
    releaseToConfirm: 'Spustite za potrditev',
    exclusive:        'Izključno',
  },
  mk: {
    buttonText:       { today: 'Денес', day: 'Ден', week: 'Недела', month: 'Месец' },
    weekText:         'Нед',
    allDayText:       'Цел ден',
    moreLinkText:     n => `+${n} повеќе`,
    noEventsText:     'Нема настани за прикажување',
    allFilter:        'Сите',
    releaseToConfirm: 'Пуштете за потврдување',
    exclusive:        'Ексклузивно',
  },
  // ── Baltic ────────────────────────────────────────────────────────────────
  lt: {
    buttonText:       { today: 'Šiandien', day: 'Diena', week: 'Savaitė', month: 'Mėnuo' },
    weekText:         'Sav',
    allDayText:       'Visą dieną',
    moreLinkText:     n => `+${n} daugiau`,
    noEventsText:     'Nėra įvykių rodyti',
    allFilter:        'Visi',
    releaseToConfirm: 'Atleiskite patvirtinti',
    exclusive:        'Išskirtinis',
  },
  lv: {
    buttonText:       { today: 'Šodien', day: 'Diena', week: 'Nedēļa', month: 'Mēnesis' },
    weekText:         'Ned',
    allDayText:       'Visu dienu',
    moreLinkText:     n => `+${n} vairāk`,
    noEventsText:     'Nav notikumu ko rādīt',
    allFilter:        'Visi',
    releaseToConfirm: 'Atlaist apstiprināšanai',
    exclusive:        'Ekskluzīvs',
  },
  et: {
    buttonText:       { today: 'Täna', day: 'Päev', week: 'Nädal', month: 'Kuu' },
    weekText:         'Nd',
    allDayText:       'Kogu päev',
    moreLinkText:     n => `+${n} rohkem`,
    noEventsText:     'Sündimusi ei ole kuvada',
    allFilter:        'Kõik',
    releaseToConfirm: 'Vabasta kinnitamiseks',
    exclusive:        'Eksklusiivne',
  },
  // ── Uralic ────────────────────────────────────────────────────────────────
  hu: {
    buttonText:       { today: 'Ma', day: 'Nap', week: 'Hét', month: 'Hónap' },
    weekText:         'Hét',
    allDayText:       'Egész nap',
    moreLinkText:     n => `+${n} további`,
    noEventsText:     'Nincs megjeleníthető esemény',
    allFilter:        'Összes',
    releaseToConfirm: 'Engedje el a megerősítéshez',
    exclusive:        'Kizárólagos',
  },
  // ── Hellenic ──────────────────────────────────────────────────────────────
  el: {
    buttonText:       { today: 'Σήμερα', day: 'Ημέρα', week: 'Εβδομάδα', month: 'Μήνας' },
    weekText:         'Εβδ',
    allDayText:       'Όλη μέρα',
    moreLinkText:     n => `+${n} ακόμα`,
    noEventsText:     'Δεν υπάρχουν γεγονότα προς εμφάνιση',
    allFilter:        'Όλα',
    releaseToConfirm: 'Αφήστε για επιβεβαίωση',
    exclusive:        'Αποκλειστικό',
  },
  // ── Turkic ────────────────────────────────────────────────────────────────
  tr: {
    buttonText:       { today: 'Bugün', day: 'Gün', week: 'Hafta', month: 'Ay' },
    weekText:         'Hf',
    allDayText:       'Tüm gün',
    moreLinkText:     n => `+${n} daha`,
    noEventsText:     'Gösterilecek etkinlik yok',
    allFilter:        'Tümü',
    releaseToConfirm: 'Onaylamak için bırakın',
    exclusive:        'Özel',
  },
  az: {
    buttonText:       { today: 'Bu gün', day: 'Gün', week: 'Həftə', month: 'Ay' },
    weekText:         'Hft',
    allDayText:       'Bütün gün',
    moreLinkText:     n => `+${n} daha`,
    noEventsText:     'Göstəriləcək hadisə yoxdur',
    allFilter:        'Hamısı',
    releaseToConfirm: 'Təsdiqləmək üçün buraxın',
    exclusive:        'Eksklüziv',
  },
  kk: {
    buttonText:       { today: 'Бүгін', day: 'Күн', week: 'Апта', month: 'Ай' },
    weekText:         'Апт',
    allDayText:       'Бүкіл күн',
    moreLinkText:     n => `+${n} тағы`,
    noEventsText:     'Көрсетілетін оқиғалар жоқ',
    allFilter:        'Барлығы',
    releaseToConfirm: 'Растау үшін жіберіңіз',
    exclusive:        'Эксклюзивті',
  },
  // ── Semitic / RTL ─────────────────────────────────────────────────────────
  ar: {
    direction:        'rtl',
    buttonText:       { today: 'اليوم', day: 'يوم', week: 'أسبوع', month: 'شهر' },
    weekText:         'أسبوع',
    allDayText:       'اليوم كله',
    moreLinkText:     n => `+${n} أكثر`,
    noEventsText:     'لا توجد أحداث للعرض',
    allFilter:        'الكل',
    releaseToConfirm: 'اترك للتأكيد',
    exclusive:        'حصري',
  },
  he: {
    direction:        'rtl',
    buttonText:       { today: 'היום', day: 'יום', week: 'שבוע', month: 'חודש' },
    weekText:         'שבוע',
    allDayText:       'כל היום',
    moreLinkText:     n => `+${n} נוסף`,
    noEventsText:     'אין אירועים להצגה',
    allFilter:        'הכל',
    releaseToConfirm: 'שחרר לאישור',
    exclusive:        'בלעדי',
  },
  fa: {
    direction:        'rtl',
    buttonText:       { today: 'امروز', day: 'روز', week: 'هفته', month: 'ماه' },
    weekText:         'هفته',
    allDayText:       'تمام روز',
    moreLinkText:     n => `+${n} بیشتر`,
    noEventsText:     'رویدادی برای نمایش وجود ندارد',
    allFilter:        'همه',
    releaseToConfirm: 'برای تأیید رها کنید',
    exclusive:        'انحصاری',
  },
  // ── South / Southeast Asian ───────────────────────────────────────────────
  hi: {
    buttonText:       { today: 'आज', day: 'दिन', week: 'सप्ताह', month: 'महीना' },
    weekText:         'सप्त',
    allDayText:       'पूरे दिन',
    moreLinkText:     n => `+${n} और`,
    noEventsText:     'दिखाने के लिए कोई ईवेंट नहीं',
    allFilter:        'सभी',
    releaseToConfirm: 'पुष्टि करने के लिए छोड़ें',
    exclusive:        'एकमात्र',
  },
  th: {
    buttonText:       { today: 'วันนี้', day: 'วัน', week: 'สัปดาห์', month: 'เดือน' },
    weekText:         'สัป',
    allDayText:       'ตลอดวัน',
    moreLinkText:     n => `+${n} เพิ่มเติม`,
    noEventsText:     'ไม่มีกิจกรรมที่จะแสดง',
    allFilter:        'ทั้งหมด',
    releaseToConfirm: 'ปล่อยเพื่อยืนยัน',
    exclusive:        'เฉพาะ',
  },
  vi: {
    buttonText:       { today: 'Hôm nay', day: 'Ngày', week: 'Tuần', month: 'Tháng' },
    weekText:         'Tuần',
    allDayText:       'Cả ngày',
    moreLinkText:     n => `+${n} nữa`,
    noEventsText:     'Không có sự kiện để hiển thị',
    allFilter:        'Tất cả',
    releaseToConfirm: 'Thả để xác nhận',
    exclusive:        'Độc quyền',
  },
  id: {
    buttonText:       { today: 'Hari ini', day: 'Hari', week: 'Minggu', month: 'Bulan' },
    weekText:         'Mgg',
    allDayText:       'Sepanjang hari',
    moreLinkText:     n => `+${n} lainnya`,
    noEventsText:     'Tidak ada acara untuk ditampilkan',
    allFilter:        'Semua',
    releaseToConfirm: 'Lepas untuk mengonfirmasi',
    exclusive:        'Eksklusif',
  },
  ms: {
    buttonText:       { today: 'Hari ini', day: 'Hari', week: 'Minggu', month: 'Bulan' },
    weekText:         'Mgg',
    allDayText:       'Sepanjang hari',
    moreLinkText:     n => `+${n} lagi`,
    noEventsText:     'Tiada acara untuk dipaparkan',
    allFilter:        'Semua',
    releaseToConfirm: 'Lepaskan untuk mengesahkan',
    exclusive:        'Eksklusif',
  },
  km: {
    buttonText:       { today: 'ថ្ងៃនេះ', day: 'ថ្ងៃ', week: 'សប្ដាហ៍', month: 'ខែ' },
    weekText:         'សប្ដ',
    allDayText:       'ពេញមួយថ្ងៃ',
    moreLinkText:     n => `+${n} ទៀត`,
    noEventsText:     'មិនមានព្រឹត្តិការណ៍ដែលត្រូវបង្ហាញ',
    allFilter:        'ទាំងអស់',
    releaseToConfirm: 'លែងដើម្បីបញ្ជាក់',
    exclusive:        'ផ្តាច់មុខ',
  },
  ne: {
    buttonText:       { today: 'आज', day: 'दिन', week: 'हप्ता', month: 'महिना' },
    weekText:         'हप्ता',
    allDayText:       'सारा दिन',
    moreLinkText:     n => `+${n} थप`,
    noEventsText:     'देखाउन कुनै कार्यक्रम छैन',
    allFilter:        'सबै',
    releaseToConfirm: 'पुष्टि गर्न छोड्नुहोस्',
    exclusive:        'विशेष',
  },
  // ── East Asian ────────────────────────────────────────────────────────────
  'zh-cn': {
    buttonText:       { today: '今天', day: '日', week: '周', month: '月' },
    weekText:         '周',
    allDayText:       '全天',
    moreLinkText:     n => `+${n} 个`,
    noEventsText:     '没有可显示的事件',
    allFilter:        '全部',
    releaseToConfirm: '松开以确认',
    exclusive:        '独占',
  },
  'zh-tw': {
    buttonText:       { today: '今天', day: '日', week: '週', month: '月' },
    weekText:         '週',
    allDayText:       '整天',
    moreLinkText:     n => `+${n} 個`,
    noEventsText:     '沒有可顯示的事件',
    allFilter:        '全部',
    releaseToConfirm: '放開以確認',
    exclusive:        '獨占',
  },
  ja: {
    buttonText:       { today: '今日', day: '日', week: '週', month: '月' },
    weekText:         '週',
    allDayText:       '終日',
    moreLinkText:     n => `他${n}件`,
    noEventsText:     '表示するイベントはありません',
    allFilter:        'すべて',
    releaseToConfirm: '離して確定',
    exclusive:        '排他的',
  },
  ko: {
    buttonText:       { today: '오늘', day: '일', week: '주', month: '월' },
    weekText:         '주',
    allDayText:       '종일',
    moreLinkText:     n => `+${n} 개`,
    noEventsText:     '표시할 이벤트가 없습니다',
    allFilter:        '전체',
    releaseToConfirm: '놓아서 확인',
    exclusive:        '단독',
  },
  ka: {
    buttonText:       { today: 'დღეს', day: 'დღე', week: 'კვირა', month: 'თვე' },
    weekText:         'კვრ',
    allDayText:       'მთელი დღე',
    moreLinkText:     n => `+${n} სხვა`,
    noEventsText:     'საჩვენებელი მოვლენები არ არის',
    allFilter:        'ყველა',
    releaseToConfirm: 'გაუშვი დასადასტურებლად',
    exclusive:        'ექსკლუზიური',
  },
  // ── Caucasian / Armenian ──────────────────────────────────────────────────
  'hy-am': {
    buttonText:       { today: 'Այսօր', day: 'Օր', week: 'Շաբաթ', month: 'Ամիս' },
    weekText:         'Շաբ',
    allDayText:       'Ամբողջ օրը',
    moreLinkText:     n => `+${n} ավելի`,
    noEventsText:     'Ցուցադրելու իրադարձություններ չկան',
    allFilter:        'Բոլոր',
    releaseToConfirm: 'Բաց թողնել հաստատելու համար',
    exclusive:        'Բացառիկ',
  },
  // ── English regional variants ─────────────────────────────────────────────
  'en-gb':  {},   // same as en
  'en-au':  {},   // same as en
  'en-nz':  {},   // same as en
};

/**
 * Resolve the full DsLocale for a given BCP-47 locale code.
 * Lookup order: exact key → language prefix (e.g. 'zh-CN' → 'zh-cn', then 'zh') → 'en'.
 * An optional override object is merged last so callers can patch individual strings.
 */
export function resolveLocale(locale: string, override?: Partial<Omit<DsLocale, 'buttonText' | 'moreLinkText'>> & { buttonText?: Partial<DsLocale['buttonText']>; moreLinkText?: (n: number) => string }): DsLocale {
  const lower = locale.toLowerCase();
  const partial: PartialLocale =
    PARTIAL[lower] ??
    PARTIAL[lower.split('-')[0]] ??
    {};

  const base: DsLocale = {
    ...EN,
    ...partial,
    buttonText: { ...EN.buttonText, ...(partial.buttonText ?? {}) },
  };

  if (!override) return base;
  return {
    ...base,
    ...override,
    buttonText: { ...base.buttonText, ...(override.buttonText ?? {}) },
  };
}
