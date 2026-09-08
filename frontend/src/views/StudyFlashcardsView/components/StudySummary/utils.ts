export function getCelebrationMessage(masteryPercentage: number): {
  title: string;
  subtitle: string;
} {
  if (masteryPercentage === 100) {
    return {
      title: 'Flawless Mastery! 🎉',
      subtitle: 'You answered every single card correctly in this round. Incredible recall!',
    };
  }
  if (masteryPercentage >= 80) {
    return {
      title: 'Outstanding Work!',
      subtitle: "You've mastered the vast majority of these flashcards. Almost there!",
    };
  }
  if (masteryPercentage >= 50) {
    return {
      title: 'Solid Progress!',
      subtitle: 'You are halfway there. Reviewing the cards you missed will solidify your recall.',
    };
  }
  return {
    title: 'Round Complete!',
    subtitle: 'Active recall takes practice. Try a round focused just on the cards that need work!',
  };
}
