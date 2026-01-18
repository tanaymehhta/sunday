export type ScheduleEntryStatus = 'pending' | 'approved' | 'rejected';

export type ScheduleEntry = {
  id: string;
  start_time: string;
  end_time: string;
  description: string;
  note?: string;
  status: ScheduleEntryStatus;
  rejectionReason?: string;
};

export type PendingSchedule = {
  id: string;
  date: string;
  entries: ScheduleEntry[];
  conversationHistory: any[];
  createdAt: string;
};

export type ApprovedSchedule = {
  id: string;
  entryId: string;
  date: string;
  start_time: string;
  end_time: string;
  description: string;
  note?: string;
  approvedAt: string;
};
