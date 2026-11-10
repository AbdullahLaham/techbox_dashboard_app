// components/landing/content.ts
// All landing page copy and data in one place.
//
// Brand facts come from the public Instagram profile @tech_.box (bio: "Empowering Future
// Tech Talent · Training • Real Projects • Career Growth"; highlights: courses, workshops,
// graduation). TechBox presents itself here as an incubator; kids' programs are not offered.
//
// ⚠️ TODO(verify): apart from the follower count, IMPACT_STATS and SUCCESS_STORIES are
// illustrative placeholders, not TechBox's real figures or graduates. Replace them with
// verified numbers and approved testimonials (with the person's consent) before launch.
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Compass, GraduationCap, Hammer, Rocket, TrendingUp } from 'lucide-react';
import { PROGRAM_TYPE_LABELS, STARTUP_STAGE_LABELS } from '@/lib/labels';
import { ProgramType } from '@/types/program';
import { StartupStage } from '@/types/dashboard';

/** Verified: Instagram showed 26.6K followers (Nov 2026). Rounded down so it stays true. */
export const INSTAGRAM_FOLLOWERS = 26000;

export const NAV_LINKS = [
  { label: 'من نحن', href: '#about' },
  { label: 'البرامج', href: '#programs' },
  { label: 'مسار الاحتضان', href: '#pipeline' },
  { label: 'الأثر', href: '#impact' },
  { label: 'تواصل معنا', href: '#contact' },
] as const;

export const HERO = {
  tagline: 'حاضنة أعمال ومنصة تعليمية في غزة',
  /** The title is split so the accent can carry the gold treatment. */
  titleLead: 'كل شركة تقنية بدأت',
  titleAccent: 'فكرةً في صندوق.',
  description:
    'في TechBox نمكّن مواهب التقنية القادمة: تدريب عملي، مشاريع حقيقية، ونمو مهني يصلك بسوق العمل. ونحتضن فكرتك حتى تصير منتجاً وشركة، بإرشاد من مختصين ومعسكرات برمجة في غزة.',
  /** Labels that float out of the hero box, in the order they rise. */
  emerging: [STARTUP_STAGE_LABELS[StartupStage.IDEATION], STARTUP_STAGE_LABELS[StartupStage.MVP], 'شركة ناشئة'],
} as const;

