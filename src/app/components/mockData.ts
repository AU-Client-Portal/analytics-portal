function yyyymmdd(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

const rand = (lo: number, hi: number) => Math.floor(lo + Math.random() * (hi - lo));

const ga4TimeSeries = Array.from({ length: 90 }, (_, i) => {
  const dayOfWeek = i % 7;
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  const weekendMultiplier = isWeekend ? 0.6 : 1;
  const growthTrend = 1 + (i / 90) * 0.45;
  const spike1 = i >= 28 && i <= 32 ? 1.8 : 1;
  const spike2 = i >= 62 && i <= 65 ? 1.5 : 1;
  const dip    = i >= 45 && i <= 50 ? 0.75 : 1;

  const base       = 380 * growthTrend * weekendMultiplier * spike1 * spike2 * dip;
  const activeUsers = Math.floor(base + Math.sin(i / 5) * 40 + rand(-30, 30));
  const sessions    = Math.floor(activeUsers * (1.25 + Math.random() * 0.3));
  const pageViews   = Math.floor(sessions   * (2.3  + Math.random() * 1.0));

  const bounceRate         = +Math.max(15, Math.min(55, 35 - (i / 90) * 8 + Math.sin(i / 7) * 5 + rand(-3, 3))).toFixed(1);
  const engagementRate     = +Math.max(45, Math.min(92, 62 + (i / 90) * 12 + Math.cos(i / 6) * 4 + rand(-2, 2))).toFixed(1);
  const newUsers           = Math.floor(activeUsers * (0.58 + Math.sin(i / 12) * 0.06 + Math.random() * 0.04));
  const avgSessionDuration = Math.round(Math.max(80, Math.min(280, 150 + (i / 90) * 35 + Math.sin(i / 8) * 22 + rand(-10, 10))));

  return { date: yyyymmdd(90 - i), activeUsers, sessions, pageViews, bounceRate, engagementRate, newUsers, avgSessionDuration };
});

export const MOCK_GA4 = {
  companyId:   'company-001',
  companyName: 'Acme Digital Co.',
  dateRange:         { startDate: yyyymmdd(90), endDate: yyyymmdd(0)  },
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
    { country: 'France',         users:   510 },
    { country: 'India',          users:   490 },
    { country: 'Netherlands',    users:   315 },
    { country: 'Brazil',         users:   298 },
    { country: 'Mexico',         users:   210 },
  ],
  regions: [
    { country: 'United States', region: 'California',       users: 1_480 },
    { country: 'United States', region: 'Texas',            users:   920 },
    { country: 'United States', region: 'New York',         users:   840 },
    { country: 'United States', region: 'Florida',          users:   610 },
    { country: 'United Kingdom', region: 'England',         users: 1_290 },
    { country: 'United Kingdom', region: 'Scotland',        users:   310 },
    { country: 'Canada',         region: 'Ontario',         users:   620 },
    { country: 'Canada',         region: 'British Columbia', users:  340 },
    { country: 'Australia',      region: 'New South Wales', users:   420 },
    { country: 'Australia',      region: 'Victoria',        users:   280 },
  ],
  callEvents: [
    { event: 'phone_call',        count: 142 },
    { event: 'call_button_click', count: 218 },
    { event: 'click_to_call',     count:  96 },
    { event: 'call_connected',    count:  87 },
  ],
};

export const MOCK_GOOGLE_ADS = {
  companyId:    'company-001',
  companyName:  'Acme Digital Co.',
  customerId:   '123-456-7890',
  hasGoogleAds: true,
  dateRange: { startDate: yyyymmdd(90), endDate: yyyymmdd(0) },
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
    { id: 'camp-001', name: 'Brand – Search',       status: 'ENABLED', impressions:  82_400, clicks: 5_210, ctr: 6.32, cost: 4_987.40, conversions: 312.0, conversionsValue: 26_500.00 },
    { id: 'camp-002', name: 'Services – Search',    status: 'ENABLED', impressions:  98_900, clicks: 4_140, ctr: 4.19, cost: 5_215.80, conversions: 234.0, conversionsValue: 19_890.00 },
    { id: 'camp-003', name: 'Retargeting – Display', status: 'ENABLED', impressions: 71_200, clicks: 1_820, ctr: 2.56, cost: 2_840.07, conversions:  98.0, conversionsValue:  8_360.00 },
    { id: 'camp-004', name: 'Competitor Conquest',  status: 'PAUSED',  impressions:  31_820, clicks:   644, ctr: 2.02, cost: 1_900.00, conversions:  43.0, conversionsValue:  3_468.50 },
  ],
};

