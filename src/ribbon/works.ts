export interface WorkItem {
  index: number;
  title: string;
  titleAr: string;
  category: string;
  src: string;
}

export const R2_BASE = 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/';

export const WORKS: WorkItem[] = [
  {
    index: 0,
    title: 'Roadster 3D',
    titleAr: 'سيارة رودستر ثلاثية الأبعاد',
    category: 'Visuals',
    src: 'designs/roadster-3d-car-landing.mp4',
  },
  {
    index: 1,
    title: 'Living Portrait',
    titleAr: 'صورة حية',
    category: 'Films',
    src: 'aaaf/living-portrait-hero.mp4',
  },
  {
    index: 2,
    title: 'Particle Self',
    titleAr: 'جسيم ذاتي',
    category: 'Experiments',
    src: 'aaaf/oraciteslArea.mp4',
  },
  {
    index: 3,
    title: 'Robot Jellyfish',
    titleAr: 'قنديل بحر آلي',
    category: 'Visuals',
    src: 'aaaf/medusa-jellyfish-hero.mp4',
  },
  {
    index: 4,
    title: 'Ink Reveal',
    titleAr: 'كشف الحبر',
    category: 'Experiments',
    src: 'designs/ink-reveal-hover.mp4',
  },
  {
    index: 5,
    title: 'Space Voyage',
    titleAr: 'رحلة فضائية',
    category: 'Films',
    src: 'designs/space-voyage-video.mp4',
  },
  {
    index: 6,
    title: 'Helion Dispatch',
    titleAr: 'إرسال هيليون',
    category: 'Visuals',
    src: 'designs/helion-dispatch-landing.mp4',
  },
  {
    index: 7,
    title: 'Honey Bee',
    titleAr: 'نحلة العسل',
    category: 'Music',
    src: 'designs/honey-bee-melli-landing.mp4',
  },
];
