import { testState, loginUser, cleanupResources, apiGateway } from "./utils";

describe("Account Service Tests", () => {
  beforeAll(async () => {
    if (!testState.authToken) {
      await loginUser({
        email: testState.currentTestUser.email,
        password: testState.currentTestUser.password,
      });
    }
  });

  afterAll(async () => {
    await cleanupResources();
  });

  test("Create account should return 201 Created", async () => {
    const response = await apiGateway()
      .post("/api/v1/accounts")
      .set("Authorization", `Bearer ${testState.authToken}`)
      .send({
        accountType: "current",
        accountName: "Test Current Account",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("accountType", "current");
    expect(response.body).toHaveProperty("accountName", "Test Current Account");

    testState.accounts.push(response.body);
  });

  test("Create another account should return 201 Created", async () => {
    const response = await apiGateway()
      .post("/api/v1/accounts")
      .set("Authorization", `Bearer ${testState.authToken}`)
      .send({
        accountType: "savings",
        accountName: "Test Savings Account",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("accountType", "savings");
    expect(response.body).toHaveProperty("accountName", "Test Savings Account");

    testState.accounts.push(response.body);
  });

  test("List accounts should return 200 OK and array of accounts", async () => {
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

  test("internal credit transaction should return 200", async () => {
    const amount = 10000.01;

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

  test("internal debit transaction should return 400", async () => {
    const amount = 10000.02;

    const response = await apiGateway()
      .post("/api/v1/accounts/internal/transaction")
      .set("Authorization", `Bearer ${testState.authToken}`)
      .send({
        accountNumber: testState.accounts[0].accountNumber,
        amount: amount,
        type: "debit",
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("status", "error");
    expect(response.body).toHaveProperty("message", "insufficient balance");
  });

  test("internal debit transaction should return 200", async () => {
    const amount = 1000.04;

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
    expect(response.body).toHaveProperty("availableBalance", 8999.97);

    testState.accounts[0].balance = response.body.availableBalance;
  });

  test("Delete account should return 200 OK", async () => {
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

  test("List accounts should throw 401 with logged out token", async () => {
    const loggedOutResponse = await apiGateway()
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${testState.authToken}`);

    expect(loggedOutResponse.status).toBe(200);
    expect(loggedOutResponse.body).toHaveProperty("message");
    expect(loggedOutResponse.body.message).toBe("logged out successfully");

    const response = await apiGateway()
      .get("/api/v1/accounts")
      .set("Authorization", `Bearer ${testState.authToken}`);

    expect(testState.authToken).not.toBe("");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "unauthorized");

    testState.authToken = "";
  });
});