export const MOCK_METRICOOL = {
  companyId:   'company-001',
  companyName: 'Acme Digital Co.',
  blogId:      'acme-digital',
  dateRange: { startDate: yyyymmdd(90), endDate: yyyymmdd(0) },
  profile: { name: 'Acme Digital Co.', handle: '@acmedigital', avatar: null },
  stats: {
    totalFollowers:   38_410,
    totalPosts:          287,
    engagementRate:     5.94,
    totalReach:      512_840,
    totalImpressions: 724_310,
    totalShares:       4_820,
  },
  posts: [
    { text: '🚀 Just published our full breakdown of GA4 vs Universal Analytics — everything you need to know before the final cutoff. Link in bio! #Analytics #GA4',       network: 'Instagram', date: yyyymmdd(2),  likes: 612, comments: 48 },
    { text: "We're thrilled to announce Acme Digital has been named a Top 50 Marketing Agency for 2025 by MarTech Insider. Thank you to our clients and team. 🏆",          network: 'LinkedIn',  date: yyyymmdd(5),  likes: 480, comments: 37 },
    { text: 'New blog post → 7 Proven Strategies to Cut Your Google Ads CPC Without Sacrificing Conversions. Head to our website to read the full guide. 🎯',               network: 'Facebook',  date: yyyymmdd(8),  likes: 314, comments: 29 },
    { text: 'Hot take: most brands are sleeping on LinkedIn short-form video in 2025. We tested it for 90 days — here are the results 🧵',                                  network: 'Twitter',   date: yyyymmdd(12), likes: 687, comments: 72 },
    { text: 'Behind the scenes: our team at SearchCon 2025 — great sessions on AI-assisted SEO and the future of first-party data.',                                        network: 'Instagram', date: yyyymmdd(17), likes: 489, comments: 34 },
    { text: 'Case study drop 📋 How we helped a mid-market retailer grow organic sessions by 210% in 6 months using content clusters and technical SEO.',                   network: 'LinkedIn',  date: yyyymmdd(22), likes: 374, comments: 41 },
  ],
};

