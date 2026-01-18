import { useState } from "react";
import { ScheduleEntry } from "@/types/schedule";

type ScheduleTableProps = {
	entries: ScheduleEntry[];
	onApprove?: (entryId: string) => void;
	onReject?: (entryId: string) => void;
	onCorrect?: (entryId: string, correctionText: string) => void;
	showActions?: boolean;
};

export default function ScheduleTable({
	entries,
	onApprove,
	onReject,
	onCorrect,
	showActions = true
}: ScheduleTableProps) {
	const [correctingEntryId, setCorrectingEntryId] = useState<string | null>(null);
	const [correctionText, setCorrectionText] = useState("");

	if (!entries || entries.length === 0) {
		return (
			<div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
				No schedule data yet
			</div>
		);
	}

	const handleRejectClick = (entryId: string) => {
		setCorrectingEntryId(entryId);
		setCorrectionText("");
	};

	const handleCorrectionSubmit = (entryId: string) => {
		if (!correctionText.trim()) {
			alert("Please enter a correction");
			return;
		}
		if (onCorrect) {
			onCorrect(entryId, correctionText);
		}
		setCorrectingEntryId(null);
		setCorrectionText("");
	};

	const handleCorrectionCancel = () => {
		setCorrectingEntryId(null);
		setCorrectionText("");
	};

	return (
		<div style={{
			padding: "20px",
			maxWidth: "900px",
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
						{showActions && (
							<th style={{
								padding: "16px",
								textAlign: "center",
								fontWeight: "600",
								fontSize: "14px",
								width: "120px",
							}}>
								Actions
							</th>
						)}
					</tr>
				</thead>
				<tbody>
					{entries.map((entry, index) => (
						<>
							<tr
								key={entry.id}
								style={{
									borderBottom: index < entries.length - 1 ? "1px solid #eee" : "none",
									backgroundColor: entry.status === 'rejected' ? '#fff5f5' : 'transparent',
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
									{entry.status === 'rejected' && entry.rejectionReason && (
										<div style={{
											fontSize: "12px",
											color: "#d32f2f",
											marginTop: "4px",
											fontWeight: "500",
										}}>
											Needs correction: {entry.rejectionReason}
										</div>
									)}
								</td>
								{showActions && (
									<td style={{
										padding: "14px 16px",
										textAlign: "center",
									}}>
										<div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
											<button
												onClick={() => onApprove && onApprove(entry.id)}
												disabled={entry.status === 'approved'}
												title="Approve and move to Insights"
												style={{
													width: "36px",
													height: "36px",
													borderRadius: "8px",
													border: "none",
													backgroundColor: entry.status === 'approved' ? "#ccc" : "#34C759",
													color: "#fff",
													fontSize: "18px",
													cursor: entry.status === 'approved' ? "not-allowed" : "pointer",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													transition: "all 0.2s ease",
												}}
											>
												✓
											</button>
											<button
												onClick={() => handleRejectClick(entry.id)}
												disabled={entry.status === 'approved'}
												title="Reject and request correction"
												style={{
													width: "36px",
													height: "36px",
													borderRadius: "8px",
													border: "none",
													backgroundColor: entry.status === 'approved' ? "#ccc" : "#FF3B30",
													color: "#fff",
													fontSize: "18px",
													cursor: entry.status === 'approved' ? "not-allowed" : "pointer",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													transition: "all 0.2s ease",
												}}
											>
												✗
											</button>
										</div>
									</td>
								)}
							</tr>
							{correctingEntryId === entry.id && (
								<tr key={`${entry.id}-correction`}>
									<td colSpan={showActions ? 3 : 2} style={{ padding: "16px" }}>
										<div style={{
											backgroundColor: "#f8f9fa",
											padding: "16px",
											borderRadius: "8px",
										}}>
											<p style={{
												fontSize: "13px",
												fontWeight: "600",
												marginBottom: "8px",
												color: "#333",
											}}>
												What needs to be corrected?
											</p>
											<textarea
												value={correctionText}
												onChange={(e) => setCorrectionText(e.target.value)}
												placeholder="E.g., 'The breakfast was from 8:00 AM to 8:30 AM, not 8:40 PM'"
												style={{
													width: "100%",
													minHeight: "60px",
													padding: "10px",
													fontSize: "13px",
													border: "1px solid #ddd",
													borderRadius: "6px",
													resize: "vertical",
													fontFamily: "inherit",
													marginBottom: "10px",
												}}
											/>
											<div style={{ display: "flex", gap: "8px" }}>
												<button
													onClick={() => handleCorrectionSubmit(entry.id)}
													style={{
														padding: "8px 16px",
														fontSize: "13px",
														fontWeight: "600",
														color: "#fff",
														backgroundColor: "#007AFF",
														border: "none",
														borderRadius: "6px",
														cursor: "pointer",
													}}
												>
													Submit Correction
												</button>
												<button
													onClick={handleCorrectionCancel}
													style={{
														padding: "8px 16px",
														fontSize: "13px",
														fontWeight: "600",
														color: "#666",
														backgroundColor: "#fff",
														border: "1px solid #ddd",
														borderRadius: "6px",
														cursor: "pointer",
													}}
												>
													Cancel
												</button>
											</div>
										</div>
									</td>
								</tr>
							)}
						</>
					))}
				</tbody>
			</table>
		</div>
	);
}
