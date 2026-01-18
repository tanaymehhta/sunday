export type ScheduleEntry = {
	start_time: string;
	end_time: string;
	description: string;
};

type ScheduleTableProps = {
	entries: ScheduleEntry[];
};

export default function ScheduleTable({ entries }: ScheduleTableProps) {
	if (!entries || entries.length === 0) {
		return (
			<div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
				No schedule data yet
			</div>
		);
	}

	return (
		<div style={{ 
			padding: "20px",
			maxWidth: "800px",
			margin: "0 auto",
		}}>
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
							key={index}
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
								{entry.description}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