export const MOCK_GBP = {
  companyId:    'mock-company-001',
  companyName:  'Art Unlimited',
  locationId:   '123456789',
  locationName: 'Art Unlimited – Main Location',
  hasGBP: true,
  dateRange: { startDate: '2025-02-09', endDate: '2025-03-09' },
  metrics: {
    businessImpressions: 8420,
    searchImpressions:   5630,
    mapsImpressions:     2790,
    websiteClicks:        312,
    callClicks:           187,
    directionRequests:     94,
    averageRating:         4.7,
    totalReviews:          138,
  },
  timeSeries: [
    { date: '20250209', impressions: 220, searchImpressions: 147, mapsImpressions:  73, clicks:  8, calls:  5, directionRequests: 2, avgRating: 4.7 },
    { date: '20250210', impressions: 285, searchImpressions: 191, mapsImpressions:  94, clicks: 11, calls:  6, directionRequests: 3, avgRating: 4.8 },
    { date: '20250211', impressions: 310, searchImpressions: 207, mapsImpressions: 103, clicks:  9, calls:  7, directionRequests: 3, avgRating: 4.7 },
    { date: '20250212', impressions: 260, searchImpressions: 174, mapsImpressions:  86, clicks: 12, calls:  4, directionRequests: 2, avgRating: 4.6 },
    { date: '20250213', impressions: 340, searchImpressions: 228, mapsImpressions: 112, clicks: 14, calls:  8, directionRequests: 4, avgRating: 4.7 },
    { date: '20250214', impressions: 390, searchImpressions: 261, mapsImpressions: 129, clicks: 16, calls:  9, directionRequests: 4, avgRating: 4.8 },
    { date: '20250215', impressions: 275, searchImpressions: 184, mapsImpressions:  91, clicks: 10, calls:  5, directionRequests: 2, avgRating: 4.7 },
    { date: '20250216', impressions: 295, searchImpressions: 197, mapsImpressions:  98, clicks: 11, calls:  6, directionRequests: 3, avgRating: 4.7 },
    { date: '20250217', impressions: 320, searchImpressions: 214, mapsImpressions: 106, clicks: 13, calls:  7, directionRequests: 3, avgRating: 4.8 },
    { date: '20250218', impressions: 280, searchImpressions: 187, mapsImpressions:  93, clicks:  9, calls:  5, directionRequests: 2, avgRating: 4.6 },
    { date: '20250219', impressions: 350, searchImpressions: 234, mapsImpressions: 116, clicks: 15, calls:  8, directionRequests: 4, avgRating: 4.7 },
    { date: '20250220', impressions: 410, searchImpressions: 274, mapsImpressions: 136, clicks: 17, calls: 10, directionRequests: 5, avgRating: 4.9 },
    { date: '20250221', impressions: 300, searchImpressions: 201, mapsImpressions:  99, clicks: 11, calls:  6, directionRequests: 3, avgRating: 4.7 },
    { date: '20250222', impressions: 265, searchImpressions: 177, mapsImpressions:  88, clicks:  8, calls:  4, directionRequests: 2, avgRating: 4.6 },
    { date: '20250223', impressions: 290, searchImpressions: 194, mapsImpressions:  96, clicks: 10, calls:  5, directionRequests: 2, avgRating: 4.7 },
    { date: '20250224', impressions: 330, searchImpressions: 221, mapsImpressions: 109, clicks: 14, calls:  7, directionRequests: 3, avgRating: 4.7 },
    { date: '20250225', impressions: 370, searchImpressions: 248, mapsImpressions: 122, clicks: 15, calls:  9, directionRequests: 4, avgRating: 4.8 },
    { date: '20250226', impressions: 315, searchImpressions: 211, mapsImpressions: 104, clicks: 12, calls:  6, directionRequests: 3, avgRating: 4.7 },
    { date: '20250227', impressions: 285, searchImpressions: 191, mapsImpressions:  94, clicks:  9, calls:  5, directionRequests: 2, avgRating: 4.6 },
    { date: '20250228', impressions: 345, searchImpressions: 231, mapsImpressions: 114, clicks: 13, calls:  7, directionRequests: 3, avgRating: 4.7 },
    { date: '20250301', impressions: 400, searchImpressions: 268, mapsImpressions: 132, clicks: 16, calls: 10, directionRequests: 5, avgRating: 4.8 },
    { date: '20250302', impressions: 360, searchImpressions: 241, mapsImpressions: 119, clicks: 14, calls:  8, directionRequests: 4, avgRating: 4.8 },
    { date: '20250303', impressions: 290, searchImpressions: 194, mapsImpressions:  96, clicks: 10, calls:  5, directionRequests: 2, avgRating: 4.7 },
    { date: '20250304', impressions: 310, searchImpressions: 207, mapsImpressions: 103, clicks: 11, calls:  6, directionRequests: 3, avgRating: 4.7 },
    { date: '20250305', impressions: 380, searchImpressions: 254, mapsImpressions: 126, clicks: 15, calls:  9, directionRequests: 4, avgRating: 4.8 },
    { date: '20250306', impressions: 420, searchImpressions: 281, mapsImpressions: 139, clicks: 18, calls: 11, directionRequests: 5, avgRating: 4.9 },
    { date: '20250307', impressions: 350, searchImpressions: 234, mapsImpressions: 116, clicks: 13, calls:  7, directionRequests: 3, avgRating: 4.7 },
    { date: '20250308', impressions: 300, searchImpressions: 201, mapsImpressions:  99, clicks: 11, calls:  6, directionRequests: 3, avgRating: 4.7 },
    { date: '20250309', impressions: 270, searchImpressions: 181, mapsImpressions:  89, clicks:  9, calls:  5, directionRequests: 2, avgRating: 4.6 },
  ],
};

