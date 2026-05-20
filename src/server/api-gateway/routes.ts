import { Router } from "express";
import { publish, createTask, getTask } from "../pubsub";

export const apiGatewayRouter = Router();

// 🌐 FASTAPI-like ENTRY (Cloud Run API for Agent Orchestration)
apiGatewayRouter.post("/submit-request", (req, res) => {
  const { query, recipient_name, recipient_email, context } = req.body;
  
  if (!query || !recipient_email) {
     return res.status(400).json({ status: "error", message: "Missing required fields" });
  }

  const taskId = createTask(query);

  publish("legal-requests", {
      taskId,
      query,
      recipient_name,
      recipient_email,
      context
  });

  res.json({
      status: "queued",
      message: "Request sent to agent pipeline",
      taskId
  });
});

// Endpoint to poll execution state
apiGatewayRouter.get("/task-status/:taskId", (req, res) => {
  const taskId = req.params.taskId;
  const task = getTask(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  res.json(task);
});
