import { ScheduleEntry } from "@/types/schedule";

type ScheduleTableProps = {
	entries: ScheduleEntry[];
	recordings?: Array<{ timestamp: Date }>;
};

export default function ScheduleTable({
	entries,
	recordings
}: ScheduleTableProps) {

	if (!entries || entries.length === 0) {
		return (
			<div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
				No schedule data yet
			</div>
		);
	}

	// Determine the date from recordings if available
	let scheduleDate: string | null = null;
	if (recordings && recordings.length > 0) {
		console.log('=== SCHEDULE TABLE DATE DETECTION ===');
		console.log('Total recordings:', recordings.length);
		
		// Find the most common date from recordings (using local date)
		const dates = recordings.map(r => {
			const date = new Date(r.timestamp);
			console.log('Recording timestamp:', r.timestamp);
			console.log('Recording timestamp toString:', r.timestamp.toString());
			
			// Get local date string (YYYY-MM-DD)
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const localDate = `${year}-${month}-${day}`;
			console.log('Extracted local date:', localDate);
			
			return localDate;
		});
		
		console.log('All dates:', dates);
		
		// Count occurrences of each date
		const dateCounts: { [key: string]: number } = {};
		dates.forEach(date => {
			dateCounts[date] = (dateCounts[date] || 0) + 1;
		});
		
		console.log('Date counts:', dateCounts);
		
		// Find the most common date
		scheduleDate = Object.entries(dateCounts).sort((a, b) => b[1] - a[1])[0][0];
		console.log('Most common date (schedule date):', scheduleDate);
		console.log('======================================');
	}

	// Format date for display
	const formatDate = (dateStr: string) => {
		const [year, month, day] = dateStr.split('-').map(Number);
		const date = new Date(year, month - 1, day);
		return date.toLocaleDateString('en-US', { 
			weekday: 'long', 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		});
	};

	return (
		<div style={{
			padding: "20px",
			maxWidth: "900px",
			margin: "0 auto",
		}}>
			{scheduleDate && (
				<div style={{
					textAlign: "center",
					marginBottom: "16px",
					fontSize: "16px",
					fontWeight: "600",
					color: "#007AFF",
				}}>
					{formatDate(scheduleDate)}
				</div>
			)}
			<table style={{
				width: "100%",
				borderCollapse: "collapse",
				backgroundColor: "#fff",
				borderRadius: "12px",
				overflow: "hidden",
				boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
			}}>
				<thead>
					<tr style={{
						backgroundColor: "#007AFF",
						color: "#fff",
					}}>
						<th style={{
							padding: "16px",
							textAlign: "left",
							fontWeight: "600",
							fontSize: "14px",
							width: "180px",
						}}>
							Time
						</th>
						<th style={{
							padding: "16px",
							textAlign: "left",
							fontWeight: "600",
							fontSize: "14px",
						}}>
							Activity
						</th>
					</tr>
				</thead>
				<tbody>
					{entries.map((entry, index) => (
						<tr
							key={entry.id}
							style={{
								borderBottom: index < entries.length - 1 ? "1px solid #eee" : "none",
							}}
						>
							<td style={{
								padding: "14px 16px",
								fontSize: "14px",
								color: "#333",
								fontWeight: "500",
							}}>
								{entry.start_time} - {entry.end_time}
							</td>
							<td style={{
								padding: "14px 16px",
								fontSize: "14px",
								color: "#666",
							}}>
								<div>{entry.description}</div>
								{entry.note && (
									<div style={{
										fontSize: "12px",
										color: "#999",
										marginTop: "4px",
										fontStyle: "italic",
									}}>
										Note: {entry.note}
									</div>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
