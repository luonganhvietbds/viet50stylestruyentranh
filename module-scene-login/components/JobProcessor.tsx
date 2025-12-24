import { useEffect } from "react";
import { useAppStore } from "../store";
import { runCharacterAgent, runSnippetAgent, runSceneAgent } from "../services/geminiService"; 
import { ScriptJob, Scene, CharacterBible, PromptSnippet } from "../types";

let isRunning = false; // Safety lock

export const JobProcessor = () => {
  const { scriptJobs, isProcessingQueue, updateJob, addLog, setProcessingQueue } = useAppStore();

  // Helper: Normalize parsed JSON into segment array
  const normalizeSegments = (json: any) => {
    let list: any[] = [];
    
    if (Array.isArray(json)) {
      list = json;
    } else if (json && Array.isArray(json.segments)) {
      list = json.segments;
    } else if (json && typeof json === 'object') {
      list = [json]; // Single object treated as 1 segment
    }

    if (list.length === 0) return [];

    return list.map((item: any, i: number) => ({
      id: item.id || `SEG_${String(i + 1).padStart(3, '0')}`,
      text: item.text || (typeof item === 'string' ? item : JSON.stringify(item)),
      syllables: item.syllables,
      note: item.note,
      // Preserve other fields
      ...item
    }));
  };

  // Helper: Parse voice data
  const parseVoiceData = (rawData: string) => {
    const clean = rawData.trim();
    try {
      const json = JSON.parse(clean);
      return normalizeSegments(json);
    } catch (e) {}

    if (clean.startsWith('"segments"') || clean.startsWith("'segments'")) {
      try {
        const json = JSON.parse(`{${clean}}`);
        return normalizeSegments(json);
      } catch (e) {}
    }

    if (clean.startsWith('{')) {
      try {
        const json = JSON.parse(`[${clean}]`);
        return normalizeSegments(json);
      } catch (e) {}
    }

    // Fallback: Plain Text
    return clean
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((text, i) => ({
        id: `SEG_${String(i + 1).padStart(3, '0')}`,
        text: text
      }));
  };

  const processJob = async (job: ScriptJob) => {
    // FIX: Get style from the job's styleId
    const style = useAppStore.getState().styles.find(s => s.id === job.styleId);
    
    if (!style) {
      addLog(job.id, `❌ Style '${job.styleId}' not found. It might have been deleted.`);
      updateJob(job.id, { status: "ERROR" });
      return;
    }

    try {
      // 0. PREPARE DATA
      const segments = parseVoiceData(job.voiceData);
      
      if (segments.length === 0) {
        throw new Error("Input data is empty. Please provide voice text or JSON.");
      }
      addLog(job.id, `📝 Parsed ${segments.length} voice segments.`);

      // Local variables to hold data as we progress through steps
      let currentBible: CharacterBible | undefined = job.characterBible;
      let currentSnippet: PromptSnippet[] | undefined = job.characterSnippet;

      // -----------------------------------------------------------------------
      // STEP 1: CHARACTER EXTRACTION (V2 Pipeline)
      // -----------------------------------------------------------------------
      if (!currentBible) {
        addLog(job.id, "🧬 [Step 1/3] Running Character Extraction Agent...");
        updateJob(job.id, { status: "PROCESSING", currentStep: "CHARACTER" });

        currentBible = await runCharacterAgent({
          input: segments, 
          system: style.characterSystem, // V2 Key
          useThinking: job.useThinkingModel,
        });

        updateJob(job.id, { characterBible: currentBible });
        addLog(job.id, `✅ Character Bible created with ${currentBible.characters?.length || 0} characters.`);
      } else {
        addLog(job.id, "⏭️ Character Bible already exists. Skipping step.");
      }

      // -----------------------------------------------------------------------
      // STEP 2: PROMPT SNIPPET GENERATION (V2 Pipeline)
      // -----------------------------------------------------------------------
      if (!currentSnippet) {
        addLog(job.id, "🎨 [Step 2/3] Generating Visual Prompts...");
        updateJob(job.id, { currentStep: "SNIPPET" });

        if (!currentBible) throw new Error("Character Bible is missing. Cannot proceed to snippets.");

        currentSnippet = await runSnippetAgent({
          input: currentBible,
          system: style.snippetSystem, // V2 Key
          useThinking: job.useThinkingModel,
        });

        // Ensure array type
        const snippetArray = Array.isArray(currentSnippet) ? currentSnippet : [currentSnippet];
        updateJob(job.id, { characterSnippet: snippetArray });
        addLog(job.id, "✨ Prompt Snippets created.");
      } else {
         addLog(job.id, "⏭️ Prompt Snippets already exists. Skipping step.");
      }

      // -----------------------------------------------------------------------
      // STEP 3: SCENE GENERATION (V2 Pipeline)
      // -----------------------------------------------------------------------
      addLog(job.id, "🎬 [Step 3/3] Generating Scenes...");
      updateJob(job.id, { currentStep: "SCENE" });

      if (!currentSnippet) throw new Error("Prompt Snippet is missing. Cannot proceed to scenes.");

      const allScenes: Scene[] = [];
      const BATCH = style.sceneBatchSize;
      const DELAY = style.sceneDelayMs;
      
      const totalBatches = Math.ceil(segments.length / BATCH);
      let currentBatch = 0;

      // Ensure we haven't already generated all scenes (resume capability)
      const existingScenesCount = job.scenes.length;
      if (existingScenesCount === segments.length) {
         addLog(job.id, "⏭️ All scenes already generated. Completing job.");
         allScenes.push(...job.scenes);
      } else {
        // Start from where we left off (simplified: start from 0 for now to ensure consistency, or simple skip)
        // For robustness, we regenerate unless fully done, to avoid mismatches.
        
        for (let i = 0; i < segments.length; i += BATCH) {
          currentBatch++;
          const currentJobState = useAppStore.getState().scriptJobs.find(j => j.id === job.id);
          if (!currentJobState || currentJobState.status === 'ERROR') break; 

          const batchSegments = segments.slice(i, i + BATCH);
          const startSceneNum = i + 1;
          const endSceneNum = i + batchSegments.length;
          
          addLog(job.id, `🔄 Batch ${currentBatch}/${totalBatches}: Processing Scenes ${startSceneNum} - ${endSceneNum}...`);
          
          const sceneBatch = await runSceneAgent({
            segments: batchSegments,
            characterSnippet: currentSnippet,
            system: style.sceneSystem, // V2 Key
            useThinking: job.useThinkingModel,
          });

          allScenes.push(...sceneBatch);
          updateJob(job.id, { scenes: [...allScenes] });

          addLog(job.id, `✅ Batch ${currentBatch} Done.`);

          if (i + BATCH < segments.length) {
            addLog(job.id, `⏳ Cooling down (${DELAY / 1000}s)...`);
            await new Promise((r) => setTimeout(r, DELAY));
          }
        }
      }

      // COMPLETE JOB
      const finalJobState = useAppStore.getState().scriptJobs.find(j => j.id === job.id);
      if (finalJobState && finalJobState.status !== 'ERROR') {
          updateJob(job.id, { status: "COMPLETED", currentStep: "DONE" });
          addLog(job.id, "🏁 Job Completed Successfully!");
      }

    } catch (err: any) {
      console.error(err);
      addLog(job.id, "❌ Error: " + err.message);
      updateJob(job.id, { status: "ERROR", error: err.message });
    }
  };

  const runQueue = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      while (true) {
        if (!useAppStore.getState().isProcessingQueue) break;

        // V2 Queue Engine: Auto-find next IDLE or QUEUED job
        const nextJob = useAppStore.getState().scriptJobs.find(
          (job) => job.status === "IDLE" || job.status === "QUEUED"
        );

        if (!nextJob) break;

        addLog(nextJob.id, "🚀 Starting job execution...");
        await processJob(nextJob);
      }
    } finally {
      setProcessingQueue(false);
      isRunning = false;
    }
  };

  useEffect(() => {
    if (isProcessingQueue) {
      runQueue();
    }
  }, [isProcessingQueue]);

  return null;
};