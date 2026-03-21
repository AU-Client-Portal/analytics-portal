function yyyymmdd(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}${mo}${dy}`;
}

const rand = (lo: number, hi: number) => Math.floor(lo + Math.random() * (hi - lo));

export function getMockGA4() {
  const ga4TimeSeries = Array.from({ length: 90 }, (_, i) => {
    const isWeekend = i % 7 === 5 || i % 7 === 6;
    const wm  = isWeekend ? 0.6 : 1;
    const gt  = 1 + (i / 90) * 0.45;
    const sp1 = i >= 28 && i <= 32 ? 1.8 : 1;
    const sp2 = i >= 62 && i <= 65 ? 1.5 : 1;
    const dip = i >= 45 && i <= 50 ? 0.75 : 1;
    const base            = 380 * gt * wm * sp1 * sp2 * dip;
    const activeUsers     = Math.max(1, Math.floor(base + Math.sin(i / 5) * 40 + rand(-30, 30)));
    const sessions        = Math.floor(activeUsers * (1.25 + Math.random() * 0.3));
    const pageViews       = Math.floor(sessions * (2.3 + Math.random() * 1.0));
    const bounceRate      = +Math.max(15, Math.min(55, 35 - (i / 90) * 8 + Math.sin(i / 7) * 5 + rand(-3, 3))).toFixed(1);
    const engagementRate  = +Math.max(45, Math.min(92, 62 + (i / 90) * 12 + Math.cos(i / 6) * 4 + rand(-2, 2))).toFixed(1);
    const newUsers        = Math.floor(activeUsers * (0.58 + Math.sin(i / 12) * 0.06 + Math.random() * 0.04));
    const avgSessionDuration = Math.round(Math.max(80, Math.min(280, 150 + (i / 90) * 35 + Math.sin(i / 8) * 22 + rand(-10, 10))));
    const formSubmits     = Math.floor(sessions   * (0.012 + Math.random() * 0.006));
    const contactPageViews = Math.floor(sessions  * (0.04  + Math.random() * 0.015));
    const quoteRequests   = Math.floor(sessions   * (0.006 + Math.random() * 0.003));
    return {
      date: yyyymmdd(89 - i),
      activeUsers, sessions, pageViews, bounceRate, engagementRate,
      newUsers, avgSessionDuration,
      formSubmits, contactPageViews, quoteRequests,
    };
  });

  return {
    companyId:   'company-001',
    companyName: 'A Squared Marketing',
    dateRange:         { startDate: yyyymmdd(90), endDate: yyyymmdd(0)   },
    previousDateRange: { startDate: yyyymmdd(180), endDate: yyyymmdd(91) },
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
    timeSeries: ga4TimeSeries,
    topPages: [
      { title: 'Home',                path: '/',                   views: 14_820 },
      { title: 'Services',            path: '/services',           views:  7_340 },
      { title: 'About Us',            path: '/about',              views:  5_210 },
      { title: 'Blog: SEO in 2025',   path: '/blog/seo-2025',     views:  4_671 },
      { title: 'Contact',             path: '/contact',            views:  3_890 },
      { title: 'Pricing',             path: '/pricing',            views:  3_144 },
      { title: 'Case Studies',        path: '/case-studies',       views:  2_503 },
      { title: 'Blog: GA4 Migration', path: '/blog/ga4-migration', views:  1_897 },
      { title: 'Portfolio',           path: '/portfolio',          views:  1_204 },
      { title: 'Privacy Policy',      path: '/privacy',            views:    435 },
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
    ],
  };
}

export function getMockMetricool() {
  const socialTimeSeries = Array.from({ length: 90 }, (_, i) => {
    const gt = 1 + (i / 90) * 0.18;
    const base = 5600 * gt;
    const reach       = Math.floor(base + rand(-400, 600));
    const impressions = Math.floor(reach * (1.35 + Math.random() * 0.2));
    const engagement  = +Math.max(3, Math.min(9, 5.5 + Math.sin(i / 10) * 1.2 + Math.random() * 0.6)).toFixed(2);
    const followers   = 36_000 + Math.floor(i * 27 + rand(0, 15));
    return { date: yyyymmdd(89 - i), reach, impressions, engagement, followers };
  });

  return {
    companyId:   'company-001',
    companyName: 'A Squared Marketing',
    blogId:      'asquared-marketing',
    dateRange: { startDate: yyyymmdd(90), endDate: yyyymmdd(0) },
    profile: { name: 'A Squared Marketing', handle: '@asquaredmarketing', avatar: null },
    stats: {
      totalFollowers:   38_410,
      totalPosts:          287,
      engagementRate:     5.94,
      totalReach:      512_840,
      totalImpressions: 724_310,
      totalShares:       4_820,
    },
    timeSeries: socialTimeSeries,
    posts: [
      { text: 'Just published our full breakdown of GA4 vs Universal Analytics — everything you need to know. Link in bio! #Analytics #GA4', network: 'Instagram', date: yyyymmdd(2),  likes: 612, comments: 48 },
      { text: "Thrilled to announce A Squared Marketing has been named a Top 50 Marketing Agency for 2025. Thank you to our clients and team.",  network: 'LinkedIn',  date: yyyymmdd(5),  likes: 480, comments: 37 },
      { text: 'New blog post: 7 Proven Strategies to Cut Your Google Ads CPC Without Sacrificing Conversions.',                                 network: 'Facebook',  date: yyyymmdd(8),  likes: 314, comments: 29 },
      { text: 'Hot take: most brands are sleeping on LinkedIn short-form video in 2025. We tested it for 90 days — here are the results.',      network: 'Twitter',   date: yyyymmdd(12), likes: 687, comments: 72 },
      { text: 'Behind the scenes at SearchCon 2025 — great sessions on AI-assisted SEO and the future of first-party data.',                   network: 'Instagram', date: yyyymmdd(17), likes: 489, comments: 34 },
    ],
  };
}

export function getMockSearchConsole() {
  const gscTimeSeries = Array.from({ length: 90 }, (_, i) => {
    const gt  = 1 + (i / 90) * 0.35;
    const base = 520 * gt;
    const clicks      = Math.floor(base + rand(-40, 60));
    const impressions = Math.floor(clicks * (12 + rand(-2, 3)));
    const ctr         = +((clicks / impressions) * 100).toFixed(2);
    const position    = +Math.max(1.2, Math.min(8, 4.2 - (i / 90) * 1.8 + Math.sin(i / 12) * 0.4)).toFixed(1);
    return { date: yyyymmdd(89 - i), clicks, impressions, ctr, position };
  });

  return {
    companyId:   'company-001',
    companyName: 'A Squared Marketing',
    siteUrl:     'https://asquaredmarketing.com',
    dateRange: { startDate: yyyymmdd(90), endDate: yyyymmdd(0) },
    metrics: {
      totalClicks:      47_210,
      totalImpressions: 612_480,
      avgCtr:            7.71,
      avgPosition:       3.8,
    },
    timeSeries: gscTimeSeries,
    topQueries: [
      { query: 'digital marketing agency',      clicks: 3_420, impressions: 42_100, ctr: 8.12, position: 2.1, positionTrend: [4.2, 3.8, 3.4, 3.0, 2.5, 2.2, 2.1] },
      { query: 'seo services near me',          clicks: 2_810, impressions: 38_400, ctr: 7.32, position: 2.8, positionTrend: [5.1, 4.6, 4.2, 3.8, 3.4, 3.0, 2.8] },
      { query: 'google ads management',         clicks: 2_190, impressions: 31_200, ctr: 7.02, position: 3.2, positionTrend: [5.8, 5.2, 4.8, 4.2, 3.9, 3.5, 3.2] },
      { query: 'ppc agency',                    clicks: 1_870, impressions: 28_800, ctr: 6.49, position: 3.7, positionTrend: [6.2, 5.9, 5.4, 4.8, 4.3, 4.0, 3.7] },
      { query: 'content marketing strategy',    clicks: 1_640, impressions: 24_500, ctr: 6.69, position: 4.1, positionTrend: [7.0, 6.5, 5.8, 5.4, 4.9, 4.4, 4.1] },
      { query: 'local seo services',            clicks: 1_420, impressions: 21_800, ctr: 6.51, position: 4.4, positionTrend: [7.5, 7.0, 6.4, 5.8, 5.3, 4.8, 4.4] },
      { query: 'marketing agency case studies', clicks: 1_180, impressions: 18_200, ctr: 6.48, position: 5.2, positionTrend: [8.1, 7.8, 7.2, 6.8, 6.2, 5.7, 5.2] },
      { query: 'ga4 migration guide',           clicks:   980, impressions: 14_100, ctr: 6.95, position: 2.4, positionTrend: [3.8, 3.4, 3.1, 2.9, 2.7, 2.5, 2.4] },
      { query: 'google analytics 4 setup',      clicks:   840, impressions: 12_600, ctr: 6.67, position: 3.1, positionTrend: [5.0, 4.6, 4.2, 3.8, 3.5, 3.3, 3.1] },
      { query: 'marketing roi tracking',        clicks:   720, impressions: 11_200, ctr: 6.43, position: 5.8, positionTrend: [8.4, 8.0, 7.4, 6.9, 6.5, 6.1, 5.8] },
    ],
    topPages: [
      { page: '/',                   clicks: 9_840, impressions: 118_200, ctr: 8.32, position: 1.8 },
      { page: '/services',           clicks: 6_210, impressions:  82_400, ctr: 7.54, position: 2.4 },
      { page: '/blog/seo-2025',      clicks: 4_870, impressions:  64_100, ctr: 7.60, position: 2.9 },
      { page: '/blog/ga4-migration', clicks: 3_920, impressions:  52_800, ctr: 7.42, position: 3.2 },
      { page: '/pricing',            clicks: 3_410, impressions:  47_200, ctr: 7.22, position: 3.8 },
    ],
  };
}

export function getMockGBP() {
  const gbpTimeSeries = Array.from({ length: 90 }, (_, i) => {
    const isWeekend = i % 7 === 5 || i % 7 === 6;
    const wm  = isWeekend ? 0.65 : 1;
    const gt  = 1 + (i / 90) * 0.3;
    const base = 310 * gt * wm;
    const impressions        = Math.floor(base + rand(-30, 40));
    const searchImpressions  = Math.floor(impressions * (0.65 + Math.random() * 0.05));
    const mapsImpressions    = impressions - searchImpressions;
    const clicks             = Math.floor(impressions * (0.032 + Math.random() * 0.008));
    const calls              = Math.floor(impressions * (0.019 + Math.random() * 0.005));
    const directionRequests  = Math.floor(impressions * (0.009 + Math.random() * 0.003));
    const avgRating          = +Math.max(4.3, Math.min(5.0, 4.7 + Math.sin(i / 15) * 0.1)).toFixed(1);
    return { date: yyyymmdd(89 - i), impressions, searchImpressions, mapsImpressions, clicks, calls, directionRequests, avgRating };
  });

  return {
    companyId:    'company-001',
    companyName:  'A Squared Marketing',
    locationId:   '123456789',
    locationName: 'A Squared Marketing – Main Location',
    hasGBP: true,
    dateRange: { startDate: yyyymmdd(90), endDate: yyyymmdd(0) },
    metrics: {
      businessImpressions: gbpTimeSeries.reduce((s, d) => s + d.impressions, 0),
      searchImpressions:   gbpTimeSeries.reduce((s, d) => s + d.searchImpressions, 0),
      mapsImpressions:     gbpTimeSeries.reduce((s, d) => s + d.mapsImpressions, 0),
      websiteClicks:       gbpTimeSeries.reduce((s, d) => s + d.clicks, 0),
      callClicks:          gbpTimeSeries.reduce((s, d) => s + d.calls, 0),
      directionRequests:   gbpTimeSeries.reduce((s, d) => s + d.directionRequests, 0),
      averageRating:       4.7,
      totalReviews:        138,
    },
    timeSeries: gbpTimeSeries,
  };
}

export function getMockWhatConverts() {
  const wcTimeSeries = Array.from({ length: 90 }, (_, i) => {
    const isWeekend = i % 7 === 5 || i % 7 === 6;
    const wm  = isWeekend ? 0.5 : 1;
    const gt  = 1 + (i / 90) * 0.2;
    const phoneCalls = Math.floor((4 * gt * wm) + rand(0, 3));
    const formLeads  = Math.floor((3 * gt * wm) + rand(0, 2));
    const connected  = Math.floor(phoneCalls * (0.6 + Math.random() * 0.2));
    const totalLeads = phoneCalls + formLeads;
    return { date: yyyymmdd(89 - i), phoneCalls, formLeads, connected, totalLeads };
  });

  const totPhoneCalls = wcTimeSeries.reduce((s, d) => s + d.phoneCalls, 0);
  const totConnected  = wcTimeSeries.reduce((s, d) => s + d.connected, 0);

  return {
    companyId:       'company-001',
    companyName:     'A Squared Marketing',
    hasWhatConverts: true,
    dateRange: { startDate: yyyymmdd(90), endDate: yyyymmdd(0) },
    metrics: {
      totalLeads:  wcTimeSeries.reduce((s, d) => s + d.totalLeads, 0),
      phoneCalls:  totPhoneCalls,
      formLeads:   wcTimeSeries.reduce((s, d) => s + d.formLeads, 0),
      connected:   totConnected,
      callRate:    0,
      connectRate: +(totConnected / Math.max(totPhoneCalls, 1) * 100).toFixed(1),
    },
    timeSeries: wcTimeSeries,
    recentLeads: [
      { id: 'l1', type: 'Phone Call',  source: 'Google Ads', date: yyyymmdd(0), duration: '3:42', connected: true  },
      { id: 'l2', type: 'Form Submit', source: 'Organic',    date: yyyymmdd(1), duration: null,   connected: false },
      { id: 'l3', type: 'Phone Call',  source: 'Direct',     date: yyyymmdd(1), duration: '1:08', connected: true  },
      { id: 'l4', type: 'Phone Call',  source: 'Google Ads', date: yyyymmdd(2), duration: null,   connected: false },
      { id: 'l5', type: 'Form Submit', source: 'Organic',    date: yyyymmdd(2), duration: null,   connected: false },
    ],
  };
}