import { GEMINI_INPUT_JSON_TEXT } from "../hooks/geminiInput";
import { ScheduleEntry, PendingSchedule, ApprovedSchedule } from "@/types/schedule";

export const GEMINI_MODEL = "gemini-2.5-flash-lite";

// Try common env sources; you can replace this later
export const getGeminiApiKey = (): string => {
	const candidates = [
		// Preferred: Next.js client-exposed env var
		typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_GEMINI_API_KEY as string | undefined) : undefined,
		// Fallbacks for manual/global injection
		(globalThis as any).__GEMINI_API_KEY__,
		(globalThis as any).GEMINI_API_KEY,
		// Other environments (e.g., Vite) as a last resort
		typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_GEMINI_API_KEY : undefined,
		// In case someone sets it on global process env with the NEXT_PUBLIC prefix
		(globalThis as any).process?.env?.NEXT_PUBLIC_GEMINI_API_KEY,
	];
	return candidates.find(Boolean) || "";
};

type GeminiGenerateContentResponse = {
	candidates?: Array<{
		content?: { parts?: Array<{ text?: string }> };
		finishReason?: string;
	}>;
};

export type ConversationMessage = {
	role: "user" | "model";
	parts: Array<{ text: string }>;
};

// Core call to Gemini's generateContent REST API (no SDK needed)
export async function callGeminiGenerateContent(options?: {
	apiKey?: string;
	model?: string;
	systemPrompt?: string;
	userText?: string;
	conversationHistory?: ConversationMessage[];
}): Promise<GeminiGenerateContentResponse> {
	const apiKey = options?.apiKey || getGeminiApiKey();
	if (!apiKey) throw new Error("Missing Gemini API key");

	const model = options?.model || GEMINI_MODEL;
	const systemPrompt =
		options?.systemPrompt ||
		`You are a time tracking assistant. Convert the following voice note transcripts with time stamps of which the audio was recorded into a structured daily schedule.

Rules:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanations
2. Each entry must have: start_time, end_time, description
3. Use 12-hour format for times (HH:mm AM/PM)
4. Hint: if users use past tense, the activity happened before the time stamp.

Example format:
[
  {"start_time": "07:34 AM", "end_time": "07:41 AM", "description": "Morning work session"},
  {"start_time": "07:41 AM", "end_time": "08:40 AM", "description": "Breakfast"}
]`;
	
	const userText = options?.userText || GEMINI_INPUT_JSON_TEXT;

	const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
		model
	)}:generateContent?key=${encodeURIComponent(apiKey)}`;

	// Build conversation contents
	const contents: ConversationMessage[] = [];
	
	// Add system prompt as first user message
	if (!options?.conversationHistory || options.conversationHistory.length === 0) {
		contents.push({
			role: "user",
			parts: [{ text: systemPrompt }, { text: userText }],
		});
	} else {
		// If we have conversation history, include it
		contents.push(...options.conversationHistory);
		// Add the new user message
		if (userText !== GEMINI_INPUT_JSON_TEXT) {
			contents.push({
				role: "user",
				parts: [{ text: userText }],
			});
		}
	}

	const body = {
		contents,
	};

	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`Gemini API error ${res.status}: ${text}`);
	}

	return (await res.json()) as GeminiGenerateContentResponse;
}

// Helper: pull plain text from the Gemini response
export function extractTextFromGeminiResponse(data: GeminiGenerateContentResponse): string {
	const parts = data?.candidates?.flatMap((c) => c.content?.parts || []) || [];
	const texts = parts.map((p) => p.text).filter(Boolean) as string[];
	return texts.join("\n").trim();
}

// Type for saved schedule (legacy - keeping for backwards compatibility)
export type SavedSchedule = {
	id: string;
	date: string;
	scheduleData: Array<{
		start_time: string;
		end_time: string;
		description: string;
		note?: string;
	}>;
	conversationHistory: ConversationMessage[];
	savedAt: string;
};

// ===== NEW PENDING/APPROVED SCHEDULE STORAGE =====

// Save pending schedule (entries waiting in confirm tab)
export function savePendingSchedule(
	entries: ScheduleEntry[],
	conversationHistory: ConversationMessage[]
): PendingSchedule {
	const pendingSchedule: PendingSchedule = {
		id: `pending_${Date.now()}`,
		date: new Date().toISOString().split("T")[0],
		entries,
		conversationHistory,
		createdAt: new Date().toISOString(),
	};

	try {
		localStorage.setItem("pendingSchedule", JSON.stringify(pendingSchedule));
		console.log("Pending schedule saved:", pendingSchedule);
		return pendingSchedule;
	} catch (error) {
		console.error("Failed to save pending schedule:", error);
		throw new Error("Failed to save pending schedule");
	}
}

// Get current pending schedule
export function getPendingSchedule(): PendingSchedule | null {
	try {
		const stored = localStorage.getItem("pendingSchedule");
		if (!stored) return null;
		return JSON.parse(stored) as PendingSchedule;
	} catch (error) {
		console.error("Failed to load pending schedule:", error);
		return null;
	}
}

// Update a specific entry in pending schedule
export function updatePendingEntry(entryId: string, updates: Partial<ScheduleEntry>): void {
	try {
		const pending = getPendingSchedule();
		if (!pending) return;

		pending.entries = pending.entries.map(entry =>
			entry.id === entryId ? { ...entry, ...updates } : entry
		);

		localStorage.setItem("pendingSchedule", JSON.stringify(pending));
		console.log("Pending entry updated:", entryId);
	} catch (error) {
		console.error("Failed to update pending entry:", error);
		throw new Error("Failed to update pending entry");
	}
}

// Remove entry from pending schedule (when approved or deleted)
export function removePendingEntry(entryId: string): void {
	try {
		const pending = getPendingSchedule();
		if (!pending) return;

		pending.entries = pending.entries.filter(entry => entry.id !== entryId);

		if (pending.entries.length === 0) {
			// If no entries left, clear the pending schedule
			localStorage.removeItem("pendingSchedule");
		} else {
			localStorage.setItem("pendingSchedule", JSON.stringify(pending));
		}
		console.log("Pending entry removed:", entryId);
	} catch (error) {
		console.error("Failed to remove pending entry:", error);
		throw new Error("Failed to remove pending entry");
	}
}

// Save approved schedule entry (moves to insights tab)
export function saveApprovedEntry(entry: ScheduleEntry): ApprovedSchedule {
	const approvedEntry: ApprovedSchedule = {
		id: `approved_${Date.now()}`,
		entryId: entry.id,
		date: new Date().toISOString().split("T")[0],
		start_time: entry.start_time,
		end_time: entry.end_time,
		description: entry.description,
		note: entry.note,
		approvedAt: new Date().toISOString(),
	};

	try {
		const existing = getApprovedSchedules();
		existing.push(approvedEntry);
		localStorage.setItem("approvedSchedules", JSON.stringify(existing));
		console.log("Approved entry saved:", approvedEntry);
		return approvedEntry;
	} catch (error) {
		console.error("Failed to save approved entry:", error);
		throw new Error("Failed to save approved entry");
	}
}

// Get all approved schedules
export function getApprovedSchedules(): ApprovedSchedule[] {
	try {
		const stored = localStorage.getItem("approvedSchedules");
		if (!stored) return [];
		return JSON.parse(stored) as ApprovedSchedule[];
	} catch (error) {
		console.error("Failed to load approved schedules:", error);
		return [];
	}
}

// Delete approved entry by id
export function deleteApprovedEntry(id: string): void {
	try {
		const schedules = getApprovedSchedules();
		const filtered = schedules.filter((s) => s.id !== id);
		localStorage.setItem("approvedSchedules", JSON.stringify(filtered));
	} catch (error) {
		console.error("Failed to delete approved entry:", error);
		throw new Error("Failed to delete approved entry");
	}
}

// Correct a single entry using Gemini API
export async function correctScheduleEntry(
	entry: ScheduleEntry,
	correctionText: string,
	conversationHistory: ConversationMessage[]
): Promise<ScheduleEntry> {
	try {
		const systemPrompt = `You are correcting a single schedule entry based on user feedback.

