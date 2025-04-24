import {
  apiGateway,
  cleanupResources,
  cleanUpTestState,
  loginUser,
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

  test("1. Register new user", async () => {
    const response = await registerUser(testState.currentTestUser);

    expect(response.status).toBe(201);
    expect(response.body.email).toBe(testState.currentTestUser.email);
  });

  test("2. Login with new user", async () => {
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

  test("3. Create first account (current)", async () => {
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

  test("4. Create second account (savings)", async () => {
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

  test("5. List all accounts", async () => {
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

  test("6. Internal credit", async () => {
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

  test("7. Internal debit", async () => {
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

  test("8. List all accounts & check balance", async () => {
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

  test("9. Delete first account", async () => {
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

  test("10. Logout user", async () => {
    const response = await apiGateway()
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${testState.authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("logged out successfully");
    testState.authToken = "";
  });
});
