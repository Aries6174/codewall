
const activities = [
  {
    date: "10-13",
    time: "20:00",
    message: "Built Tech Stack and About panels",
    type: "UPDATE",
  },
  {
    date: "10-12",
    time: "00:41",
    message: "Portfolio setup complete",
    type: "SYSTEM",
  },
  {
    date: "10-08",
    time: "13:45",
    message: "Designed portfolio concept",
    type: "DESIGN",
  },
  {
    date: "08-28",
    time: "16:33",
    message: "Todo App v1.0 deployed",
    type: "DEPLOY",
  },
];

export default function ActivityPanel() {
  return (
    <section
      id="activity"
      className="border border-[#494538] bg-[#171816] p-3"
    >
      <div className="mb-3 flex items-center justify-between border-b border-[#494538] pb-2">
        <h2 className="text-sm font-bold text-[#F5C542]">
          / RECENT_ACTIVITY
        </h2>

        <span className="text-xs text-[#92958B]">
          SYSTEM_LOG
        </span>
      </div>

      <div className="space-y-2">
        {activities.map((activity, index) => (
          <div
            key={`${activity.date}-${activity.time}`}
            className="flex items-start gap-2 text-xs"
          >
            <span className="shrink-0 text-[#F5C542]">
              [{activity.date} {activity.time}]
            </span>

            <div className="min-w-0 flex-1">
              <p className="leading-5 text-[#E6DDC9]">
                {activity.message}
              </p>

              <p
                className={`mt-0.5 ${
                  activity.type === "DEPLOY"
                    ? "text-[#F5C542]"
                    : activity.type === "DESIGN"
                      ? "text-[#D94B43]"
                      : "text-[#92958B]"
                }`}
              >
                {activity.type}
              </p>
            </div>

            <span className="text-[#494538]">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-[#494538] pt-2">
        <p className="text-xs text-[#92958B]">
          <span className="text-[#F5C542]">●</span>{" "}
          END OF LOG
        </p>
      </div>
    </section>
  );
}
