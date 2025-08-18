"use client";
export default function Gamification() {
  const streak = 10;
  const badges = ["100% Attendance", "Most Improved Student"];
  const leaderboard = [
    { name: "Priya", score: 98 },
    { name: "Alex", score: 95 },
    { name: "John", score: 92 },
  ];
  return (
    <div className="p-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-yellow-700">Gamification</h2>
      <div className="mb-4">
        <span className="font-semibold">Attendance Streak:</span>
        <span className="ml-2 text-green-600 font-bold">{streak} days 🎉</span>
      </div>
      <div className="mb-4">
        <span className="font-semibold">Badges:</span>
        <ul className="ml-4 list-disc">
          {badges.map((badge) => (
            <li key={badge} className="text-blue-600 font-semibold">{badge}</li>
          ))}
        </ul>
      </div>
      <div>
        <span className="font-semibold">Leaderboard:</span>
        <ol className="ml-4 list-decimal">
          {leaderboard.map((entry, idx) => (
            <li key={entry.name} className="text-purple-600 font-semibold">{entry.name} - {entry.score}%</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
