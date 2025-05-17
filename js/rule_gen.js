const networkGenerator = new DNRRuleGenerator();
networkGenerator.loadFromFile("../easylist/easylist.txt");
networkGenerator.exportToFile("../ruleset/dnrList-network.json");

const privacyGenerator = new DNRRuleGenerator();
privacyGenerator.loadFromFile("../easylist/easyprivacy.txt");
privacyGenerator.exportToFile("../ruleset/dnrList-privacy.json");