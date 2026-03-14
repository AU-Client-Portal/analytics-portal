function yyyymmdd(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

const rand = (lo: number, hi: number) => Math.floor(lo + Math.random() * (hi - lo));

const timeSeries = Array.from({ length: 90 }, (_, i) => {
  const dayOfWeek = i % 7;
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  const weekendMultiplier = isWeekend ? 0.6 : 1;

  // Gradual growth trend over 90 days
  const growthTrend = 1 + (i / 90) * 0.45;

  // Two traffic spikes — simulates a campaign launch and a viral post
  const spike1 = i >= 28 && i <= 32 ? 1.8 : 1;
  const spike2 = i >= 62 && i <= 65 ? 1.5 : 1;

  // Seasonal dip mid-period
  const dip = i >= 45 && i <= 50 ? 0.75 : 1;

  const base = 380 * growthTrend * weekendMultiplier * spike1 * spike2 * dip;
  const activeUsers = Math.floor(base + Math.sin(i / 5) * 40 + rand(-30, 30));
  const sessions    = Math.floor(activeUsers * (1.25 + Math.random() * 0.3));
  const pageViews   = Math.floor(sessions   * (2.3  + Math.random() * 1.0));

  return { date: yyyymmdd(90 - i), activeUsers, sessions, pageViews };
});

export const MOCK_GA4 = {
  companyId:   'company-001',
  companyName: 'Acme Digital Co.',

  dateRange: {
    startDate: yyyymmdd(90),
    endDate:   yyyymmdd(0),
  },

  previousDateRange: {
    startDate: yyyymmdd(180),
    endDate:   yyyymmdd(91),
  },

  metrics: {
    activeUsers:        12_847,
    sessions:           16_204,
    pageViews:          43_918,
    avgSessionDuration: 167,
    bounceRate:         '28.4',
    newUsers:            8_102,
    engagementRate:     '76.8',
  },

  previousMetrics: {
    activeUsers:         9_210,
    sessions:           11_840,
    pageViews:          30_100,
    avgSessionDuration:  138,
    bounceRate:         '41.2',
    newUsers:            5_650,
    engagementRate:     '61.4',
  },

  timeSeries,

  topPages: [
    { title: 'Home',                  path: '/',                     views: 14_820 },
    { title: 'Services',              path: '/services',             views:  7_340 },
    { title: 'About Us',              path: '/about',                views:  5_210 },
    { title: 'Blog: SEO in 2025',     path: '/blog/seo-2025',       views:  4_671 },
    { title: 'Contact',               path: '/contact',              views:  3_890 },
    { title: 'Pricing',               path: '/pricing',              views:  3_144 },
    { title: 'Case Studies',          path: '/case-studies',         views:  2_503 },
    { title: 'Blog: GA4 Migration',   path: '/blog/ga4-migration',   views:  1_897 },
    { title: 'Portfolio',             path: '/portfolio',            views:  1_204 },
    { title: 'Privacy Policy',        path: '/privacy',              views:    435 },
  ],

  trafficSources: [
    { source: 'Organic Search', sessions: 7_210 },
    { source: 'Direct',         sessions: 3_840 },
    { source: 'Paid Search',    sessions: 2_620 },
    { source: 'Social',         sessions: 1_480 },
    { source: 'Referral',       sessions:   740 },
    { source: 'Email',          sessions:   314 },
  ],

  devices: [
    { device: 'desktop', users: 6_890 },
    { device: 'mobile',  users: 5_102 },
    { device: 'tablet',  users:   855 },
  ],

  countries: [
    { country: 'United States',  users: 5_850 },
    { country: 'United Kingdom', users: 1_840 },
    { country: 'Canada',         users: 1_270 },
    { country: 'Australia',      users:   980 },
    { country: 'Germany',        users:   720 },
    { country: 'France',         users:   510 },
    { country: 'India',          users:   490 },
    { country: 'Netherlands',    users:   315 },
    { country: 'Brazil',         users:   298 },
    { country: 'Mexico',         users:   210 },
    { country: 'Spain',          users:   180 },
    { country: 'Sweden',         users:   140 },
    { country: 'Japan',          users:   125 },
    { country: 'Singapore',      users:    92 },
    { country: 'South Africa',   users:    73 },
  ],

  regions: [
    { country: 'United States', region: 'California',    users: 1_480 },
    { country: 'United States', region: 'Texas',         users:   920 },
    { country: 'United States', region: 'New York',      users:   840 },
    { country: 'United States', region: 'Florida',       users:   610 },
    { country: 'United States', region: 'Illinois',      users:   410 },
    { country: 'United States', region: 'Washington',    users:   380 },
    { country: 'United States', region: 'Colorado',      users:   310 },
    { country: 'United States', region: 'Georgia',       users:   280 },
    { country: 'United States', region: 'Massachusetts', users:   240 },
    { country: 'United States', region: 'Arizona',       users:   200 },
    { country: 'United Kingdom', region: 'England',      users: 1_290 },
    { country: 'United Kingdom', region: 'Scotland',     users:   310 },
    { country: 'United Kingdom', region: 'Wales',        users:   140 },
    { country: 'United Kingdom', region: 'Northern Ireland', users: 100 },
    { country: 'Canada', region: 'Ontario',              users:   620 },
    { country: 'Canada', region: 'British Columbia',     users:   340 },
    { country: 'Canada', region: 'Quebec',               users:   210 },
    { country: 'Canada', region: 'Alberta',              users:   100 },
    { country: 'Australia', region: 'New South Wales',   users:   420 },
    { country: 'Australia', region: 'Victoria',          users:   280 },
    { country: 'Australia', region: 'Queensland',        users:   180 },
  ],

  callEvents: [
    { event: 'phone_call',         count: 142 },
    { event: 'call_button_click',  count: 218 },
    { event: 'click_to_call',      count:  96 },
    { event: 'call_connected',     count:  87 },
  ],
};

export const MOCK_GOOGLE_ADS = {
  companyId:   'company-001',
  companyName: 'Acme Digital Co.',
  customerId:  '123-456-7890',
  hasGoogleAds: true,

  dateRange: {
    startDate: yyyymmdd(90),
    endDate:   yyyymmdd(0),
  },

  metrics: {
    impressions:       284_320,
    clicks:             11_814,
    ctr:                  4.15,
    cost:             14_943.27,
    conversions:          687.0,
    conversionsValue:  58_218.50,
    averageCpc:            1.26,
  },

  campaigns: [
    {
      id:               'camp-001',
      name:             'Brand – Search',
      status:           'ENABLED',
      impressions:       82_400,
      clicks:             5_210,
      ctr:                 6.32,
      cost:             4_987.40,
      conversions:        312.0,
      conversionsValue: 26_500.00,
    },
    {
      id:               'camp-002',
      name:             'Services – Search',
      status:           'ENABLED',
      impressions:       98_900,
      clicks:             4_140,
      ctr:                 4.19,
      cost:             5_215.80,
      conversions:        234.0,
      conversionsValue: 19_890.00,
    },
    {
      id:               'camp-003',
      name:             'Retargeting – Display',
      status:           'ENABLED',
      impressions:       71_200,
      clicks:             1_820,
      ctr:                 2.56,
      cost:             2_840.07,
      conversions:         98.0,
      conversionsValue:  8_360.00,
    },
    {
      id:               'camp-004',
      name:             'Competitor Conquest',
      status:           'PAUSED',
      impressions:       31_820,
      clicks:              644,
      ctr:                 2.02,
      cost:             1_900.00,
      conversions:         43.0,
      conversionsValue:  3_468.50,
    },
  ],
};

export const MOCK_METRICOOL = {
  companyId:   'company-001',
  companyName: 'Acme Digital Co.',
  blogId:      'acme-digital',

  dateRange: {
    startDate: yyyymmdd(90),
    endDate:   yyyymmdd(0),
  },

  profile: {
    name:   'Acme Digital Co.',
    handle: '@acmedigital',
    avatar: null,
  },

  stats: {
    totalFollowers:   38_410,
    totalPosts:          287,
    engagementRate:     5.94,
    totalReach:      512_840,
    totalImpressions: 724_310,
    totalShares:       4_820,
  },

  posts: [
    {
      text:     '🚀 Just published our full breakdown of GA4 vs Universal Analytics — everything you need to know before the final cutoff. Link in bio! #Analytics #GA4 #DigitalMarketing',
      network:  'Instagram',
      date:     yyyymmdd(2),
      likes:    612,
      comments:  48,
    },
    {
      text:     "We're thrilled to announce Acme Digital has been named a Top 50 Marketing Agency for 2025 by MarTech Insider. Thank you to our incredible clients and team. 🏆",
      network:  'LinkedIn',
      date:     yyyymmdd(5),
      likes:    480,
      comments:  37,
    },
    {
      text:     'New blog post → 7 Proven Strategies to Cut Your Google Ads CPC Without Sacrificing Conversions. Head to our website to read the full guide. 🎯',
      network:  'Facebook',
      date:     yyyymmdd(8),
      likes:    314,
      comments:  29,
    },
    {
      text:     'Hot take: most brands are sleeping on LinkedIn short-form video in 2025. We tested it for 90 days — here are the results 🧵',
      network:  'Twitter',
      date:     yyyymmdd(12),
      likes:    687,
      comments:  72,
    },
    {
      text:     'Behind the scenes: our team at SearchCon 2025 — great sessions on AI-assisted SEO and the future of first-party data. Always great energy at this event.',
      network:  'Instagram',
      date:     yyyymmdd(17),
      likes:    489,
      comments:  34,
    },
    {
      text:     'Case study drop 📋 How we helped a mid-market retailer grow organic sessions by 210% in 6 months using content clusters and technical SEO. Read on our blog.',
      network:  'LinkedIn',
      date:     yyyymmdd(22),
      likes:    374,
      comments:  41,
    },
  ],
};