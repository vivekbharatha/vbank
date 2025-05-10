const Sequencer = require("@jest/test-sequencer").default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Define the test execution order
    const testOrder = [
      "01-health-check.test",
      "02-auth.test",
      "03-account.test",
      "04-complete-flow.test",
    ];

    return tests.sort((testA, testB) => {
      const indexA = testOrder.findIndex((filename) =>
        testA.path.includes(filename)
      );
      const indexB = testOrder.findIndex((filename) =>
        testB.path.includes(filename)
      );

      return indexA - indexB;
    });
  }
}

module.exports = CustomSequencer;
