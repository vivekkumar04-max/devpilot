import { getPublicRepository } from "../services/githubService.js";
import { createSetupPlan } from "../services/planService.js";
import User from "../models/User.js";

export async function generatePlan(req, res) {
  try {
    const repoUrl = String(req.body?.repoUrl || "").trim();

    if (!repoUrl) {
      return res.status(400).json({
        message: "GitHub repository URL is required.",
      });
    }

    // Fetch repository metadata, README, and file structure.
    const repository = await getPublicRepository(repoUrl);

    // Generate the AI plan or return the labeled fallback.
    const plan = await createSetupPlan(repository);

    // Preserve the existing recent-repository history.
    try {
      const user = await User.findById(req.userId);

      if (user) {
        const repositoryRecord = {
          name: repository.name,
          url: repository.htmlUrl,
          description: repository.description || "",
          language: repository.language || "",
          defaultBranch: repository.defaultBranch || "",
          fileCount: repository.files.length,
          planSummary: plan.summary || "",
          lastAnalyzed: new Date(),
        };

        user.recentRepositories = (
          user.recentRepositories || []
        ).filter((item) => item.url !== repository.htmlUrl);

        user.recentRepositories.unshift(repositoryRecord);

        user.recentRepositories = user.recentRepositories.slice(0, 20);

        await user.save();
      }
    } catch (historyError) {
      // A history failure should not discard a successfully generated plan.
      console.error(
        "[DevPilot] Could not update repository history:",
        historyError.message
      );
    }

    return res.json({
      repository: {
        name: repository.name,
        description: repository.description,
        htmlUrl: repository.htmlUrl,
        defaultBranch: repository.defaultBranch,
        language: repository.language,
        fileCount: repository.files.length,
      },

      plan,
    });
  } catch (error) {
    console.error(
      "[DevPilot] Repository analysis request failed:",
      error.message
    );

    return res.status(500).json({
      message: error.message || "Could not generate setup plan.",
    });
  }
}