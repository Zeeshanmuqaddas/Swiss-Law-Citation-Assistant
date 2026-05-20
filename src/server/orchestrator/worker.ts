import { pubsub, publish, logTask, taskStore } from "../pubsub";
import { runLegalSummarizer } from "../agents/summarizer";
import { validateCitations } from "../agents/validator";
import { composeEmail } from "../agents/composer";

// ⚙️ ORCHESTRATOR WORKER (Simulating Cloud Run Worker)
pubsub.on("legal-requests", async (event) => {
  const { taskId, query, recipient_name, recipient_email, context } = event;
  
  logTask(taskId, "Orchestrator", "Started processing request", "processing");

  try {
    // 🧠 Step 1: Legal Summarizer Agent
    logTask(taskId, "Summarizer", "Analyzing legal query...");
    const summary = await runLegalSummarizer(query, context);
    logTask(taskId, "Summarizer", "Summary generated");

    // 📚 Step 2: Citation Validator Agent
    logTask(taskId, "Validator", "Validating Swiss law citations...");
    const validation = validateCitations(summary, context);
    logTask(taskId, "Validator", validation.valid ? "Citations Validated Successfully" : "Missing verified citations");

    // 📧 Step 3: Email Composer Agent
    logTask(taskId, "Composer", "Drafting professional email...");
    const { subject, body } = await composeEmail(recipient_name, query, validation.clean_summary);
    
    logTask(taskId, "Composer", "Email draft completely composed");
    
    if (taskStore[taskId]) {
      taskStore[taskId].emailDraft = body;
    }

    // 🚀 Dispatch to Delivery Queue
    publish("email-send", {
        taskId,
        email: recipient_email,
        subject: subject,
        body: body
    });

  } catch (err: any) {
    console.error("Multi-Agent Email Pipeline error:", err);
    logTask(taskId, "System", `Pipeline Error: ${err.message}`, "error");
  }
});
