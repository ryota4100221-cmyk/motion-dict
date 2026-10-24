// 和文は 400 / 700 の2ウェイトに絞る（Framerは和文をサブセットできず、1ウェイト約1.6MB）
const H = { pagePath: "/" };
const r = await framer.agent.applyChanges(`
SET jCG_TzbUJ fontWeight="700";
SET vwtGgJ1P6jCG_TzbUJ fontWeight="700";
SET wJLcvxZcJjCG_TzbUJ fontWeight="700";
SET agzHSM6a7 fontWeight="400"; SET KF2nLZlN0 fontWeight="400"; SET Nqhb035Pg fontWeight="400";
SET vwtGgJ1P6agzHSM6a7 fontWeight="400"; SET vwtGgJ1P6KF2nLZlN0 fontWeight="400"; SET vwtGgJ1P6Nqhb035Pg fontWeight="400";
SET wJLcvxZcJagzHSM6a7 fontWeight="400"; SET wJLcvxZcJKF2nLZlN0 fontWeight="400"; SET wJLcvxZcJNqhb035Pg fontWeight="400";
`, H);
console.log(JSON.stringify(r).slice(0, 300));
const pv = await framer.agent.publish({ action: "preview" });
const c = await framer.agent.publish({ action: "confirm_publish", confirmationHash: pv.confirmationHash }); console.log(c.status);