export const MOCK_LSA = {
  companyId:   'mock-company-001',
  companyName: 'Art Unlimited',
  hasLSA: true,
  dateRange: { startDate: '2025-02-09', endDate: '2025-03-09' },
  metrics: {
    totalLeads:          47,
    chargedLeads:        41,
    disputedLeads:        6,
    totalCost:         1840.50,
    averageCostPerLead:  44.89,
    impressions:        3200,
    clicks:              184,
  },
  leadTypes: [
    { type: 'Phone Calls', count: 35 },
    { type: 'Messages',    count: 12 },
  ],
  timeSeries: [
    { date: '20250209', leads: 2, chargedLeads: 2, disputedLeads: 0, cost:  89.78, impressions:  98, clicks: 6 },
    { date: '20250210', leads: 1, chargedLeads: 1, disputedLeads: 0, cost:  44.89, impressions: 115, clicks: 7 },
    { date: '20250211', leads: 2, chargedLeads: 1, disputedLeads: 1, cost:  44.89, impressions: 110, clicks: 6 },
    { date: '20250212', leads: 0, chargedLeads: 0, disputedLeads: 0, cost:   0.00, impressions:  85, clicks: 4 },
    { date: '20250213', leads: 2, chargedLeads: 2, disputedLeads: 0, cost:  89.78, impressions: 120, clicks: 7 },
    { date: '20250214', leads: 3, chargedLeads: 3, disputedLeads: 0, cost: 134.67, impressions: 145, clicks: 9 },
    { date: '20250215', leads: 1, chargedLeads: 1, disputedLeads: 0, cost:  44.89, impressions:  95, clicks: 5 },
    { date: '20250216', leads: 1, chargedLeads: 0, disputedLeads: 1, cost:   0.00, impressions: 105, clicks: 6 },
    { date: '20250217', leads: 1, chargedLeads: 1, disputedLeads: 0, cost:  44.89, impressions: 115, clicks: 7 },
    { date: '20250218', leads: 0, chargedLeads: 0, disputedLeads: 0, cost:   0.00, impressions:  88, clicks: 5 },
    { date: '20250219', leads: 2, chargedLeads: 2, disputedLeads: 0, cost:  89.78, impressions: 125, clicks: 8 },
    { date: '20250220', leads: 4, chargedLeads: 3, disputedLeads: 1, cost: 134.67, impressions: 150, clicks: 10 },
    { date: '20250221', leads: 1, chargedLeads: 1, disputedLeads: 0, cost:  44.89, impressions: 100, clicks: 6 },
    { date: '20250222', leads: 0, chargedLeads: 0, disputedLeads: 0, cost:   0.00, impressions:  80, clicks: 4 },
    { date: '20250223', leads: 2, chargedLeads: 2, disputedLeads: 0, cost:  89.78, impressions: 105, clicks: 6 },
    { date: '20250224', leads: 1, chargedLeads: 1, disputedLeads: 0, cost:  44.89, impressions: 112, clicks: 7 },
    { date: '20250225', leads: 3, chargedLeads: 2, disputedLeads: 1, cost:  89.78, impressions: 130, clicks: 8 },
    { date: '20250226', leads: 2, chargedLeads: 2, disputedLeads: 0, cost:  89.78, impressions: 108, clicks: 6 },
    { date: '20250227', leads: 1, chargedLeads: 1, disputedLeads: 0, cost:  44.89, impressions:  95, clicks: 5 },
    { date: '20250228', leads: 2, chargedLeads: 2, disputedLeads: 0, cost:  89.78, impressions: 116, clicks: 7 },
    { date: '20250301', leads: 3, chargedLeads: 3, disputedLeads: 0, cost: 134.67, impressions: 142, clicks: 9 },
    { date: '20250302', leads: 2, chargedLeads: 2, disputedLeads: 0, cost:  89.78, impressions: 118, clicks: 7 },
    { date: '20250303', leads: 1, chargedLeads: 1, disputedLeads: 0, cost:  44.89, impressions:  98, clicks: 6 },
    { date: '20250304', leads: 2, chargedLeads: 2, disputedLeads: 0, cost:  89.78, impressions: 110, clicks: 6 },
    { date: '20250305', leads: 1, chargedLeads: 1, disputedLeads: 0, cost:  44.89, impressions: 122, clicks: 8 },
    { date: '20250306', leads: 3, chargedLeads: 3, disputedLeads: 0, cost: 134.67, impressions: 148, clicks: 9 },
    { date: '20250307', leads: 2, chargedLeads: 1, disputedLeads: 1, cost:  44.89, impressions: 114, clicks: 7 },
    { date: '20250308', leads: 1, chargedLeads: 1, disputedLeads: 0, cost:  44.89, impressions: 100, clicks: 6 },
    { date: '20250309', leads: 1, chargedLeads: 1, disputedLeads: 0, cost:  44.89, impressions:  90, clicks: 5 },
  ],
};