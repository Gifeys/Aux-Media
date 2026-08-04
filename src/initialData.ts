/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Server, ScheduleRow, Announcement, SocComOfTheMonth, SiteSettings, ServerNote } from './types';

export const DEFAULT_SERVERS: Server[] = [
  {
    id: 'admin-1',
    name: 'Adrich Glife Abelon',
    role: 'live_server',
    roles: ['live_server', 'ppt', 'documentation', 'reels_editor'],
    skills: ['Live Stream Broadcast', 'PPT Projection', 'Audio Mixing', 'Video Editing', 'Media Admin'],
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bio: 'Dedicated Live Stream Director and Lead Media Admin committed to broadcasting Holy Mass and liturgical celebrations to homebound parishioners and our global parish community.',
    workImages: [
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80'
    ],
    isAdmin: true,
    isSubAdmin: true,
    birthday: 'July 21',
    email: 'adrich.glife.abelon@gmail.com',
    password: 'media123',
    accessToken: 'media123'
  },
  {
    id: 'subadmin-1',
    name: 'Maria Clara',
    role: 'ppt',
    roles: ['ppt', 'documentation'],
    skills: ['PPT Projection', 'Photography & Docu', 'Graphic Arts'],
    picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    bio: 'Passionate PPT operator and visual designer dedicated to projecting beautiful, accurate liturgical texts and slides for our church services.',
    workImages: [
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'
    ],
    isAdmin: false,
    isSubAdmin: true,
    birthday: 'July 28',
    email: 'maria@auxiliadora.org',
    password: 'maria123',
    accessToken: 'maria123'
  },
  {
    id: 'server-ppt-1',
    name: 'Juan Dela Cruz',
    role: 'ppt',
    roles: ['ppt'],
    skills: ['PPT Projection', 'Liturgy Slides'],
    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    bio: 'Serving with joy in liturgical projection and visual presentation for daily and Sunday Holy Masses.',
    workImages: [
      'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80'
    ],
    isAdmin: false,
    isSubAdmin: false,
    birthday: 'July 24',
    email: 'juan@auxiliadora.org',
    password: 'juan123',
    accessToken: 'juan123'
  },
  {
    id: 'server-live-1',
    name: 'Pedro Penduko',
    role: 'live_server',
    roles: ['live_server'],
    skills: ['Live Stream Switcher', 'OBS Studio', 'Audio Setup'],
    picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    bio: 'Experienced audio and broadcast operator ensuring seamless live streaming and sound fidelity for parish liturgies.',
    workImages: [
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80'
    ],
    isAdmin: false,
    isSubAdmin: false,
    birthday: 'August 12',
    email: 'pedro@auxiliadora.org',
    password: 'pedro123',
    accessToken: 'pedro123'
  },
  {
    id: 'server-doc-1',
    name: 'Leonor Rivera',
    role: 'documentation',
    roles: ['documentation'],
    skills: ['Photography & Docu', 'DSLR Camera Operator', 'Lighting'],
    picture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80',
    bio: 'Photographer and documentation server capturing sacred moments, liturgical feasts, and community fellowship.',
    workImages: [
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'
    ],
    isAdmin: false,
    isSubAdmin: false,
    birthday: 'September 05',
    email: 'leonor@auxiliadora.org',
    password: 'leonor123',
    accessToken: 'leonor123'
  },
  {
    id: 'server-reels-1',
    name: 'Jose Rizal',
    role: 'reels_editor',
    roles: ['reels_editor'],
    picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    bio: 'Shorts & Reels editor crafting inspiring digital evangelization content for youth and online parishioners.',
    workImages: [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80'
    ],
    isAdmin: false,
    isSubAdmin: false,
    birthday: 'June 19',
    email: 'jose@auxiliadora.org',
    password: 'jose123',
    accessToken: 'jose123'
  },
  {
    id: 'server-ppt-2',
    name: 'Andres Bonifacio',
    role: 'ppt',
    picture: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    bio: 'Energetic PPT projectionist dedicated to seamless presentation during weekend mass services.',
    isAdmin: false,
    isSubAdmin: false,
    birthday: 'November 30',
    email: 'andres@auxiliadora.org',
    accessToken: 'andres123'
  },
  {
    id: 'server-live-2',
    name: 'Emilio Aguinaldo',
    role: 'live_server',
    picture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    bio: 'Live broadcast technician ensuring high quality multi-cam video transmission during solemn liturgical events.',
    isAdmin: false,
    isSubAdmin: false,
    birthday: 'March 22',
    email: 'emilio@auxiliadora.org',
    accessToken: 'emilio123'
  },
  {
    id: 'server-doc-2',
    name: 'Melchora Aquino',
    role: 'documentation',
    picture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    bio: 'Community media documenter capturing the warmth, faith, and parish activities of Auxiliadora.',
    isAdmin: false,
    isSubAdmin: false,
    birthday: 'January 06',
    email: 'melchora@auxiliadora.org',
    accessToken: 'melchora123'
  },
  {
    id: 'server-reels-2',
    name: 'Gabriela Silang',
    role: 'reels_editor',
    picture: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=300&q=80',
    bio: 'Creative video editor highlighting daily Gospel reflections, youth ministry clips, and liturgical summaries.',
    isAdmin: false,
    isSubAdmin: false,
    birthday: 'August 05',
    email: 'gabriela@auxiliadora.org',
    accessToken: 'gabriela123'
  }
];

