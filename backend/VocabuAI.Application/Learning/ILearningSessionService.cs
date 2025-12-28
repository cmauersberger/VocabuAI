using VocabuAI.Domain.Learning;

namespace VocabuAI.Application.Learning;

public interface ILearningSessionService
{
    LearningSession CreateSession(int userId, int taskCount, IReadOnlyList<LearningFlashCard> flashCards);
}