export interface Pillar {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const ABOUT = {
  eyebrow: 'من نحن',
  title: 'نمكّن مواهب التقنية القادمة',
  description:
    'TechBox بيئة واحدة تجمع التعلّم والاحتضان. يكتسب المطوّر مهارات سوق العمل، ويجد رائد الأعمال الإرشاد والأدوات ليختبر فكرته ويبني منتجه ويجهّز شركته للمستثمرين.',
  // The three pillars of the Instagram bio: Training • Real Projects • Career Growth.
  pillars: [
    {
      icon: GraduationCap,
      title: 'تدريب عملي',
      description: 'دورات وورش عمل يقودها مدرّبون، من الأساسيات حتى مهارات سوق العمل.',
    },
    {
      icon: Hammer,
      title: 'مشاريع حقيقية',
      description: 'تتعلّم بالبناء: كل مسار ينتهي بمشروع فعلي يُضاف إلى معرض أعمالك.',
    },
    {
      icon: TrendingUp,
      title: 'نمو مهني',
      description: 'إرشاد ومتابعة يصلانك بفرص العمل، ويأخذان فكرتك حتى تصير شركة ناشئة.',
    },
  ] satisfies readonly Pillar[],
  /** What TechBox runs, after the Instagram story highlights plus the platform's programs. */
  highlights: [
    'دورات تدريبية',
    'ورش عمل',
    'مشاريع حقيقية',
    'معسكرات برمجة',
    'إرشاد مهني',
    'حفلات تخرّج',
    'احتضان الشركات الناشئة',
  ],
} as const;

export interface PipelineStage {
  stage: string;
  description: string;
  /** What the team walks away with at the end of the stage. */
  output: string;
}

/** The incubation pipeline. A real sequence, so it is numbered. */
export const JOURNEY: readonly PipelineStage[] = [
  {
    stage: STARTUP_STAGE_LABELS[StartupStage.IDEATION],
    description: 'نحدّد المشكلة والعميل، ونصوغ الفكرة في نموذج عمل واضح.',
    output: 'نموذج عمل',
  },
  {
    stage: STARTUP_STAGE_LABELS[StartupStage.VALIDATION],
    description: 'نختبر الفكرة مع عملاء حقيقيين قبل كتابة أول سطر برمجي.',
    output: 'مقابلات عملاء',
  },
  {
    stage: STARTUP_STAGE_LABELS[StartupStage.MVP],
    description: 'نبني نسخة أولى قابلة للاستخدام بمرافقة مرشدين تقنيين.',
    output: 'نسخة أولى',
  },
  {
    stage: STARTUP_STAGE_LABELS[StartupStage.GROWTH],
    description: 'نقيس ونحسّن ونوسّع قاعدة المستخدمين.',
    output: 'مؤشرات نمو',
  },
  {
    stage: STARTUP_STAGE_LABELS[StartupStage.INVESTMENT_READY],
    description: 'نجهّز العرض والأرقام لتقف أمام المستثمرين بثقة.',
    output: 'عرض استثماري',
  },
];

export const PIPELINE = {
  eyebrow: 'حاضنة TechBox',
  title: 'خمس محطات من الفكرة إلى الاستثمار',
  description: 'كل فريق في الحاضنة يمرّ بالمسار نفسه، ويخرج من كل محطة بشيء ملموس يبني عليه ما بعدها.',
} as const;

export interface ProgramOffer {
  type: ProgramType;
  label: string;
  icon: LucideIcon;
  audience: string;
  description: string;
  features: readonly string[];
}

/** One entry per platform program type. The first one is featured. */
export const PROGRAMS = {
  eyebrow: 'البرامج',
  title: 'برامج الاحتضان والتدريب',
  description: 'اختر ما يناسبك اليوم، وانتقل إلى البرنامج التالي متى كنت جاهزاً.',
  /** Live list under the program types; hidden when nothing is open. */
  open: {
    title: 'التسجيل مفتوح الآن',
    description: 'برامج تستقبل طلبات الانضمام في هذه اللحظة.',
    cta: 'التفاصيل والتقديم',
  },
  items: [
    {
      type: ProgramType.INCUBATOR_BATCH,
      label: PROGRAM_TYPE_LABELS[ProgramType.INCUBATOR_BATCH],
      icon: Rocket,
      audience: 'لفرق تملك فكرة أو منتجاً أولياً',
      description: 'دفعة احتضان بإرشاد مكثّف تأخذ شركتك من بلورة الفكرة حتى الجاهزية للاستثمار.',
      features: ['جلسات إرشاد دورية مع موجّه لفريقك', 'متابعة مراحل نمو شركتك على المنصة', 'تحضير لعرض شركتك أمام المستثمرين'],
    },
    {
      type: ProgramType.BOOTCAMP,
      label: PROGRAM_TYPE_LABELS[ProgramType.BOOTCAMP],
      icon: Hammer,
      audience: 'للمطوّرين الطموحين',
      description: 'تدريب مكثّف بمشاريع حقيقية يأخذك من الأساسيات إلى مستوى سوق العمل.',
      features: ['محاضرات مسجّلة وجلسات مباشرة', 'واجبات يقيّمها مدرّبون'],
    },
    {
      type: ProgramType.ACADEMIC_COURSE,
      label: PROGRAM_TYPE_LABELS[ProgramType.ACADEMIC_COURSE],
      icon: BookOpen,
      audience: 'للتعلّم بوتيرتك',
      description: 'مساقات منظّمة تتابع فيها تقدّمك درساً بدرس، مع اختبارات قصيرة تقيس فهمك.',
      features: ['تقدّم محفوظ في كل درس', 'اختبارات قصيرة بعد الوحدات'],
    },
    {
      type: ProgramType.WORKSHOP_SERIES,
      label: PROGRAM_TYPE_LABELS[ProgramType.WORKSHOP_SERIES],
      icon: Compass,
      audience: 'لمهارة محددة في وقت قصير',
      description: 'ورش عملية قصيرة في مهارة واحدة: من تصميم المنتج إلى كتابة العرض الاستثماري.',
      features: [],
    },
  ] satisfies readonly ProgramOffer[],
} as const;

export interface ImpactStat {
  value: number;
  suffix?: string;
  label: string;
}

export const IMPACT = {
  eyebrow: 'أثر الخرّيجين',
  title: 'خرّيجونا يبنون، ونحن نقيس الأثر',
  description: 'نقيس نجاحنا بعدد من وجدوا عملاً، وأطلقوا منتجاً، وبنوا فريقاً.',
} as const;

export const IMPACT_STATS: readonly ImpactStat[] = [
  { value: INSTAGRAM_FOLLOWERS, suffix: '+', label: 'متابع على إنستغرام' },
  // TODO(verify): placeholder figures. Replace with TechBox's real, current numbers.
  { value: 500, suffix: '+', label: 'متعلّم ومتدرّب' },
  { value: 40, suffix: '+', label: 'شركة ناشئة احتضنّاها' },
  { value: 25, label: 'برنامجاً ومعسكراً' },
];

export interface SuccessStory {
  quote: string;
  role: string;
  program: string;
}

// TODO(verify): illustrative testimonials. Replace with real, approved quotes and names.
export const SUCCESS_STORIES: readonly SuccessStory[] = [
  {
    quote:
      'دخلنا الدفعة بفكرة على ورقة، وخرجنا بمنتج يستخدمه عملاء يدفعون. الجلسات الأسبوعية مع الموجّه أنقذتنا من بناء ميزات لا يحتاجها أحد.',
    role: 'مؤسِّسة مشاركة لمنصة تعليمية',
    program: PROGRAM_TYPE_LABELS[ProgramType.INCUBATOR_BATCH],
  },
  {
    quote: 'المشاريع العملية في المعسكر صارت معرض أعمالي، وبها حصلت على أول عقد عمل عن بُعد.',
    role: 'مطوّر واجهات أمامية',
    program: PROGRAM_TYPE_LABELS[ProgramType.BOOTCAMP],
  },
  {
    quote: 'تعلّمت أن أختبر الفكرة قبل أن أكتب الكود. وفّر علينا ذلك أشهراً من العمل.',
    role: 'مؤسِّس تطبيق لوجستي',
    program: PROGRAM_TYPE_LABELS[ProgramType.WORKSHOP_SERIES],
  },
];

/** How joining works on the platform: register → apply → staff review. A real sequence. */
export const JOIN = {
  eyebrow: 'انضم إلينا',
  title: 'مكانك في الدفعة القادمة',
  description: 'التقديم عبر المنصة مباشرة، ويراجع فريق الحاضنة كل طلب ويردّ عليك داخلها.',
  steps: [
    { title: 'أنشئ حسابك', description: 'دقيقة واحدة وتصبح جزءاً من مجتمع TechBox.' },
    { title: 'قدّم على برنامج', description: 'اختر البرنامج المناسب من الدليل وأرسل طلبك.' },
    { title: 'ابدأ بعد القبول', description: 'يُفتح المحتوى فور قبول طلبك من فريق الحاضنة.' },
  ],
} as const;

export const CONTACT = {
  title: 'تواصل معنا',
  description: 'تابع جديد الدورات والورش أولاً بأول على إنستغرام، أو اختر الطريقة الأنسب لك من صفحة روابطنا.',
  location: 'غزة، فلسطين',
  // Both linked from the Instagram profile. Add a phone or email here once confirmed.
  socials: [
    { kind: 'instagram', label: 'إنستغرام', handle: '@tech_.box', href: 'https://www.instagram.com/tech_.box/' },
    { kind: 'link', label: 'كل روابطنا', handle: 'linktr.ee/Tech_Box', href: 'https://linktr.ee/Tech_Box' },
  ],
} as const;