Original entry:
- Time: ${entry.start_time} - ${entry.end_time}
- Description: ${entry.description}
${entry.note ? `- Note: ${entry.note}` : ''}

User correction: ${correctionText}

Return ONLY a valid JSON object (not an array) with the corrected entry in this exact format:
{"start_time": "HH:mm AM/PM", "end_time": "HH:mm AM/PM", "description": "...", "note": "..."}

Rules:
- Use 12-hour format for times
- Be concise in descriptions
- If the user mentions additional context, put it in the note field
- Return ONLY the JSON object, no markdown, no code blocks`;

		const response = await callGeminiGenerateContent({
			systemPrompt,
			userText: correctionText,
			conversationHistory: conversationHistory.slice(-4), // Keep last 2 exchanges for context
		});

		const text = extractTextFromGeminiResponse(response);
		console.log("Gemini correction response:", text);

		// Parse the corrected entry
		let cleanText = text.trim();
		cleanText = cleanText.replace(/```json\n?/g, "");
		cleanText = cleanText.replace(/```\n?/g, "");
		cleanText = cleanText.trim();

		const corrected = JSON.parse(cleanText);

		// Return updated entry with same id and status reset to pending
		return {
			...entry,
			start_time: corrected.start_time || entry.start_time,
			end_time: corrected.end_time || entry.end_time,
			description: corrected.description || entry.description,
			note: corrected.note || entry.note,
			status: 'pending',
			rejectionReason: undefined,
		};
	} catch (error) {
		console.error("Failed to correct entry:", error);
		throw new Error(`Failed to correct entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

// Save confirmed schedule to localStorage
export function saveConfirmedSchedule(
	scheduleData: SavedSchedule["scheduleData"],
	conversationHistory: ConversationMessage[]
): SavedSchedule {
	const savedSchedule: SavedSchedule = {
		id: `schedule_${Date.now()}`,
		date: new Date().toISOString().split("T")[0],
		scheduleData,
		conversationHistory,
		savedAt: new Date().toISOString(),
	};

	try {
		// Get existing schedules
		const existingSchedules = getSavedSchedules();
		// Add new schedule
		existingSchedules.push(savedSchedule);
		// Save to localStorage
		localStorage.setItem("confirmedSchedules", JSON.stringify(existingSchedules));
		console.log("Schedule saved successfully:", savedSchedule);
		return savedSchedule;
	} catch (error) {
		console.error("Failed to save schedule:", error);
		throw new Error("Failed to save schedule to storage");
	}
}

// Get all saved schedules from localStorage
export function getSavedSchedules(): SavedSchedule[] {
	try {
		const stored = localStorage.getItem("confirmedSchedules");
		if (!stored) return [];
		return JSON.parse(stored) as SavedSchedule[];
	} catch (error) {
		console.error("Failed to load schedules:", error);
		return [];
	}
}

// Delete a saved schedule by id
export function deleteSchedule(id: string): void {
	try {
		const schedules = getSavedSchedules();
		const filtered = schedules.filter((s) => s.id !== id);
		localStorage.setItem("confirmedSchedules", JSON.stringify(filtered));
	} catch (error) {
		console.error("Failed to delete schedule:", error);
		throw new Error("Failed to delete schedule");
	}
}

// Optional placeholder component; wire up as needed
export default function TableChat() {
	return null;
}

