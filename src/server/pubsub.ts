import { EventEmitter } from "events";
import { randomUUID } from "crypto";

// Simulated Event Bus / Pub/Sub
export const pubsub = new EventEmitter();

// In-memory Task State Store representing a Database or Redis
export const taskStore: Record<string, any> = {};

export function publish(topic: string, message: any) {
  setTimeout(() => pubsub.emit(topic, message), 0);
}

export function createTask(query: string) {
  const taskId = randomUUID();
  taskStore[taskId] = {
    id: taskId,
    status: "queued",
    logs: [{ time: new Date().toISOString(), agent: "System", message: "Request queued to legal-requests topic (Pub/Sub)" }],
    emailDraft: null,
    query
  };
  return taskId;
}

export function logTask(taskId: string, agent: string, message: string, statusOverride?: string) {
  if (taskStore[taskId]) {
    taskStore[taskId].logs.push({ time: new Date().toISOString(), agent, message });
    if (statusOverride) {
      taskStore[taskId].status = statusOverride;
    }
  }
}

export function getTask(taskId: string) {
  return taskStore[taskId];
}
