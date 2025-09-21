export interface ServerStatistics {
	totalSessionCount: number;
	totalDollarConvertedRevenue: number;
	totalMicroCoralsRevenue: number;
	totalMicroCoralsRevenueSnapshots: { Timestamp: number; totalMicroCoralsRevenue: number }[];
	totalSessionCountsSnapshots: { Timestamp: number; totalSessionCounts: number }[];
	totalMicroCoralsRevenueSeries: { Timestamp: number; totalMicroCoralsRevenue: number }[];
}
