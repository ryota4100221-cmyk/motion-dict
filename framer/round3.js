const D = { pagePath: "/entries/:Entries" }, H = { pagePath: "/" };
let r = await framer.agent.applyChanges(`
SET l3SYMs6TP maxWidth="1440px" padding="56px 40px 104px 40px" gap="80px";
SET onm7Q3akY maxWidth="895px" padding="0px 0px 0px 115px";
SET P3tnExolP maxWidth="895px" padding="0px 0px 0px 115px";
SET wVCo5rUp6 maxWidth="100%" padding="0px 0px 0px 115px";
SET X3cJ30duMonm7Q3akY padding="0px";
SET X3cJ30duMP3tnExolP padding="0px";
SET X3cJ30duMwVCo5rUp6 padding="0px";
SET WbA7d4i2Nonm7Q3akY padding="0px";
SET WbA7d4i2NP3tnExolP padding="0px";
SET WbA7d4i2NwVCo5rUp6 padding="0px";
SET X3cJ30duMl3SYMs6TP padding="48px 32px 88px 32px";
SET WbA7d4i2Nl3SYMs6TP padding="40px 16px 72px 16px" gap="56px";
`, D);
console.log('detail', JSON.stringify(r).slice(0, 400));
r = await framer.agent.applyChanges(`SET aaewKdWfI width="640px"; SET DQ9USuZxi gap="48px";`, H);
console.log('home', JSON.stringify(r).slice(0, 300));
