import { config } from "./config";
import { AccountType } from "./type";
import {
  apiGateway,
  cleanupResources,
  cleanUpTestState,
  loginUser,
  proxyCentralBankService,
  registerUser,
  testState,
} from "./utils";

describe("Complete End-to-End Flow", () => {
  beforeAll(async () => {
    cleanUpTestState();
  });

  afterAll(async () => {
    await cleanupResources();
  });

  test("Register new user", async () => {
    const response = await registerUser(testState.currentTestUser);

    expect(response.status).toBe(201);
    expect(response.body.email).toBe(testState.currentTestUser.email);
  });

  test("Login with new user", async () => {
    const response = await loginUser({
      email: testState.currentTestUser.email,
      password: testState.currentTestUser.password,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(typeof response.body.token).toBe("string");
    expect(response.body.token).not.toBe("");

    expect(testState.authToken).not.toBe("");
  });

  test("Create first account (current)", async () => {
    const response = await apiGateway()
      .post("/api/v1/accounts")
      .set("Authorization", `Bearer ${testState.authToken}`)
      .send({
        accountType: "current",
        accountName: "E2E Current Account",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("accountType", "current");
    expect(response.body).toHaveProperty("accountName", "E2E Current Account");
    expect(response.body).toHaveProperty("balance", 0);

    testState.accounts.push(response.body);
  });

  test("Create second account (savings)", async () => {
    const response = await apiGateway()
      .post("/api/v1/accounts")
      .set("Authorization", `Bearer ${testState.authToken}`)
      .send({
        accountType: "savings",
        accountName: "E2E Savings Account",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("accountType", "savings");
    expect(response.body).toHaveProperty("accountName", "E2E Savings Account");
    expect(response.body).toHaveProperty("balance", 0);

    testState.accounts.push(response.body);
  });

  test("List all accounts", async () => {
    const response = await apiGateway()
      .get("/api/v1/accounts")
      .set("Authorization", `Bearer ${testState.authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(2);

    const accountNumbers = response.body.map(
      (account: any) => account.accountNumber
    );

    for (const { accountNumber } of testState.accounts) {
      expect(accountNumbers).toContain(accountNumber);
    }
  });

  test("Internal credit", async () => {
    const amount = 10900.01;

    const response = await apiGateway()
      .post("/api/v1/accounts/internal/transaction")
      .set("Authorization", `Bearer ${testState.authToken}`)
      .send({
        accountNumber: testState.accounts[0].accountNumber,
        amount: amount,
        type: "credit",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "account transaction credit completed"
    );
    expect(response.body).toHaveProperty("availableBalance", amount);
    testState.accounts[0].balance = response.body.availableBalance;
  });

  test("Internal debit", async () => {
    const amount = 900.02;

    const response = await apiGateway()
      .post("/api/v1/accounts/internal/transaction")
      .set("Authorization", `Bearer ${testState.authToken}`)
      .send({
        accountNumber: testState.accounts[0].accountNumber,
        amount: amount,
        type: "debit",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "account transaction debit completed"
    );
    expect(response.body).toHaveProperty("availableBalance", 9999.99);

    testState.accounts[0].balance = response.body.availableBalance;
  });

  test("List all accounts & check balance", async () => {
    const response = await apiGateway()
      .get("/api/v1/accounts")
      .set("Authorization", `Bearer ${testState.authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(2);

    const currentAccount = response.body.find(
      (account: any) =>
        account.accountNumber === testState.accounts[0].accountNumber
    );

    expect(currentAccount.balance).toBe(testState.accounts[0].balance);
  });

  test("Transfer money between internal accounts should success", async () => {
    const amount = 1000;

    const response = await apiGateway()
      .post("/api/v1/transactions/transfer")
      .set("Authorization", `Bearer ${testState.authToken}`)
      .send({
        sourceAccountNumber: testState.accounts[0].accountNumber,
        destinationAccountNumber: testState.accounts[1].accountNumber,
        amount,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("status", "initiated");
    expect(response.body).toHaveProperty("transactionId");
    expect(response.body.transactionId).toContain("VBNK");

    const transactionId = response.body.transactionId;

    await new Promise((resolve, reject) => {
      let intervalCounter = 0;
      const transactionStatusInterval = setInterval(async () => {
        intervalCounter++;
        if (intervalCounter > 5) {
          clearInterval(transactionStatusInterval);
          reject();
          return;
        }

        const statusResponse = await apiGateway()
          .get(`/api/v1/transactions/${transactionId}`)
          .set("Authorization", `Bearer ${testState.authToken}`);

        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body).toHaveProperty("amount", amount);

        const status = statusResponse.body.status;

        if (status === "completed") {
          clearInterval(transactionStatusInterval);
          expect(statusResponse.body.sourceDebitedAt).not.toBeNull();
          expect(statusResponse.body.completedAt).not.toBeNull();
          expect(statusResponse.body.destinationCreditedAt).not.toBeNull();

          expect(statusResponse.body.compensatedAt).toBeNull();

          const finalSourceAccountBalance =
            testState.accounts[0].balance - amount;
          const finalDestinationAccountBalance =
            testState.accounts[1].balance + amount;
          await refreshAccounts();
          expect(testState.accounts[0].balance).toBe(finalSourceAccountBalance);
          expect(testState.accounts[1].balance).toBe(
            finalDestinationAccountBalance
          );

          resolve(statusResponse.body);
        }
      }, 1000);
    });
  });

  test("Transfer: invalid source account number should fail", async () => {
    const amount = 1000;

    const response = await apiGateway()
      .post("/api/v1/transactions/transfer")
      .set("Authorization", `Bearer ${testState.authToken}`)
      .send({
        sourceAccountNumber: testState.accounts[0].accountNumber + "001",
        destinationAccountNumber: testState.accounts[1].accountNumber,
        amount: amount,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("status", "initiated");
    expect(response.body).toHaveProperty("transactionId");
    expect(response.body.transactionId).toContain("VBNK");

    const transactionId = response.body.transactionId;

    await new Promise((resolve, reject) => {
      let intervalCounter = 0;
      const transactionStatusInterval = setInterval(async () => {
        intervalCounter++;
        if (intervalCounter > 5) {
          clearInterval(transactionStatusInterval);
          reject();
          return;
        }

        const statusResponse = await apiGateway()
          .get(`/api/v1/transactions/${transactionId}`)
          .set("Authorization", `Bearer ${testState.authToken}`);

        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body).toHaveProperty("amount", amount);

        const status = statusResponse.body.status;

        if (status === "failed") {
          clearInterval(transactionStatusInterval);
          expect(statusResponse.body.sourceDebitedAt).toBeNull();
          expect(statusResponse.body.destinationCreditedAt).toBeNull();
          expect(statusResponse.body.compensatedAt).toBeNull();

          expect(statusResponse.body.completedAt).not.toBeNull();

          const finalSourceAccountBalance = testState.accounts[0].balance;
          const finalDestinationAccountBalance = testState.accounts[1].balance;
          await refreshAccounts();
          expect(testState.accounts[0].balance).toBe(finalSourceAccountBalance);
          expect(testState.accounts[1].balance).toBe(
            finalDestinationAccountBalance
          );

          resolve(statusResponse.body);
        }
      }, 1000);
    });
  });

  test("Transfer: invalid destination account number should fail and compensate", async () => {
    const amount = 1000;

    const response = await apiGateway()
      .post("/api/v1/transactions/transfer")
      .set("Authorization", `Bearer ${testState.authToken}`)
      .send({
        sourceAccountNumber: testState.accounts[0].accountNumber,
        destinationAccountNumber: testState.accounts[1].accountNumber + "001",
        amount: amount,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("status", "initiated");
    expect(response.body).toHaveProperty("transactionId");
    expect(response.body.transactionId).toContain("VBNK");

    const transactionId = response.body.transactionId;

    await new Promise((resolve, reject) => {
      let intervalCounter = 0;
      const transactionStatusInterval = setInterval(async () => {
        intervalCounter++;
        if (intervalCounter > 5) {
          clearInterval(transactionStatusInterval);
          reject();
          return;
        }

        const statusResponse = await apiGateway()
          .get(`/api/v1/transactions/${transactionId}`)
          .set("Authorization", `Bearer ${testState.authToken}`);

        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body).toHaveProperty("amount", amount);

        const status = statusResponse.body.status;

        if (status === "failed") {
          clearInterval(transactionStatusInterval);
          expect(statusResponse.body.destinationCreditedAt).toBeNull();

          expect(statusResponse.body.sourceDebitedAt).not.toBeNull();
          expect(statusResponse.body.compensatedAt).not.toBeNull();
          expect(statusResponse.body.completedAt).not.toBeNull();

          const finalSourceAccountBalance = testState.accounts[0].balance;
          const finalDestinationAccountBalance = testState.accounts[1].balance;
          await refreshAccounts();
          expect(testState.accounts[0].balance).toBe(finalSourceAccountBalance);
          expect(testState.accounts[1].balance).toBe(
            finalDestinationAccountBalance
          );

          resolve(statusResponse.body);
        }
      }, 1000);
    });
  });

  test("Transfer: insufficient funds - should fail", async () => {
    const amount = 1000000;

    const response = await apiGateway()
      .post("/api/v1/transactions/transfer")
      .set("Authorization", `Bearer ${testState.authToken}`)
      .send({
        sourceAccountNumber: testState.accounts[0].accountNumber,
        destinationAccountNumber: testState.accounts[1].accountNumber + "001",
        amount: amount,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("status", "initiated");
    expect(response.body).toHaveProperty("transactionId");
    expect(response.body.transactionId).toContain("VBNK");

    const transactionId = response.body.transactionId;

    await new Promise((resolve, reject) => {
      let intervalCounter = 0;
      const transactionStatusInterval = setInterval(async () => {
        intervalCounter++;
        if (intervalCounter > 5) {
          clearInterval(transactionStatusInterval);
          reject();
          return;
        }

        const statusResponse = await apiGateway()
          .get(`/api/v1/transactions/${transactionId}`)
          .set("Authorization", `Bearer ${testState.authToken}`);

        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body).toHaveProperty("amount", amount);

        const status = statusResponse.body.status;

        if (status === "failed") {
          clearInterval(transactionStatusInterval);
          expect(statusResponse.body.destinationCreditedAt).toBeNull();
          expect(statusResponse.body.sourceDebitedAt).toBeNull();
          expect(statusResponse.body.compensatedAt).toBeNull();
          expect(statusResponse.body.completedAt).not.toBeNull();

          const finalSourceAccountBalance = testState.accounts[0].balance;
          const finalDestinationAccountBalance = testState.accounts[1].balance;
          await refreshAccounts();
          expect(testState.accounts[0].balance).toBe(finalSourceAccountBalance);
          expect(testState.accounts[1].balance).toBe(
            finalDestinationAccountBalance
          );

          resolve(statusResponse.body);
        }
      }, 1000);
    });
  });

  test("External Transfer: outbound should success", async () => {
    const amount = 200; // this is to trigger success case in proxy central bank service

    const response = await apiGateway()
      .post("/api/v1/transactions/transfer/external/outbound")
      .set("Authorization", `Bearer ${testState.authToken}`)
      .send({
        sourceAccountNumber: testState.accounts[0].accountNumber,
        destinationAccountNumber: "111111111111111",
        sourceBankCode: "VBANK",
        destinationBankCode: "SBANK",
        note: "Test transfer success",
        amount: amount,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("status", "initiated");
    expect(response.body).toHaveProperty("transactionId");
    expect(response.body.transactionId).toContain("VBNK");

    const transactionId = response.body.transactionId;
    const referenceId = response.body.referenceId;

    await new Promise((resolve, reject) => {
      let intervalCounter = 0;
      const transactionStatusInterval = setInterval(async () => {
        intervalCounter++;
        if (intervalCounter > 10) {
          clearInterval(transactionStatusInterval);
          reject();
          return;
        }

        const statusResponse = await apiGateway()
          .get(`/api/v1/transactions/${transactionId}`)
          .set("Authorization", `Bearer ${testState.authToken}`);

        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body).toHaveProperty("amount", amount);

        const status = statusResponse.body.status;

        if (status === "completed") {
          clearInterval(transactionStatusInterval);
          expect(statusResponse.body.referenceId).toBe(referenceId);

          expect(statusResponse.body.sourceDebitedAt).not.toBeNull();
          expect(statusResponse.body.completedAt).not.toBeNull();
          expect(statusResponse.body.destinationCreditedAt).not.toBeNull();

          expect(statusResponse.body.compensatedAt).toBeNull();

          expect(statusResponse.body.destinationBankCode).toBe("SBANK");
          expect(statusResponse.body.sourceBankCode).toBe("VBANK");
          expect(statusResponse.body.destinationAccountNumber).toBe(
            "111111111111111"
          );
          expect(statusResponse.body.sourceAccountNumber).toBe(
            testState.accounts[0].accountNumber
          );
          expect(statusResponse.body.note).toBe("Test transfer success");

          const finalSourceAccountBalance =
            testState.accounts[0].balance - amount;
          await refreshAccounts();
          expect(testState.accounts[0].balance).toBe(finalSourceAccountBalance);

          resolve(statusResponse.body);
        }
      }, 2000);
    });
  });

  test("External Transfer: outbound should fail and compensate", async () => {
    const amount = 400; // this is to trigger failure case in proxy central bank service

    const response = await apiGateway()
      .post("/api/v1/transactions/transfer/external/outbound")
      .set("Authorization", `Bearer ${testState.authToken}`)
      .send({
        sourceAccountNumber: testState.accounts[0].accountNumber,
        destinationAccountNumber: "111111111111111",
        sourceBankCode: "VBANK",
        destinationBankCode: "SBANK",
        note: "Test transfer failure",
        amount: amount,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("status", "initiated");
    expect(response.body).toHaveProperty("transactionId");
    expect(response.body.transactionId).toContain("VBNK");

    const transactionId = response.body.transactionId;
    const referenceId = response.body.referenceId;

    await new Promise((resolve, reject) => {
      let intervalCounter = 0;
      const transactionStatusInterval = setInterval(async () => {
        intervalCounter++;
        if (intervalCounter > 10) {
          clearInterval(transactionStatusInterval);
          reject();
          return;
        }

        const statusResponse = await apiGateway()
          .get(`/api/v1/transactions/${transactionId}`)
          .set("Authorization", `Bearer ${testState.authToken}`);

        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body).toHaveProperty("amount", amount);

        const status = statusResponse.body.status;

        if (status === "failed") {
          clearInterval(transactionStatusInterval);
          expect(statusResponse.body.referenceId).toBe(referenceId);
          expect(statusResponse.body.destinationCreditedAt).toBeNull();

          expect(statusResponse.body.sourceDebitedAt).not.toBeNull();
          expect(statusResponse.body.compensatedAt).not.toBeNull();
          expect(statusResponse.body.completedAt).not.toBeNull();

          expect(statusResponse.body.destinationBankCode).toBe("SBANK");
          expect(statusResponse.body.sourceBankCode).toBe("VBANK");
          expect(statusResponse.body.destinationAccountNumber).toBe(
            "111111111111111"
          );
          expect(statusResponse.body.sourceAccountNumber).toBe(
            testState.accounts[0].accountNumber
          );
          expect(statusResponse.body.note).toBe("Test transfer failure");

          const finalSourceAccountBalance = testState.accounts[0].balance;
          await refreshAccounts();
          expect(testState.accounts[0].balance).toBe(finalSourceAccountBalance);

          resolve(statusResponse.body);
        }
      }, 2000);
    });
  });

  test("External Transfer: outbound should fail due to insufficient funds", async () => {
    const amount = 1000000;

    const response = await apiGateway()
      .post("/api/v1/transactions/transfer/external/outbound")
      .set("Authorization", `Bearer ${testState.authToken}`)
      .send({
        sourceAccountNumber: testState.accounts[0].accountNumber,
        destinationAccountNumber: "111111111111111",
        sourceBankCode: "VBANK",
        destinationBankCode: "SBANK",
        note: "Test transfer insufficient funds",
        amount: amount,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("status", "initiated");
    expect(response.body).toHaveProperty("transactionId");
    expect(response.body.transactionId).toContain("VBNK");

    const transactionId = response.body.transactionId;
    const referenceId = response.body.referenceId;

    await new Promise((resolve, reject) => {
      let intervalCounter = 0;
      const transactionStatusInterval = setInterval(async () => {
        intervalCounter++;
        if (intervalCounter > 10) {
          clearInterval(transactionStatusInterval);
          reject();
          return;
        }

        const statusResponse = await apiGateway()
          .get(`/api/v1/transactions/${transactionId}`)
          .set("Authorization", `Bearer ${testState.authToken}`);

        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body).toHaveProperty("amount", amount);

        const status = statusResponse.body.status;

        if (status === "failed") {
          clearInterval(transactionStatusInterval);

          expect(statusResponse.body.referenceId).toBe(referenceId);
          expect(statusResponse.body.destinationCreditedAt).toBeNull();
          expect(statusResponse.body.sourceDebitedAt).toBeNull();
          expect(statusResponse.body.compensatedAt).toBeNull();

          expect(statusResponse.body.completedAt).not.toBeNull();

          expect(statusResponse.body.destinationBankCode).toBe("SBANK");
          expect(statusResponse.body.sourceBankCode).toBe("VBANK");
          expect(statusResponse.body.destinationAccountNumber).toBe(
            "111111111111111"
          );
          expect(statusResponse.body.sourceAccountNumber).toBe(
            testState.accounts[0].accountNumber
          );
          expect(statusResponse.body.note).toBe(
            "Test transfer insufficient funds"
          );

          const finalSourceAccountBalance = testState.accounts[0].balance;
          await refreshAccounts();
          expect(testState.accounts[0].balance).toBe(finalSourceAccountBalance);

          resolve(statusResponse.body);
        }
      }, 2000);
    });
  });

  test("External Transfer: inbound should success", async () => {
    const amount = 1000;

    // Simulate an external transfer from another bank to VBANK via central bank
    const cbResponse = await proxyCentralBankService()
      .post("/api/v1/transfers/outbound")
      .set("x-api-key", config.centralBankServiceApiKey)
      .send({
        sourceAccount: "222222222222222",
        destinationAccount: testState.accounts[1].accountNumber,
        sourceBankCode: "SBANK",
        destinationBankCode: "VBANK",
        note: "Test transfer success",
        amount,
      });

    expect(cbResponse.status).toBe(200);
    expect(cbResponse.body).toHaveProperty("status", "PENDING");

    const referenceId = cbResponse.body.transferId;

    await new Promise((resolve, reject) => {
      let intervalCounter = 0;
      const transactionStatusInterval = setInterval(async () => {
        intervalCounter++;
        if (intervalCounter > 10) {
          clearInterval(transactionStatusInterval);
          reject();
          return;
        }

        const statusResponse = await apiGateway()
          .get(`/api/v1/transactions/by-reference/${referenceId}`)
          .set("Authorization", `Bearer ${testState.authToken}`);

        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body).toHaveProperty("amount", amount);

        const status = statusResponse.body.status;

        if (status === "completed") {
          clearInterval(transactionStatusInterval);
          expect(statusResponse.body.referenceId).toBe(referenceId);

          expect(statusResponse.body.sourceDebitedAt).not.toBeNull();
          expect(statusResponse.body.completedAt).not.toBeNull();
          expect(statusResponse.body.destinationCreditedAt).not.toBeNull();

          expect(statusResponse.body.compensatedAt).toBeNull();

          expect(statusResponse.body.destinationBankCode).toBe("VBANK");
          expect(statusResponse.body.sourceBankCode).toBe("SBANK");
          expect(statusResponse.body.destinationAccountNumber).toBe(
            testState.accounts[1].accountNumber
          );
          expect(statusResponse.body.sourceAccountNumber).toBe(
            "222222222222222"
          );
          expect(statusResponse.body.note).toBe("Test transfer success");

          const finalDestinationAccountBalance =
            testState.accounts[1].balance + amount;
          await refreshAccounts();
          expect(testState.accounts[1].balance).toBe(
            finalDestinationAccountBalance
          );

          resolve(statusResponse.body);
        }
      }, 2000);
    });
  });

  test("External Transfer: inbound should fail due to invalid vbank destination account", async () => {
    const amount = 1000;

    // Simulate an external transfer from another bank to VBANK via central bank
    const cbResponse = await proxyCentralBankService()
      .post("/api/v1/transfers/outbound")
      .set("x-api-key", config.centralBankServiceApiKey)
      .send({
        sourceAccount: "222222222222222",
        destinationAccount: testState.accounts[1].accountNumber + "001",
        sourceBankCode: "SBANK",
        destinationBankCode: "VBANK",
        note: "Test transfer failure invalid destination account",
        amount,
      });

    expect(cbResponse.status).toBe(200);
    expect(cbResponse.body).toHaveProperty("status", "PENDING");

    const referenceId = cbResponse.body.transferId;

    await new Promise((resolve, reject) => {
      let intervalCounter = 0;
      const transactionStatusInterval = setInterval(async () => {
        intervalCounter++;
        if (intervalCounter > 10) {
          clearInterval(transactionStatusInterval);
          reject();
          return;
        }

        const statusResponse = await apiGateway()
          .get(`/api/v1/transactions/by-reference/${referenceId}`)
          .set("Authorization", `Bearer ${testState.authToken}`);

        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body).toHaveProperty("amount", amount);

        const status = statusResponse.body.status;

        if (status === "failed") {
          clearInterval(transactionStatusInterval);
          expect(statusResponse.body.referenceId).toBe(referenceId);
          expect(statusResponse.body.destinationCreditedAt).toBeNull();

          expect(statusResponse.body.sourceDebitedAt).not.toBeNull();
          expect(statusResponse.body.completedAt).not.toBeNull();

          expect(statusResponse.body.compensatedAt).toBeNull();

          expect(statusResponse.body.destinationBankCode).toBe("VBANK");
          expect(statusResponse.body.sourceBankCode).toBe("SBANK");
          expect(statusResponse.body.destinationAccountNumber).toBe(
            testState.accounts[1].accountNumber + "001"
          );
          expect(statusResponse.body.sourceAccountNumber).toBe(
            "222222222222222"
          );
          expect(statusResponse.body.note).toBe(
            "Test transfer failure invalid destination account"
          );

          const finalDestinationAccountBalance = testState.accounts[1].balance;
          await refreshAccounts();
          expect(testState.accounts[1].balance).toBe(
            finalDestinationAccountBalance
          );

          resolve(statusResponse.body);
        }
      }, 2000);
    });
  });

  test("Delete first account", async () => {
    const accountToDelete = testState.accounts[0];

    const response = await apiGateway()
      .delete(`/api/v1/accounts/${accountToDelete.accountNumber}`)
      .set("Authorization", `Bearer ${testState.authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("deleted");

    testState.accounts = testState.accounts.filter(
      (account) => account.accountNumber !== accountToDelete.accountNumber
    );
  });

  test("Logout user", async () => {
    const response = await apiGateway()
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${testState.authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("logged out successfully");
    testState.authToken = "";
  });
});

async function refreshAccounts() {
  const response = await apiGateway()
    .get("/api/v1/accounts/")
    .set("Authorization", `Bearer ${testState.authToken}`);

  const accounts = response.body;

  testState.accounts[0] = accounts.find(
    (account: AccountType) =>
      account.accountNumber === testState.accounts[0].accountNumber
  );

  testState.accounts[1] = accounts.find(
    (account: AccountType) =>
      account.accountNumber === testState.accounts[1].accountNumber
  );
}
