import { buildApiUrl } from '../utils/apiBase';
import { sendStandaloneChat, isStandaloneMode } from './standaloneChat';

export async function sendChatMessage(payload) {
  if (isStandaloneMode()) {
    return sendStandaloneChat(payload);
  }

  const url = buildApiUrl('/api/chat');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(payload.studentId ? { 'x-student-id': payload.studentId } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok && data.error) {
    throw new Error(data.error);
  }

  return data;
}