export const DEFAULT_SCHEDULES: ScheduleRow[] = [
  {
    id: 'sched-16th-sun',
    dayName: 'Sixteenth Sunday in Ordinary Time (Mary Help of Christians)',
    date: '2026-07-26',
    specialService: '',
    isLive: false,
    isSpecial: false,
    slots: [
      {
        id: 'slot-sat-6pm',
        time: 'Saturday 6:00 PM',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: false
      },
      {
        id: 'slot-sun-6am',
        time: 'Sunday 6:00 AM',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: false
      },
      {
        id: 'slot-sun-730am',
        time: 'Sunday 7:30 AM',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: false
      },
      {
        id: 'slot-sun-900am',
        time: 'Sunday 9:00 AM',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: true
      },
      {
        id: 'slot-sun-1030am',
        time: 'Sunday 10:30 AM',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: false
      },
      {
        id: 'slot-sun-430pm',
        time: 'Sunday 4:30 PM',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: false
      },
      {
        id: 'slot-sun-600pm',
        time: 'Sunday 6:00 PM',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: true
      }
    ]
  },
  {
    id: 'sched-17th-sun',
    dayName: 'Seventeenth Sunday in Ordinary Time',
    date: '2026-08-02',
    specialService: '',
    isLive: false,
    isSpecial: false,
    slots: [
      {
        id: 'slot-sat-6pm-2',
        time: 'Saturday 6:00 PM',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: false
      },
      {
        id: 'slot-sun-6am-2',
        time: 'Sunday 6:00 AM',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: false
      },
      {
        id: 'slot-sun-730am-2',
        time: 'Sunday 7:30 AM',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: false
      },
      {
        id: 'slot-sun-900am-2',
        time: 'Sunday 9:00 AM',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: true
      },
      {
        id: 'slot-sun-1030am-2',
        time: 'Sunday 10:30 AM',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: false
      },
      {
        id: 'slot-sun-430pm-2',
        time: 'Sunday 4:30 PM',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: false
      },
      {
        id: 'slot-sun-600pm-2',
        time: 'Sunday 6:00 PM',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: true
      }
    ]
  },
  {
    id: 'sched-fiesta-special',
    dayName: 'Parish Fiesta Solemn Celebration (Mary Help of Christians)',
    date: '2026-05-24',
    specialService: 'Grand Fiesta Day High Mass & Traditional Fluvial Procession',
    isLive: false,
    isSpecial: true,
    slots: [
      {
        id: 'slot-fiesta-6am',
        time: 'Fiesta 6:00 AM (Diana Mass)',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: false
      },
      {
        id: 'slot-fiesta-9am',
        time: 'Fiesta 9:00 AM (Concelebrated Pontifical Mass)',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: true
      },
      {
        id: 'slot-fiesta-4pm',
        time: 'Fiesta 4:00 PM (Solemn Procession Mass)',
        ppt: [],
        live_server: [],
        documentation: [],
        reels_editor: [],
        isGoingLive: true
      }
    ]
  }
];

