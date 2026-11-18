/**
 * Єдиний стиль Subnetic: усі повторювані набори Tailwind-класів.
 *
 * Правила:
 * - кожне значення — ПОВНИЙ рядок класів (без шаблонів на кшталт `bg-${color}`),
 *   інакше Tailwind не знайде класи під час збірки;
 * - кольори тільки через токени теми (bg-card, text-muted, border-border, bg-primary…),
 *   жодних hex у компонентах — значення токенів у src/index.css.
 */
export const ui = {
  page: {
    shell: 'flex min-h-screen flex-col',
    header: 'w-full border-b border-border bg-header',
    headerInner: 'mx-auto flex w-full max-w-[1360px] items-center justify-between gap-4 px-4 py-3.5 sm:px-10',
    container: 'mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-10',
    centered: 'flex flex-1 items-center justify-center px-4 py-12 sm:px-6',
    footer: 'px-6 pb-7 text-center text-[13px] text-muted',
    heading: 'flex flex-col gap-1.5',
    title: 'text-[28px] font-bold leading-[34px] tracking-[-0.02em] text-text',
    subtitle: 'text-[15px] text-muted',
    sectionTitle: 'text-xl font-semibold text-text',
    text: 'text-[15px] text-text',
    muted: 'text-[15px] text-muted',
    loader: 'flex min-h-screen items-center justify-center',
    authFooter: 'text-center text-[15px] text-muted',
    inlineRow: 'flex flex-wrap items-center justify-between gap-2',
  },

  card: {
    base: 'rounded-2xl border border-border bg-card text-text shadow-sm',
    padded: 'rounded-2xl border border-border bg-card p-6 text-text shadow-sm',
    auth: 'flex w-full max-w-[440px] flex-col gap-6 rounded-2xl border border-border bg-card p-6 text-text shadow-sm sm:p-9',
  },

  btn: {
    primary:
      'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[15px] font-semibold text-on-primary shadow-sm shadow-primary/30 transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-70',
    secondary:
      'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-control-border bg-card px-5 text-[15px] font-semibold text-text transition-colors hover:bg-hover/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-70',
    ghost:
      'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-transparent px-4 text-[15px] font-semibold text-muted transition-colors hover:bg-hover/[0.06] hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-70',
    danger:
      'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-danger-solid px-5 text-[15px] font-semibold text-on-primary shadow-sm transition-colors hover:bg-danger-solid/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-70',
    icon: 'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-control-border bg-card text-muted transition-colors hover:bg-hover/[0.06] hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    /** Іконка всередині поля (показати пароль тощо). */
    inset:
      'absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus',
    block: 'w-full',
  },

  input: {
    base: 'h-11 w-full rounded-[10px] border border-input-border bg-input-bg px-3.5 text-[15px] text-text placeholder:text-muted focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-focus disabled:cursor-not-allowed disabled:opacity-60',
    invalid:
      'h-11 w-full rounded-[10px] border border-danger bg-input-bg px-3.5 text-[15px] text-text placeholder:text-muted focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-focus disabled:cursor-not-allowed disabled:opacity-60',
    /** Місце справа під кнопку-іконку або стрілку select. */
    withAction: 'pr-12',
    withLeading: 'pl-11',
    leadingIcon: 'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted',
    wrapper: 'relative',
    selectArrow: 'pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted',
  },

  field: {
    wrapper: 'flex w-full flex-col gap-1.5',
    form: 'flex flex-col gap-[18px]',
  },
  label: 'text-sm font-semibold text-text',
  hint: 'text-[13px] text-muted',
  error: 'flex items-center gap-1.5 text-[13px] font-medium text-danger',

  checkbox: {
    label: 'flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] text-text',
    input:
      'm-0 h-5 w-5 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
  },

  link: {
    default: 'font-semibold text-link hover:underline',
    small: 'text-sm font-semibold text-link hover:underline',
  },

  alert: {
    info: 'flex items-start gap-2.5 rounded-xl bg-info-bg px-3.5 py-3 text-sm text-info-text',
    success: 'flex items-start gap-2.5 rounded-xl bg-success-bg px-3.5 py-3 text-sm text-success-text',
    error: 'flex items-start gap-2.5 rounded-xl bg-danger-bg px-3.5 py-3 text-sm text-danger',
    icon: 'mt-px shrink-0',
  },

  badge: {
    neutral: 'inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-bg px-3 text-[13px] font-semibold text-muted',
    accent: 'inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-accent-soft px-3 text-[13px] font-semibold text-accent-text',
    success: 'inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-success-bg px-3 text-[13px] font-semibold text-success-text',
    warning: 'inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-warning-bg px-3 text-[13px] font-semibold text-warning-text',
    danger: 'inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-danger-bg px-3 text-[13px] font-semibold text-danger',
    info: 'inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-info-bg px-3 text-[13px] font-semibold text-info-text',
  },

  badgeDot: 'h-1.5 w-1.5 shrink-0 rounded-full bg-current',

  modal: {
    dialogLg:
      'm-auto w-[calc(100%-2rem)] max-w-[720px] rounded-[20px] border border-border bg-card p-0 text-text shadow-xl backdrop:bg-bg/70 backdrop:backdrop-blur-sm',
    dialog:
      'm-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border bg-card p-0 text-text shadow-xl backdrop:bg-bg/70 backdrop:backdrop-blur-sm',
    header: 'flex items-start justify-between gap-4 border-b border-border px-6 py-4',
    title: 'text-lg font-semibold text-text',
    body: 'px-6 py-5 text-[15px] text-text',
    footer: 'flex flex-wrap justify-end gap-3 border-t border-border bg-bg/50 px-6 py-4',
    grid: 'grid grid-cols-1 gap-5 sm:grid-cols-2',
    full: 'sm:col-span-2',
    close:
      'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-hover/[0.06] hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
  },

  table: {
    wrapper: 'overflow-x-auto rounded-2xl border border-border bg-card lg:overflow-visible',
    table: 'w-full border-collapse text-left text-sm text-text',
    head: 'bg-bg text-muted',
    th: 'px-4 py-3 text-xs font-semibold uppercase tracking-wide',
    row: 'border-t border-border transition-colors hover:bg-hover/[0.03]',
    td: 'px-4 py-3 align-middle',
    tdMuted: 'px-4 py-3 align-middle text-sm text-muted',
    tdActions: 'px-2 py-2 text-right align-middle',
    wide: 'min-w-[880px]',
    footer: 'flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4 text-sm text-muted',
  },

  responsive: {
    desktopOnly: 'hidden md:block',
    mobileOnly: 'md:hidden',
  },

  /** Картка-рядок списку на мобільних. */
  itemCard: {
    list: 'flex flex-col gap-3',
    card: 'flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-text shadow-sm',
    top: 'flex items-start gap-3',
    grid: 'grid grid-cols-2 gap-x-4 gap-y-2 text-sm',
    label: 'text-xs text-muted',
    value: 'text-sm font-medium text-text',
  },

  spinner: {
    sm: 'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
    md: 'inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent',
    lg: 'inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-current border-t-transparent text-accent',
  },

  state: {
    wrapper: 'flex flex-col items-center gap-3 px-6 py-12 text-center',
    iconNeutral: 'flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-muted',
    iconDanger: 'flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-bg text-danger',
    title: 'text-lg font-semibold text-text',
    text: 'max-w-md text-[15px] text-muted',
  },

  serviceIcon: {
    sm: 'h-8 w-8 shrink-0 overflow-hidden rounded-lg',
    md: 'h-10 w-10 shrink-0 overflow-hidden rounded-xl',
    lg: 'h-14 w-14 shrink-0 overflow-hidden rounded-2xl',
    img: 'h-full w-full object-contain',
    tile: 'flex h-full w-full items-center justify-center font-bold',
    letterSm: 'text-sm',
    letterMd: 'text-base',
    letterLg: 'text-xl',
  },

  logo: {
    wrapper: 'flex items-center gap-3',
    mark: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary',
    text: 'text-xl font-bold tracking-[-0.01em] text-text',
    link: 'rounded-xl',
  },

  // ── Каркас застосунку ─────────────────────────────────────

  appHeader: {
    bar: 'w-full border-b border-border bg-header shadow-sm',
    inner: 'mx-auto flex w-full max-w-[1360px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3.5 sm:px-10',
    brand: 'flex min-w-0 flex-1 items-center xl:basis-0',
    actions: 'flex items-center justify-end gap-2 sm:gap-3 xl:flex-1 xl:basis-0',
    navWrap: 'order-last w-full overflow-x-auto xl:order-none xl:w-auto',
  },

  nav: {
    pill: 'flex w-max items-center gap-1 rounded-[15px] border border-border bg-bg p-1',
    link: 'flex min-h-11 items-center gap-2 whitespace-nowrap rounded-[11px] px-4 text-[15px] font-medium text-muted transition-colors hover:bg-hover/[0.06] hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    linkActive:
      'flex min-h-11 items-center gap-2 whitespace-nowrap rounded-[11px] bg-primary px-4 text-[15px] font-semibold text-on-primary shadow-sm shadow-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    label: 'hidden sm:inline',
    labelSr: 'sr-only sm:hidden',
  },

  profileChip: {
    link: 'flex min-h-12 items-center gap-2.5 rounded-xl border border-control-border bg-card py-1.5 pl-1.5 pr-3 text-text transition-colors hover:bg-hover/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    avatar: 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-on-primary',
    name: 'hidden max-w-[10rem] truncate text-sm font-semibold md:inline',
  },

  // ── Сторінки ──────────────────────────────────────────────

  layout: {
    stack: 'flex flex-col gap-6 [&>*]:min-w-0',
    pageHeader: 'flex flex-wrap items-center justify-between gap-4',
    pageTitle: 'text-[28px] font-bold leading-9 tracking-[-0.02em] text-text',
    pageSubtitle: 'text-[15px] text-muted',
    grid3: 'grid grid-cols-1 gap-6 md:grid-cols-3',
    grid2: 'grid grid-cols-1 items-start gap-6 lg:grid-cols-2 [&>*]:min-w-0',
    mainAside: 'grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] [&>*]:min-w-0',
    mainAsideWide: 'grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] [&>*]:min-w-0',
    column: 'flex min-w-0 flex-col gap-6',
    toolbar: 'flex flex-wrap items-end gap-4',
    cardHeader: 'flex flex-wrap items-center justify-between gap-3',
    cardTitle: 'text-lg font-semibold leading-6 text-text',
    cardStack: 'flex flex-col gap-5',
    loadingCard: 'flex justify-center py-16',
    loadingInline: 'flex justify-center py-10',
  },

  statCard: {
    card: 'flex items-start gap-4 rounded-2xl border border-border bg-card p-6 text-text shadow-sm',
    icon: 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-text',
    body: 'flex min-w-0 flex-col gap-1',
    label: 'text-sm font-medium text-muted',
    value: 'text-[32px] font-bold leading-[38px] tracking-[-0.02em] text-text',
    hint: 'text-[13px] text-muted',
  },

  /** Акцентний блок «Найближче списання». */
  hero: {
    card: 'flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-primary px-6 py-6 text-on-primary shadow-md shadow-primary/25 sm:px-7',
    main: 'flex min-w-0 items-center gap-4',
    iconRing: 'flex rounded-[18px] bg-on-primary p-[3px]',
    eyebrow: 'text-xs font-semibold uppercase tracking-[0.08em]',
    title: 'text-[22px] font-bold leading-7',
    text: 'flex min-w-0 flex-col gap-1',
    meta: 'text-sm',
    side: 'flex flex-wrap items-center gap-x-8 gap-y-4',
    amount: 'text-4xl font-bold leading-10 tracking-[-0.02em]',
    pill: 'inline-flex min-h-8 items-center rounded-full bg-on-primary px-3.5 text-sm font-semibold text-ink',
    button:
      'inline-flex min-h-11 items-center justify-center rounded-xl bg-on-primary px-5 text-[15px] font-semibold text-primary transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-primary',
  },

  section: {
    header: 'flex items-start gap-3',
    icon: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-text',
    titles: 'flex flex-col gap-0.5',
    title: 'text-lg font-semibold text-text',
    subtitle: 'text-sm text-muted',
    divider: 'flex flex-col gap-1 border-t border-border pt-4',
    subheading: 'mb-1 text-[15px] font-semibold text-text',
  },

  list: {
    plain: 'flex flex-col',
    row: 'flex items-center gap-3 border-t border-border py-3 first:border-t-0',
    rowBordered: 'flex items-center gap-3 border-t border-border py-3',
    main: 'flex min-w-0 flex-1 flex-col',
    title: 'truncate text-[15px] font-semibold text-text',
    meta: 'truncate text-[13px] text-muted',
    amount: 'shrink-0 text-right text-[15px] font-semibold text-text',
    cell: 'flex min-w-0 items-center gap-3',
    end: 'flex flex-col items-end',
    iconBox: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent-text',
  },

  /** Чипи-фільтри статусів. */
  chip: {
    group: 'flex flex-wrap gap-2',
    off: 'inline-flex min-h-10 items-center gap-1.5 rounded-full border border-input-border bg-card px-4 text-sm font-semibold text-text transition-colors hover:bg-hover/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    on: 'inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary bg-primary px-4 text-sm font-semibold text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    count: 'font-medium opacity-80',
  },

  tabs: {
    list: 'flex gap-1 rounded-xl bg-bg p-1',
    tab: 'min-h-10 rounded-[9px] px-4 text-sm font-semibold text-muted transition-colors hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    tabActive:
      'min-h-10 rounded-[9px] bg-primary px-4 text-sm font-semibold text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
  },

  /** Кнопки-іконки в рядках таблиць і списків (40×40). */
  iconBtn: {
    neutral:
      'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-muted transition-colors hover:bg-hover/[0.06] hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50',
    danger:
      'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-danger transition-colors hover:bg-danger-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50',
    bordered:
      'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-input-border bg-card text-text transition-colors hover:bg-hover/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50',
  },

  /** Компактна контурна кнопка дії в рядку («Оплачено»). */
  btnInline: {
    accent:
      'inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-link px-3.5 text-sm font-semibold text-link transition-colors hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60',
    danger:
      'inline-flex min-h-11 items-center gap-2 rounded-xl border border-danger px-[18px] text-[15px] font-semibold text-danger transition-colors hover:bg-danger-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60',
  },

  menu: {
    root: 'relative inline-flex',
    panel: 'absolute right-0 top-full z-30 mt-1 flex min-w-[13rem] flex-col rounded-xl border border-border bg-card p-1 shadow-lg',
    item: 'flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium text-text hover:bg-hover/[0.06] focus-visible:bg-hover/[0.06] focus-visible:outline-none',
    itemDanger:
      'flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium text-danger hover:bg-danger-bg focus-visible:bg-danger-bg focus-visible:outline-none',
    separator: 'my-1 h-px bg-border',
  },

  switch: {
    row: 'flex min-h-11 cursor-pointer items-center justify-between gap-4 text-[15px] text-text',
    trackOn:
      'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60',
    trackOff:
      'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-input-border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60',
    thumbOn: 'inline-block h-5 w-5 translate-x-6 rounded-full bg-on-primary shadow transition-transform',
    thumbOff: 'inline-block h-5 w-5 translate-x-1 rounded-full bg-on-primary shadow transition-transform',
  },

  legend: {
    list: 'flex flex-wrap gap-4 text-[13px] text-muted',
    item: 'inline-flex items-center gap-1.5',
    paid: 'h-3 w-3 rounded-[3px] border border-success-text bg-success-bg',
    expected: 'h-3 w-3 rounded-[3px] border border-accent-text bg-accent-soft',
    trial: 'h-3 w-3 rounded-[3px] border border-info-text bg-info-bg',
    actual: 'h-3 w-3 rounded-[3px] bg-accent/60',
    current: 'h-3 w-3 rounded-[3px] bg-primary',
    forecast: 'h-3 w-3 rounded-[3px] border-2 border-dashed border-primary',
  },

  calendar: {
    header: 'flex flex-wrap items-center justify-between gap-3',
    nav: 'flex items-center gap-2',
    title: 'min-w-[150px] text-center text-lg font-semibold text-text',
    root: 'w-full',
    months: 'w-full',
    month: 'w-full',
    grid: 'w-full table-fixed border-separate border-spacing-0.5 sm:border-spacing-1.5',
    weekday: 'py-1 text-center text-[13px] font-semibold text-muted',
    day: 'h-14 p-0 align-top sm:h-[84px]',
    dayButton:
      'flex h-full w-full flex-col items-start gap-1 overflow-hidden rounded-[10px] border border-border bg-card p-1.5 text-left sm:p-2 text-text transition-colors hover:bg-hover/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    selected: '[&>button]:border-2 [&>button]:border-primary [&>button]:bg-accent-soft',
    outside: '[&>button]:border-transparent [&>button]:bg-transparent [&>button]:text-muted',
    today: '',
    dayNumber: 'text-sm font-medium',
    dayNumberToday:
      'inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-text text-[13px] font-bold text-bg',
    chips: 'hidden w-full flex-col gap-[3px] sm:flex',
    dots: 'flex flex-wrap gap-0.5 sm:hidden',
    dotPaid: 'h-2 w-2 rounded-full bg-success-text',
    dotExpected: 'h-2 w-2 rounded-full bg-accent-text',
    dotTrial: 'h-2 w-2 rounded-full bg-info-text',
    dotOverdue: 'h-2 w-2 rounded-full bg-danger',
    chipPaid: 'block w-full truncate rounded-md bg-success-bg px-1.5 py-0.5 text-xs font-semibold text-success-text',
    chipExpected: 'block w-full truncate rounded-md bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent-text',
    chipTrial: 'block w-full truncate rounded-md bg-info-bg px-1.5 py-0.5 text-xs font-semibold text-info-text',
    chipOverdue: 'block w-full truncate rounded-md bg-danger-bg px-1.5 py-0.5 text-xs font-semibold text-danger',
    more: 'text-xs font-medium text-muted',
  },

  summary: {
    grid: 'grid grid-cols-2 gap-3',
    box: 'flex flex-col gap-1 rounded-xl border border-border p-4',
    label: 'text-[13px] font-medium text-muted',
    value: 'text-xl font-bold text-text',
  },

  /** Блок з рамкою всередині картки (платіж обраного дня, стан Telegram). */
  inset: {
    box: 'flex flex-col gap-4 rounded-xl border border-border p-4',
    row: 'flex flex-wrap items-center gap-3 rounded-xl border border-border bg-bg px-4 py-3.5',
  },

  money: {
    main: 'text-[15px] font-semibold text-text',
    sub: 'text-xs text-muted',
    subBlock: 'block text-xs text-muted',
    big: 'text-xl font-bold text-text',
  },

  filters: {
    search: 'min-w-[240px] flex-1',
    select: 'w-full sm:w-52',
    narrow: 'w-full sm:w-44',
  },

  chart: {
    box: 'h-[240px] w-full text-muted',
    barActual: 'fill-accent/60',
    barCurrent: 'fill-primary',
    barForecast: 'fill-accent-soft stroke-primary stroke-2 [stroke-dasharray:5_4]',
    grid: 'stroke-border',
    tick: 'fill-muted text-xs',
    tickCurrent: 'fill-text text-xs font-bold',
    cursor: 'fill-hover/[0.05]',
    tooltip: 'rounded-xl border border-border bg-card px-3 py-2 text-sm text-text shadow-lg',
    tooltipLabel: 'text-xs font-medium text-muted',
  },

  srOnly: 'sr-only',
} as const;
