function yyyymmdd(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

const timeSeries = Array.from({ length: 30 }, (_, i) => {
  const rand = (lo: number, hi: number) => Math.floor(lo + Math.random() * (hi - lo));
  const activeUsers = rand(280, 620) + Math.floor(Math.sin(i / 4) * 80);
  const sessions    = Math.floor(activeUsers * (1.2 + Math.random() * 0.4));
  const pageViews   = Math.floor(sessions   * (2.1 + Math.random() * 1.2));
  return { date: yyyymmdd(30 - i), activeUsers, sessions, pageViews };
});

export const MOCK_GA4 = {
  companyId:   'company-001',
  companyName: 'Acme Digital Co.',

  dateRange: {
    startDate: yyyymmdd(30),
    endDate:   yyyymmdd(0),
  },

  previousDateRange: {
    startDate: yyyymmdd(60),
    endDate:   yyyymmdd(31),
  },

  metrics: {
    activeUsers:        8_423,
    sessions:          10_187,
    pageViews:         27_654,
    avgSessionDuration: 142,
    bounceRate:        '34.7',
    newUsers:           5_318,
    engagementRate:    '71.2',
  },

  previousMetrics: {
    activeUsers:        7_210,
    sessions:           8_940,
    pageViews:         23_100,
    avgSessionDuration: 128,
    bounceRate:        '41.2',
    newUsers:           4_650,
    engagementRate:    '64.8',
  },

  timeSeries,

  topPages: [
    { title: 'Home',                path: '/',                   views: 9_340 },
    { title: 'Services',            path: '/services',           views: 4_812 },
    { title: 'About Us',            path: '/about',              views: 3_205 },
    { title: 'Blog: SEO in 2025',   path: '/blog/seo-2025',     views: 2_671 },
    { title: 'Contact',             path: '/contact',            views: 2_144 },
    { title: 'Pricing',             path: '/pricing',            views: 1_988 },
    { title: 'Case Studies',        path: '/case-studies',       views: 1_503 },
    { title: 'Blog: GA4 Migration', path: '/blog/ga4-migration', views: 1_097 },
    { title: 'Portfolio',           path: '/portfolio',          views:   894 },
    { title: 'Privacy Policy',      path: '/privacy',            views:   435 },
  ],

  trafficSources: [
    { source: 'Organic Search', sessions: 4_210 },
    { source: 'Direct',         sessions: 2_340 },
    { source: 'Paid Search',    sessions: 1_620 },
    { source: 'Social',         sessions:   980 },
    { source: 'Referral',       sessions:   740 },
    { source: 'Email',          sessions:   297 },
  ],

  devices: [
    { device: 'desktop', users: 4_890 },
    { device: 'mobile',  users: 3_102 },
    { device: 'tablet',  users:   431 },
  ],

  countries: [
    { country: 'United States',  users: 3_850 },
    { country: 'United Kingdom', users: 1_240 },
    { country: 'Canada',         users:   870 },
    { country: 'Australia',      users:   680 },
    { country: 'Germany',        users:   520 },
    { country: 'France',         users:   410 },
    { country: 'India',          users:   390 },
    { country: 'Netherlands',    users:   215 },
    { country: 'Brazil',         users:   198 },
    { country: 'Mexico',         users:   150 },
    { country: 'Spain',          users:   130 },
    { country: 'Sweden',         users:   110 },
    { country: 'Japan',          users:   105 },
    { country: 'Singapore',      users:    82 },
    { country: 'South Africa',   users:    73 },
  ],

  regions: [
    { country: 'United States', region: 'California',  users: 980 },
    { country: 'United States', region: 'Texas',       users: 620 },
    { country: 'United States', region: 'New York',    users: 540 },
    { country: 'United States', region: 'Florida',     users: 410 },
    { country: 'United States', region: 'Illinois',    users: 310 },
    { country: 'United States', region: 'Washington',  users: 280 },
    { country: 'United States', region: 'Colorado',    users: 210 },
    { country: 'United Kingdom', region: 'England',    users: 890 },
    { country: 'United Kingdom', region: 'Scotland',   users: 210 },
    { country: 'United Kingdom', region: 'Wales',      users:  90 },
    { country: 'Canada', region: 'Ontario',            users: 420 },
    { country: 'Canada', region: 'British Columbia',   users: 240 },
    { country: 'Canada', region: 'Quebec',             users: 160 },
  ],

  callEvents: [
    { event: 'phone_call',        count: 87 },
    { event: 'call_button_click', count: 134 },
    { event: 'call_connected',    count: 62 },
    { event: 'call_duration_30s', count: 48 },
  ],
};

export const MOCK_GOOGLE_ADS = {
  companyId:   'company-001',
  companyName: 'Acme Digital Co.',
  customerId:  '123-456-7890',
  hasGoogleAds: true,

  dateRange: {
    startDate: yyyymmdd(30),
    endDate:   yyyymmdd(0),
  },

  metrics: {
    impressions:      184_320,
    clicks:             6_814,
    ctr:                  3.70,
    cost:             8_943.27,
    conversions:        412.0,
    conversionsValue: 34_218.50,
    averageCpc:           1.31,
  },

  campaigns: [
    {
      id:               'camp-001',
      name:             'Brand – Search',
      status:           'ENABLED',
      impressions:       52_400,
      clicks:             3_210,
      ctr:                 6.13,
      cost:             2_987.40,
      conversions:        198.0,
      conversionsValue: 16_500.00,
    },
    {
      id:               'camp-002',
      name:             'Services – Search',
      status:           'ENABLED',
      impressions:       68_900,
      clicks:             2_140,
      ctr:                 3.10,
      cost:             3_215.80,
      conversions:        134.0,
      conversionsValue: 11_390.00,
    },
    {
      id:               'camp-003',
      name:             'Retargeting – Display',
      status:           'ENABLED',
      impressions:       41_200,
      clicks:             1_020,
      ctr:                 2.48,
      cost:             1_840.07,
      conversions:         56.0,
      conversionsValue:  4_760.00,
    },
    {
      id:               'camp-004',
      name:             'Competitor Conquest',
      status:           'PAUSED',
      impressions:       21_820,
      clicks:              444,
      ctr:                 2.03,
      cost:               900.00,
      conversions:         24.0,
      conversionsValue:  1_568.50,
    },
  ],
};

export const MOCK_METRICOOL = {
  companyId:   'company-001',
  companyName: 'Acme Digital Co.',
  blogId:      'acme-digital',

  dateRange: {
    startDate: yyyymmdd(30),
    endDate:   yyyymmdd(0),
  },

  profile: {
    name:   'Acme Digital Co.',
    handle: '@acmedigital',
    avatar: null,
  },

  stats: {
    totalFollowers:  24_810,
    totalPosts:         187,
    engagementRate:    4.82,
    totalReach:     312_540,
  },

  posts: [
    {
      text:     '🚀 Just published our full breakdown of GA4 vs Universal Analytics — everything you need to know before the final cutoff. Link in bio! #Analytics #GA4 #DigitalMarketing',
      network:  'Instagram',
      date:     yyyymmdd(2),
      likes:    512,
      comments:  38,
    },
    {
      text:     "We're thrilled to announce Acme Digital has been named a Top 50 Marketing Agency for 2025 by MarTech Insider. Thank you to our incredible clients and team. 🏆",
      network:  'LinkedIn',
      date:     yyyymmdd(5),
      likes:    340,
      comments:  27,
    },
    {
      text:     'New blog post → 7 Proven Strategies to Cut Your Google Ads CPC Without Sacrificing Conversions. Head to our website to read the full guide. 🎯',
      network:  'Facebook',
      date:     yyyymmdd(8),
      likes:    214,
      comments:  19,
    },
    {
      text:     'Hot take: most brands are sleeping on LinkedIn short-form video in 2025. We tested it for 90 days — here are the results 🧵',
      network:  'Twitter',
      date:     yyyymmdd(12),
      likes:    587,
      comments:  62,
    },
    {
      text:     'Behind the scenes: our team at SearchCon 2025 — great sessions on AI-assisted SEO and the future of first-party data. Always great energy at this event.',
      network:  'Instagram',
      date:     yyyymmdd(17),
      likes:    389,
      comments:  24,
    },
    {
      text:     'Case study drop 📋 How we helped a mid-market retailer grow organic sessions by 210% in 6 months using content clusters and technical SEO. Read on our blog.',
      network:  'LinkedIn',
      date:     yyyymmdd(22),
      likes:    274,
      comments:  31,
    },
  ],
};