export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: '🎉 Birthday Reminder',
    content: 'Happy Birthday to our PPT Server, Juan Dela Cruz, celebrating on July 24! May God bless you!',
    type: 'birthday',
    date: '2026-07-21',
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ann-2',
    title: '⛪ Technical Booth Pre-requisite',
    content: 'All SocCom servers are reminded to arrive at the sound booth at least 30 minutes before Mass time. Check your cables and PPT slide ratios (16:9).',
    type: 'reminder',
    date: '2026-07-20',
    imageUrl: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ann-3',
    title: '📖 Daily Bible Verse',
    content: '"He heals the brokenhearted and binds up their wounds." — Psalm 147:3',
    type: 'daily_word',
    date: '2026-07-29',
    imageUrl: '/src/assets/images/king_david_painting_1785043769405.jpg'
  },
  {
    id: 'ann-4',
    title: '🎉 Upcoming Fiesta',
    content: 'Prepare for the upcoming Fiesta Celebration of Mary Help of Christians! Ensure all cameras and backup documentation storage drives are ready.',
    type: 'reminder',
    date: '2026-07-18',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
  }
];

export const DEFAULT_SOCOM_OF_THE_MONTH: SocComOfTheMonth = {
  id: 'server-reels-1',
  name: 'Jose Rizal',
  role: 'Reels Editor & Lead Video Director',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
  description: 'Jose has gone above and beyond this month by creating beautiful, engaging Reels for our parish fiesta preparation, capturing breathtaking photography of the parish grounds, and keeping the PPT slides pristine.',
  workImages: [
    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=400&q=80', // Live production
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80', // Photography
    'https://images.unsplash.com/photo-1460518451285-cd3ab4204667?auto=format&fit=crop&w=400&q=80'  // Slide creation
  ]
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  appName: 'Auxiliadora Media',
  appSubtitle: 'Dedicated Service of Auxiliadora Media Ministry',
  logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5JBknnO5UhlViMXfV1LEpzMm-fg--X6-7XFRGrWvmmpd7zM2TEKcab_vbivSSoEVg4wpOZRJOJx0yHC66mYQoVPDplCXBbE6xTc7xZ7jD-NRyMsfBpZjHRHYRHe-aLADX6hGcBbLvBWD3Ii0O-gknwMFsaKRrbSBHE6Q1yBp7o5qa_4l1syP8MFIsbowLFKIzZBOq0UzgtjU1DZI8iyLR2-G-hq6gA95nQcgeRMnCq65Z4tHqEaxEFVgzw7J8cRF1suI5Nd9oZfe3',
  loginTitle: 'Auxiliadora Media',
  loginSubtitle: 'Media Authentication',
  loginGreeting: 'Welcome, Media Ministry Member',
  loginBgUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHLOE2aDLQvg6AYbISL8KQrUD_53HX9Le_fj7LhvoL7EGF5H-Sb-N2ZQQT_J2oH-fT4NJN9pfgHsUMs4nKE2FxW0ltfQN_x_3ONew63MVKX30oCOOtFBVUjmwXQnAIIQWummut6jIkB93Rwb7F5CT6xRM8dETfGiRcUtVcuI5jrLD9Y_ZsmRWVkz8mW8NH0WDtI1nOeCg02n4BeCndEjyFN8bqZY_nrhtWaLdOYWAjMwqjg_yZBW1H2vbh1Pp0aiovOw',
  communityCards: [
    {
      id: 'card-1',
      title: 'Auxiliadora Media Team',
      subtitle: 'Parish Event Documentation & Coverage',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyhOvYeZHpPqLYfoSVtstl1s_TzLPNpWpLbOEYI-HZYn0HaYFoKkNcb8b54QqjHF8dBCfCF_qh1gLI3UT0Ev7EibmIGNtBGnB3ZZ-9imGHwac0b0lSaJFMiKWPTwj2BNH10J367luVAPnF_6wheDUZRYyGVl4XJ_x6AXQFLhZKYZ-bUYX_Y8L6-CSBfmnWtJ87gHfc9s0R8uF7eTDQUpJgG5tdA_AqaRFrHSTRPKWbjHx3pXpGH3T49ejlSok2lGmSvw'
    },
    {
      id: 'card-2',
      title: 'SocCom Media Gathering',
      subtitle: 'Building Communion & Fellowship',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVou26_U64MVdVXAIcV8aNTwJPK_ujgFsK9EJ1mxcM7ICX9ldeYI7GoC-vPzd2o7V6d8XEkhig0VdkAlpKqmtjLr5llxE_5zAU-ol2umed1wQFiztt6YSx_7Te22yUPTqXZFy5rGF-5j94Q4hSYNj60oOcZPBFYLzx_B6QschhpNJEELREihJud2ve7H1aDeXRmXyeqRe6mVssYS_Fk-tTjO69_-4agQ4J5SEllM5A3erFRZaO4oKMaxzcc7cNbEt1zQ'
    },
    {
      id: 'card-3',
      title: 'Liturgical Live Stream Studio',
      subtitle: 'Multi-Cam Switcher & Digital Audio Broadcasting',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'card-4',
      title: 'SocCom Youth Formation Workshop',
      subtitle: 'Empowering the Next Generation of Media Evangelizers',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'
    }
  ],
  parishName: 'Mary Help of Christians Parish',
  contactEmail: 'soccom@auxiliadora.org',
  footerText: 'Dedicated Service of Auxiliadora Media Ministry • 2026 Liturgical Year',

  // About & History
  aboutTitle: 'About SocCom & Our History',
  aboutContentP1: 'The Social Communications Ministry (SocCom) of Mary Help of Christians Parish is the official digital arm of our community. We strive to utilize modern technology to facilitate spiritual growth, parish engagement, and the proclamation of the Good News.',
  aboutContentP2: 'Our mission is to bridge the gap between sacred tradition and the digital age, ensuring that every parishioner remains connected to the life of the Church.',

  // Media Work / Services
  service1Title: 'Digital Liturgy',
  service1Desc: 'Livestreaming of Holy Masses and liturgical celebrations for the homebound and global community.',
  service2Title: 'Parish Information',
  service2Desc: 'Managing social media platforms and the parish website to keep everyone updated on news and events.',
  service3Title: 'Visual Documentation',
  service3Desc: 'Capturing the sacred moments of our parish life through professional photography and cinematography.',
  service4Title: 'Graphic Arts & Production',
  service4Desc: 'Designing slides, posters, bulletins, and digital collaterals that inspire and inform.',

  // Gallery Highlights Cards
  card1Title: 'Auxiliadora Media Team',
  card1Subtitle: 'Parish Event Documentation & Coverage',
  card2Title: 'SocCom Media Gathering',
  card2Subtitle: 'Building Communion & Fellowship',
  card3Title: 'Liturgical Live Stream Studio',
  card3Subtitle: 'Multi-Cam Switcher & Digital Audio Broadcasting',
  // Our Community Section
  communityTitle: 'Our Community',
  communitySubtitle: 'The faces behind the digital ministry. We are media committed to bringing the Gospel to the digital periphery.',

  // Daily Verses Settings
  customDailyVerseQuote: '',
  customDailyVerseReference: '',
  dailyVerseImageUrl: '/src/assets/images/st_paul_painting_1785043748004.jpg',
  dailyVerseAuthorName: 'Saint Paul the Apostle writing Epistles',
  dailyVersesList: [
    { quote: "And whatever you do, in word or deed, do everything in the name of the Lord Jesus...", reference: "Colossians 3:17", authorPaintingUrl: "/src/assets/images/st_paul_painting_1785043748004.jpg", authorName: "Saint Paul the Apostle writing to the Colossians" },
    { quote: "I can do all things through Christ who strengthens me.", reference: "Philippians 4:13", authorPaintingUrl: "/src/assets/images/st_paul_painting_1785043748004.jpg", authorName: "Saint Paul the Apostle writing Epistles" },
    { quote: "The Lord is my shepherd; I shall not want.", reference: "Psalm 23:1", authorPaintingUrl: "/src/assets/images/king_david_painting_1785043769405.jpg", authorName: "King David Composing Psalms of Praise" },
    { quote: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you...", reference: "Jeremiah 29:11", authorPaintingUrl: "/src/assets/images/bible_author_painting_1785043734856.jpg", authorName: "Prophet Jeremiah Writing Holy Scripture" },
    { quote: "Trust in the Lord with all your heart and lean not on your own understanding.", reference: "Proverbs 3:5", authorPaintingUrl: "/src/assets/images/king_david_painting_1785043769405.jpg", authorName: "King Solomon Writing Proverbs" },
    { quote: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", reference: "Joshua 1:9", authorPaintingUrl: "/src/assets/images/bible_author_painting_1785043734856.jpg", authorName: "Joshua and the Holy Scriptures" },
    { quote: "The light shines in the darkness, and the darkness has not overcome it.", reference: "John 1:5", authorPaintingUrl: "/src/assets/images/st_john_painting_1785043780425.jpg", authorName: "Saint John the Evangelist Writing the Gospel" },
    { quote: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.", reference: "1 Corinthians 13:4", authorPaintingUrl: "/src/assets/images/st_paul_painting_1785043748004.jpg", authorName: "Saint Paul Writing to the Corinthians" },
    { quote: "Peace I leave with you; my peace I give you. I do not give to you as the world gives.", reference: "John 14:27", authorPaintingUrl: "/src/assets/images/st_john_painting_1785043780425.jpg", authorName: "Saint John Recording the Words of Christ" },
    { quote: "The Lord is my light and my salvation—whom shall I fear?", reference: "Psalm 27:1", authorPaintingUrl: "/src/assets/images/king_david_painting_1785043769405.jpg", authorName: "King David Composing Psalms" },
    { quote: "Come to me, all you who are weary and burdened, and I will give you rest.", reference: "Matthew 11:28", authorPaintingUrl: "/src/assets/images/bible_author_painting_1785043734856.jpg", authorName: "Saint Matthew Writing the Holy Gospel" },
    { quote: "So do not fear, for I am with you; do not be dismayed, for I am your God.", reference: "Isaiah 41:10", authorPaintingUrl: "/src/assets/images/bible_author_painting_1785043734856.jpg", authorName: "Prophet Isaiah Writing Prophecies" },
    { quote: "Blessed are the peacemakers, for they will be called children of God.", reference: "Matthew 5:9", authorPaintingUrl: "/src/assets/images/bible_author_painting_1785043734856.jpg", authorName: "Saint Matthew Recording the Sermon on the Mount" },
    { quote: "Let your light shine before others, that they may see your good deeds and glorify your Father in heaven.", reference: "Matthew 5:16", authorPaintingUrl: "/src/assets/images/bible_author_painting_1785043734856.jpg", authorName: "Saint Matthew Writing the Gospel" },
    { quote: "We walk by faith, not by sight.", reference: "2 Corinthians 5:7", authorPaintingUrl: "/src/assets/images/st_paul_painting_1785043748004.jpg", authorName: "Saint Paul the Apostle Writing Epistles" },
    { quote: "God is our refuge and strength, an ever-present help in trouble.", reference: "Psalm 46:1", authorPaintingUrl: "/src/assets/images/king_david_painting_1785043769405.jpg", authorName: "King David Composing Psalms" },
    { quote: "Give thanks to the Lord, for he is good; his love endures forever.", reference: "Psalm 107:1", authorPaintingUrl: "/src/assets/images/king_david_painting_1785043769405.jpg", authorName: "King David Composing Psalms" },
    { quote: "Be still, and know that I am God.", reference: "Psalm 46:10", authorPaintingUrl: "/src/assets/images/king_david_painting_1785043769405.jpg", authorName: "King David Praying and Composing Psalms" },
    { quote: "You are the salt of the earth... You are the light of the world.", reference: "Matthew 5:13-14", authorPaintingUrl: "/src/assets/images/bible_author_painting_1785043734856.jpg", authorName: "Saint Matthew Writing the Gospel" },
    { quote: "For where two or three gather in my name, there am I with them.", reference: "Matthew 18:20", authorPaintingUrl: "/src/assets/images/bible_author_painting_1785043734856.jpg", authorName: "Saint Matthew Writing the Gospel" },
    { quote: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", reference: "Philippians 4:6", authorPaintingUrl: "/src/assets/images/st_paul_painting_1785043748004.jpg", authorName: "Saint Paul Writing to the Philippians" },
    { quote: "The fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.", reference: "Galatians 5:22-23", authorPaintingUrl: "/src/assets/images/st_paul_painting_1785043748004.jpg", authorName: "Saint Paul Writing to the Galatians" },
    { quote: "Serve the Lord with gladness; come before His presence with singing.", reference: "Psalm 100:2", authorPaintingUrl: "/src/assets/images/king_david_painting_1785043769405.jpg", authorName: "King David Playing Harp to the Lord" },
    { quote: "Mary said, 'Behold, I am the handmaid of the Lord; let it be done to me according to your word.'", reference: "Luke 1:38", authorPaintingUrl: "/src/assets/images/st_john_painting_1785043780425.jpg", authorName: "Saint Luke the Evangelist Writing the Gospel" },
    { quote: "Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.", reference: "Matthew 7:7", authorPaintingUrl: "/src/assets/images/bible_author_painting_1785043734856.jpg", authorName: "Saint Matthew Writing the Gospel" },
    { quote: "He has shown you, O man, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.", reference: "Micah 6:8", authorPaintingUrl: "/src/assets/images/bible_author_painting_1785043734856.jpg", authorName: "Prophet Micah Writing Scripture" },
    { quote: "I am the way and the truth and the life. No one comes to the Father except through me.", reference: "John 14:6", authorPaintingUrl: "/src/assets/images/st_john_painting_1785043780425.jpg", authorName: "Saint John the Evangelist Writing the Gospel" },
    { quote: "The Joy of the Lord is your strength.", reference: "Nehemiah 8:10", authorPaintingUrl: "/src/assets/images/bible_author_painting_1785043734856.jpg", authorName: "Prophet Nehemiah and Ezra Reading the Law" },
    { quote: "He heals the brokenhearted and binds up their wounds.", reference: "Psalm 147:3", authorPaintingUrl: "/src/assets/images/king_david_painting_1785043769405.jpg", authorName: "King David Composing Psalms" },
    { quote: "Cast all your anxiety on Him because He cares for you.", reference: "1 Peter 5:7", authorPaintingUrl: "/src/assets/images/st_paul_painting_1785043748004.jpg", authorName: "Saint Peter the Apostle Writing Epistles" },
    { quote: "In all these things we are more than conquerors through Him who loved us.", reference: "Romans 8:37", authorPaintingUrl: "/src/assets/images/st_paul_painting_1785043748004.jpg", authorName: "Saint Paul Writing to the Romans" }
  ]
};

export const DEFAULT_NOTES: ServerNote[] = [
  {
    id: 'note-1',
    title: '🎥 Live Broadcast Camera Checklist',
    content: 'Ensure Camera 1 (Main Altar) focus is calibrated before 5:45 PM. Check line audio input on OBS to avoid clipping during choir songs.',
    authorId: 'admin-1',
    authorName: 'Glife Bautista',
    authorPicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isPublic: true,
    category: 'reminder',
    createdAt: '2026-07-28T10:00:00Z'
  },
  {
    id: 'note-2',
    title: '💻 PPT Projection Guidelines',
    content: 'Please double-check all response slides for the Gospel reading before the Mass starts. Font size must remain 36pt or higher for readability from back pews.',
    authorId: 'subadmin-1',
    authorName: 'Maria Clara',
    authorPicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    isPublic: true,
    category: 'duty',
    createdAt: '2026-07-29T14:30:00Z'
  },
  {
    id: 'note-3',
    title: '🔒 Private Reminders for Sunday Mass',
    content: 'Remind documentation team to capture photos during priest procession and Eucharistic prayer. Bring extra memory card for backup.',
    authorId: 'admin-1',
    authorName: 'Glife Bautista',
    authorPicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isPublic: false,
    category: 'quick',
    createdAt: '2026-07-29T16:00:00Z'
  }
];
