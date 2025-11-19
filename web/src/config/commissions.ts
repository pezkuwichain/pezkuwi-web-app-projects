// Commission Configuration

export const COMMISSIONS = {
  KYC: {
    name: 'KYC Approval Commission',
    proxyAccount: '5Hdybwv6Kbd3DJGY8DzfY4rKJWWFDPbLbuKQ81fk6eJATcTj', // KYC Commission proxy account
    threshold: 7, // 60% of 11 members
    totalMembers: 11,
  },
  // Future commissions
  VAKIF: {
    name: 'Vakıf Commission',
    proxyAccount: '', // TBD
    threshold: 5,
    totalMembers: 7,
  },
} as const;

export type CommissionType = keyof typeof COMMISSIONS;
